# LEXAI — Handoff per il CTO

Pacchetto al 12 maggio 2026. MVP funzionante in modalità demo, da prendere come
prototipo per validare il positioning con 2–3 General Counsel, **non** come
codice pronto per produzione.

## Cosa fa in 30 secondi

Tre flussi end-to-end su un corpus legale GCC (6 giurisdizioni, 17 fonti):

1. **AI Assistant** (`/dashboard/assistant`) — chat su corpus, risposte con citazioni articolo-per-articolo.
2. **Document review** (`/dashboard/review`) — upload PDF, segmentazione clausole, risk-flagging con redline e citazioni.
3. **Document generation** (modal dentro AI Assistant) — drafting di NDA / DPA / SHA / Arbitration clause ancorato al corpus.

## Stack

| Layer | Scelta |
|---|---|
| Runtime | Bun |
| Framework | Next.js 16.2 (App Router, Server Components, Turbopack) |
| UI | React 19.2, Tailwind v4, Lucide, Playfair + Inter |
| Database | Supabase Postgres (RLS attiva, pgvector + tsvector pronti) |
| AI | `@anthropic-ai/sdk` 0.90 — Claude Sonnet 4.6 chat + Opus 4.7 drafting, prompt caching |
| PDF | `unpdf` (text-only, no OCR) |

## Setup (5 min)

```sh
git clone <repo> lexai-us && cd lexai-us
bun install
cp .env.local.example .env.local
# riempi .env.local con Supabase + Anthropic keys
psql "$DATABASE_URL" -f supabase/migrations/001_lexai_schema.sql   # se nuova DB
bun src/ingest/seed-demo-corpus.ts                                # carica le 17 fonti demo
bun run dev
```

Poi http://localhost:3000/dashboard.

## Debito tecnico noto (per priorità)

### Bloccanti per la produzione

1. **Auth rimossa.** `src/lib/auth.ts` ritorna sempre un context demo, `src/lib/supabase.ts` usa solo service-role (bypassa RLS). Per ripristinare:
   - Rimettere `createServerClient` (cookies) in `supabase.ts` con anon key.
   - Reintrodurre `src/lib/supabase-browser.ts` (Client Components).
   - Rifare `src/app/(auth)/login/page.tsx`, `register/page.tsx`, `auth/callback/route.ts` (versioni precedenti recuperabili dalla cronologia).
   - Riscrivere il body di `requireMembership`/`currentMembership` con la logica reale su `auth.getUser()` + memberships.
   - Le firme degli helper non cambiano → nessun call site da toccare.

2. **Corpus = parafrasi.** I 58 chunk in `src/ingest/seed-demo-corpus.ts` sono accurati ma non testo verbatim. Sostituire via la pipeline esistente `bun run ingest-cards` puntando ai PDF ufficiali (URL già nei record). Verifica con `bun run verify-kb`.

3. **Single tenant.** Demo mode crea una sola org. Multi-tenancy logica è già nello schema (organizations, memberships, RLS policies), basta riattivare auth.

### Alti

4. **Retrieval lessicale.** `src/lib/search.ts` usa PostgreSQL tsvector. Funziona fino a ~100 norme. Sopra: popolare `legal_chunks.embedding vector(1024)` (HNSW index già creato in migration 001) con Voyage `voyage-law-2` o OpenAI `text-embedding-3-large`. Hybrid BM25 + cosine, eventualmente con cross-encoder per re-ranking.

5. **No OCR.** `unpdf` legge solo PDF testuali. Per PDF scansionati: Anthropic vision o AWS Textract come fallback.

6. **No export.** Solo markdown nel DB. Aggiungere export DOCX (`docx` npm) + PDF.

7. **Server Action size limit.** `next.config.ts` ha `bodySizeLimit: '10mb'`. Per file > 10MB serve resumable upload a Supabase Storage poi processing async via job queue.

### Medi

8. **Audit log immutabilità.** `src/lib/audit.ts` fa hash-chain SHA-256 ma non c'è un job di verifica del chain. Aggiungere `verify-audit-chain.ts` da girare in cron.

9. **No retries / no idempotency keys.** Le server actions fanno multi-step DB writes senza transaction né compensazione. Per produzione: avvolgere in RPC Postgres o accettare la non-atomicità con audit log come safety net.

10. **No test.** Zero unit / integration. Almeno: 1 test sul flow `askLegalAssistantAction` e 1 sul `reviewUploadedDocumentAction`.

### Bassi

11. **Sidebar contiene voci non-implementate**: Workspaces, Matters, Reg. alerts, Audit log, Settings — pagine esistono ma sono CRUD vuote o placeholder.

12. **Topbar "Demo mode" badge** — togliere quando auth tornerà.

## Cosa è stato fatto in questa sessione

Riferimento: `~/Desktop/LEXAI-Documentazione-Tecnica.pdf` per il dettaglio completo.

In sintesi:
- Rimossa auth (Supabase magic link era rotta, bloccava ogni iterazione).
- Sostituita con Demo mode auto-seeded (`src/lib/demo.ts`).
- Costruito da zero il motore AI (chat + review + generation): `src/lib/{search,ai,review,pdf}.ts`, `src/lib/actions/{assistant,review}.ts`, pagine in `src/app/dashboard/{assistant,review}`.
- Esteso il corpus a 6 giurisdizioni (DIFC, ADGM, Qatar, QFC, KSA, Bahrain), 17 fonti, 58 chunk.

## Roadmap di prodotto (mia opinione)

Prima di scrivere altro codice: **3 conversazioni con GC reali** (uno DIFC, uno saudita, uno qatariota). Cosa testare:
- "AI Legal OS per emerging markets" risuona o suona generico?
- *Generation* o *review* è il primo bisogno?
- Quali giurisdizioni mancano nel corpus per non perdere credibilità?
- I 4 verticali (oil&gas, renewables, mining, fintech) sono il taglio giusto, o conviene partire da un settore solo?

Da lì:
1. **Sostituire corpus** con PDF verbatim per le 6 giurisdizioni attuali.
2. **Regulatory monitoring** — la tabella `regulatory_events` esiste, manca la pipeline: scraper su gazzette ufficiali → diff → event_impacts per workspace.
3. **Export DOCX/PDF nativo** del review e del draft.
4. **Re-auth** + multi-tenant prima del primo design partner.
5. **Embeddings** quando il corpus supera 100 norme.

## Sicurezza

- `.env.local` è in `.gitignore`. Non committarla.
- La service-role key di Supabase è enterprise-level access — restringere all'IP del server o ruotarla regolarmente in produzione.
- Quando l'auth tornerà: forzare SSO (SAML/OIDC) prima di accettare il primo cliente enterprise GCC.

## Contatti

Documentazione tecnica completa: `~/Desktop/LEXAI-Documentazione-Tecnica.pdf`
Repo locale: `~/Desktop/lexai-us/`
