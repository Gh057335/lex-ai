# LEXAI — CTO Handoff

> **Project**: LEXAI — *AI Legal Operating System for Emerging Markets* (Africa · GCC · Asia + 4 sector verticals).
> **Working directory**: `~/Desktop/lexai-us` (Next.js 16 + Supabase + Anthropic + Bun pipeline).
> **State (2026-05)**: Phase 0 of the build prompt is partially complete (auth + RBAC + dashboard shell + landing page work; Supabase schema ready to apply). Phase 1+ (real ingestion of statutory text into vector DB) is **scaffolded but not run end-to-end** — only 5 of 344 knowledge-base cards are source-grounded. See §10 for what's done vs. what's next.
> **Audience**: technical co-founder / CTO joining the project. Read top-to-bottom once; then keep open as a command reference.

---

## 1. The product in 3 sentences

LEXAI generates, reviews and monitors legal contracts across emerging-market jurisdictions where mainstream legaltech (Harvey, Ironclad, Spellbook) does not yet operate or hallucinates badly — OHADA, AfCFTA, the GCC free zones (DIFC, ADGM, VARA, FSRA), India, Indonesia, Vietnam, plus 4 sector verticals (Oil & Gas, Renewables, Mining, Crypto). The differentiation is **citation-grounded output**: every clause carries a verifiable pointer to a primary source we have ingested and verified — without that pointer, the system refuses to answer rather than invent. The MVP target is to let a general counsel (a) draft a DIFC services agreement, (b) review an incoming DOCX with risk-flagged redlines, and (c) get an alert within 24h when a watched regulator publishes a change — all with a hash-chained audit trail.

The full product brief lives at `~/Desktop/lexai-us/LEXAI-MVP-Build-Prompt.md` (319 lines). Read it before writing code.

---

## 2. Stack & key decisions

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 16 App Router + React 19 + Tailwind v4 + lucide-react | App Router required for streaming/RSC patterns; Tailwind v4 already configured |
| Runtime (frontend) | Node via Next.js (deployed Vercel) | Vercel edge integrates with `@supabase/ssr` cookie pattern |
| Runtime (pipeline) | **Bun** for `src/ingest/*` scripts | `bun:sqlite`, `Bun.file`, `Bun.write` zero-dep; faster startup |
| Database | Supabase Postgres + `pgvector` HNSW + `pg_trgm` + `pgcrypto` | Multi-tenant via RLS; vector search for retrieval; Auth bundled |
| Auth | Supabase Auth with `@supabase/ssr` (cookie sync) | Email/password + magic link; sessions in cookies, RSC-friendly |
| LLM | Anthropic — Claude Opus 4.7 for drafting/review, Haiku 4.5 for classification + verification | Prompt caching (`cache_control: ephemeral`) on system + corpus + skeleton blocks |
| Embeddings | Voyage `voyage-multilingual-2` (1024-dim, EN/FR/AR/PT) | Anthropic ships no embeddings; Voyage handles all our target languages |
| Storage | Supabase Storage | Source PDFs, DOCX exports, audit-pack PDFs |
| Payments | Stripe (Phase 7, not wired yet) | placeholder env vars exist |
| Email | Resend (Phase 5, not wired yet) | placeholder env vars exist |
| E-sign | DocuSign sandbox (Phase 7, not wired yet) | placeholder env vars exist |

**Critical Next.js 16 breaking changes already baked into our code** (do not regress):
- `cookies()`, `headers()`, `params`, `searchParams` are **async only** — no sync access. All our route/layout files already `await` these.
- `middleware.ts` convention is now `proxy.ts` (we have neither yet — when you add one, use `proxy.ts`).
- `next lint` removed → use ESLint CLI directly (`bun run lint`).
- Turbopack default in dev + build (we use it).

The repo's `AGENTS.md` says: *"This is NOT the Next.js you know. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices."* — follow that rule.

---

## 3. Repo layout

```
~/Desktop/lexai-us/
├── AGENTS.md                       # Next.js 16 warning (read first)
├── CLAUDE.md                       # = @AGENTS.md (Claude Code convention)
├── LEXAI-MVP-Build-Prompt.md       # canonical product brief, 319 lines
├── LEXAI_Business_Plan_Completo.html  # business plan (markets, sectors)
├── README.md
├── package.json                    # see scripts in §4
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs              # Tailwind v4
│
├── .claude/skills/ui-ux-pro-max/   # locally installed UI/UX skill (project-scope)
├── .env.local                      # secrets — see §5; NEVER commit
├── .env.example
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # root: Inter + Playfair + IBM Plex Mono
│   │   ├── page.tsx                # public landing page (700→540 lines, editorial design)
│   │   ├── globals.css
│   │   └── (auth)/                 # auth route group
│   │       ├── login/page.tsx
│   │       └── register/page.tsx
│   │   └── dashboard/              # authenticated app
│   │       ├── layout.tsx          # checks auth + loads org membership
│   │       ├── page.tsx            # workspaces list
│   │       ├── workspaces/{new,[id]}/
│   │       ├── matters/{[id]}/
│   │       ├── contracts/{[id]}/
│   │       ├── sources/            # legal corpus browser
│   │       ├── alerts/             # regulatory alerts (Phase 5 stub)
│   │       ├── audit/              # audit log viewer
│   │       └── settings/
│   │
│   ├── components/                 # Logo · Sidebar · Topbar
│   ├── lib/
│   │   ├── supabase.ts             # createClient (server) + createAdminClient (service role)
│   │   ├── supabase-browser.ts     # createBrowserClient (singleton, SSR-cookie-aware)
│   │   ├── auth.ts                 # requireMembership() server helper
│   │   ├── rbac.ts                 # can(role, action)
│   │   ├── audit.ts                # writeAuditEvent()
│   │   ├── taxonomy.ts             # JURISDICTION_BY_KEY map
│   │   ├── utils.ts                # formatDate, truncate, classnames
│   │   └── actions/                # server actions (workspaces, matters)
│   ├── types/                      # database.ts (generated) + index.ts
│   │
│   └── ingest/                     # Bun pipeline (NOT Next.js)
│       ├── verify-kb.ts            # KB verifier — fetch URL + Claude validation
│       ├── consolidate-kb.ts       # KB → single master MD on Desktop
│       ├── ingest-cards.ts         # source-grounded card validator + auto-patcher
│       ├── seed-batch-1.json       # PDFs for seed batch 1 (UN/UK/US/OECD)
│       ├── seed-batch-2.json       # PDFs for seed batch 2 (UAE/DIFC/ADGM PDPL trio)
│       └── lib/
│           ├── parse-cards.ts      # markdown → Card[]
│           ├── fetch-source.ts     # browser-UA + retry + archive.org fallback + PDF (unpdf)
│           ├── chunker.ts          # heading-aware, ~1000 tok/chunk, 100 tok overlap
│           ├── verify-card.ts      # LLM verdict (Haiku) — landing-page-level
│           ├── validate-against-source.ts  # multi-batch validator (Sonnet) — text-level
│           ├── apply-patches.ts    # auditable substring replace + audit log
│           ├── report.ts           # JSON + MD reports
│           └── db.ts               # bun:sqlite verification state
│
├── supabase/
│   └── migrations/
│       └── 001_lexai_schema.sql    # 564 lines — full schema (see §6)
│
├── docs/
│   └── knowledge-base/             # 344 source cards across 37 files
│       ├── README.md               # legend + index
│       ├── africa/                 # OHADA + AfCFTA + 9 tier-1 + 13 tier-2 + EAC
│       ├── gcc/                    # UAE Federal/DIFC/ADGM/free-zones/VARA + KSA + QA + BH + KW + OM + Islamic Finance
│       ├── asia/                   # India + Indonesia + Vietnam + Singapore + HK
│       ├── sectors/                # Oil&Gas + Renewables + Mining + Crypto + Crypto templates + Sovereign concessions + Mobile money
│       ├── cross-cutting/          # Data Protection matrix + Sanctions + Anti-corruption + Arbitration + ESG reporting
│       └── .verification/
│           ├── state.sqlite        # multi-run verifier history
│           ├── audit/              # per-card source-grounding audit logs
│           └── report-latest.{md,json}
│
└── pitch/                          # presentation/marketing assets (separate)
```

---

## 4. The Bun scripts (`package.json`)

| Command | What it does | When to run |
|---|---|---|
| `bun run dev` | Start Next.js dev server (Turbopack, port 3000) | development |
| `bun run build` | Production build (Turbopack) | before deploy |
| `bun run start` | Run production build | after `build` |
| `bun run lint` | ESLint v9 | pre-commit |
| `bun run verify-kb` | Walks `docs/knowledge-base/`, fetches each `Official URL`, asks Haiku 4.5 to verify the page corresponds to the card | weekly cron + after URL edits |
| `bun run verify-kb:dry` | Same as above but skips LLM call (only fetches + hashes) | sanity-check fetch layer without API spend |
| `bun run consolidate-kb` | Concatenates all knowledge-base files into a single master MD on Desktop | after KB edits, before sharing |
| `bun run ingest-cards` | Source-grounded validator — fetches statute PDF/HTML, chunks heading-aware, asks Sonnet 4.6 to validate each claim against text, applies high-confidence patches with hash-chain audit | per-card or per-batch ingestion |

**`verify-kb` flags**:
```
--cards=key1,key2     # subset
--card=key            # single card
--limit=N             # first N
--concurrency=N       # default 4 — drop to 2 if hitting Haiku 50k tok/min rate-limit
--no-llm              # fetch + hash only
--model=<id>          # override classifier model
```

**`ingest-cards` flags**:
```
--cards=key1,key2                                 # required: which to ingest
--cards-file=path                                 # alternative: one key per line
--source-overrides=src/ingest/seed-batch-N.json   # map cards → canonical PDF URLs
--dry-run                                         # don't write patches; only audit
--min-confidence=high|medium                      # default medium; "high" = stricter auto-apply
--model=<id>                                      # default Sonnet 4.6
```

**Audit & state files**:
- Verifier state: `docs/knowledge-base/.verification/state.sqlite` (multi-run, queryable via `bun -e` + `bun:sqlite`)
- Per-card source-ground audit: `docs/knowledge-base/.verification/audit/<key>.json`
- Latest report: `docs/knowledge-base/.verification/report-latest.{md,json}`

---

## 5. Environment setup (zero → running)

### 5.1 Prerequisites

```sh
# macOS
brew install bun        # >= 1.x
node --version          # need >= 20.9 (Next 16 minimum)
git --version
```

### 5.2 First clone (when repo is on Github)

```sh
git clone <repo-url> ~/Desktop/lexai-us
cd ~/Desktop/lexai-us
bun install             # installs all deps from bun.lock
```

### 5.3 The `.env.local` template

Run this single command from the repo root to write the template:

```sh
cat > .env.local <<'EOF'
# ─── Supabase ────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://djdvtshojjjpmfcvshwm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=PASTE_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=PASTE_SERVICE_ROLE_KEY_HERE

# ─── Anthropic ───────────────────────────────────────────────────
ANTHROPIC_API_KEY=PASTE_ANTHROPIC_KEY_HERE
ANTHROPIC_MODEL_DRAFTING=claude-opus-4-7
ANTHROPIC_MODEL_CLASSIFY=claude-haiku-4-5-20251001

# ─── Voyage embeddings (Phase 1+) ───────────────────────────────
VOYAGE_API_KEY=
VOYAGE_EMBED_MODEL=voyage-multilingual-2

# ─── Stripe / Resend / DocuSign / Slack (Phase 5+) ──────────────
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
SLACK_WEBHOOK_URL=
DOCUSIGN_INTEGRATION_KEY=
DOCUSIGN_USER_ID=
DOCUSIGN_ACCOUNT_ID=

# ─── Application ─────────────────────────────────────────────────
NEXT_PUBLIC_BASE_URL=http://localhost:3000
EOF
```

Then replace the 3 `PASTE_*_HERE` strings:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → project → Settings → API → `anon` `public` (or new "publishable" key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → `service_role` `secret` (or new "secret" key) — **NEVER expose to browser, never commit** |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys → Create Key (`sk-ant-api03-...`) |

**Sanity check**:
```sh
bun -e 'console.log("anon ok:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length, "anthropic ok:", process.env.ANTHROPIC_API_KEY?.startsWith("sk-ant"))'
```
Expected: `anon ok: ~210` (JWT length) `anthropic ok: true`.

### 5.4 Apply the database schema

The migration creates: `organizations`, `profiles`, `memberships`, `workspaces`, `matters`, `contracts`, `contract_versions`, `clauses`, `clause_citations`, `legal_sources`, `legal_chunks` (with HNSW vector index), `clause_templates`, `template_overlays`, `regulatory_events`, `event_impacts`, `audit_log`, `jobs` — plus RLS policies on every tenant table.

**Step-by-step**:

1. Copy the SQL into the clipboard:
   ```sh
   cat supabase/migrations/001_lexai_schema.sql | pbcopy
   ```
2. Open the Supabase SQL editor for our project:
   ```sh
   open "https://supabase.com/dashboard/project/djdvtshojjjpmfcvshwm/sql/new"
   ```
3. Paste (`Cmd+V`), click **Run**.
4. If you see `extension "vector" is not available` → first enable in Database → Extensions: `vector`, `pgcrypto`, `uuid-ossp`, `pg_trgm`, `btree_gin`. Then re-run.

### 5.5 Disable email confirmation (dev only)

Supabase free-tier SMTP is rate-limited to ~2-4 emails/hour. For dev, disable email confirmation entirely:

- https://supabase.com/dashboard/project/djdvtshojjjpmfcvshwm/auth/providers
- Click **Email** → toggle **Confirm email** OFF → Save.

For production, configure custom SMTP under Project Settings → Auth → SMTP (Resend / Postmark / SendGrid) and re-enable Confirm email.

### 5.6 Run

```sh
bun run dev
# open http://localhost:3000
```

First request: `/register` → fill org name + email + password → redirected to `/dashboard`.
Subsequent: `/login`.

---

## 6. Database schema (`supabase/migrations/001_lexai_schema.sql`)

Schema follows §4.2 of the build prompt. Quick model:

```
organizations ─ memberships ─ profiles (auth.users)
        │              │
        └─ workspaces ─┘
              │
              └─ matters ─ contracts ─ contract_versions ─ clauses ─ clause_citations
                                                                          │
                                                                          ▼
                              ┌──────────────────────────────────  legal_sources
                              │                                          │
                              │                                          ▼
                              │                                    legal_chunks   (pgvector HNSW)
                              ▼
                      regulatory_events ─ event_impacts ─ contracts
                              │
                              ▼
                          audit_log (append-only, hash-chained)
                          jobs       (SKIP LOCKED work queue)
```

**RLS rule** on every tenant table: `org_id = (auth.jwt() ->> 'org_id')` or membership check via `EXISTS (SELECT 1 FROM memberships WHERE user_id = auth.uid() AND org_id = <table>.org_id)`.

**RBAC roles** (in `memberships.role`): `owner | counsel | reviewer | viewer`. Mapped to actions in `src/lib/rbac.ts`.

**To regenerate types after schema changes**:
```sh
bunx supabase gen types typescript --project-id djdvtshojjjpmfcvshwm > src/types/database.ts
```

---

## 7. Knowledge base architecture (the hardest part)

The KB lives in `docs/knowledge-base/` and is the **single source of truth** for which legal norms LEXAI claims to cover. Each entry is a *card* — a markdown block with structured fields:

```markdown
### ae/fed-45-2021-pdpl  — Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data
- **Type:** statute
- **Jurisdiction:** AE (federal)
- **Sector:** data
- **Language:** ar; en (unofficial)
- **Effective from:** 2022-01-02
- **Publisher:** UAE Data Office
- **Official URL:** https://protection-data.ae/wp-content/uploads/2023/10/federal-decret-law-45-uae.pdf
- **License class:** gov_open
- **Key parts:** Art. 5 conditions of processing, Art. 6 conditions for consent, Art. 7-8 controller/processor, Art. 12-17 data subject rights, Art. 22 cross-border transfers...
```

**Three pipelines operate on cards**:

1. **`verify-kb`** — superficial check (fetches each `Official URL`, asks Haiku "does this page correspond to this card?"). Catches dead URLs, mismatches, supersession.
2. **`ingest-cards`** — deep check (fetches the actual statute PDF/HTML, chunks it heading-aware, asks Sonnet to validate each factual claim in the card against text excerpts, auto-applies high-confidence corrections with audit hash-chain). This is what makes a card "source-grounded" (reaches ~9/10 quality).
3. **`consolidate-kb`** — packages the entire KB into a single 296 KB / 4050-line master MD (`~/Desktop/LEXAI-Norme-Master.md`) for sharing/review.

**Coverage today (2026-05)**:
- 344 cards across 37 files
- 5 source-grounded (UN UNCAC, UNCITRAL Model Law, UAE PDPL, DIFC DPL, ADGM DPR)
- 35 verified at landing-page level (verify-kb run 8)
- 60+ partial (some claims confirmed, some absent)
- 129 cards have no `Official URL` yet (intentional restricted-reference templates + tier-2 references — fillable later)
- 1 mismatch caught + fixed (UK OFSI consolidated list withdrawn 2026-01-28 → split into legacy + successor cards)

**Honest quality estimate**: ~5/10 average across all cards (most are still scaffold from pretraining). Each card brought through `ingest-cards` jumps to ~8.5–9/10 with audit trail. To bring the whole corpus to 8–9 is **3-5 multi-hour sessions × ~$15-30 API**. Roadmap in §10.

---

## 8. Authentication + multi-tenancy model

- One **Supabase user** = one `auth.users` row.
- Each user gets a **profile** (`profiles` table, 1:1 with `auth.users`).
- A user belongs to one or more **organizations** via `memberships(org_id, user_id, role)`. Default role on signup = `owner` of a freshly-created org.
- An org has many **workspaces**. A workspace scopes a set of jurisdictions + sectors and contains **matters** (matter = a specific deal/transaction). A matter contains **contracts**.
- Server helper `requireMembership()` in `src/lib/auth.ts` is called from every dashboard layout/page; redirects to `/login` if no session, returns `{userId, orgId, role}` otherwise.
- RBAC permissions in `src/lib/rbac.ts`: `can(role, 'audit.read')`, `can(role, 'contracts.create')`, etc.

**Auth flow files**:
- `src/app/(auth)/register/page.tsx` — signup form (Client Component)
- `src/app/(auth)/login/page.tsx` — login form
- `src/lib/actions/workspaces.ts` — server action that creates org + membership + first workspace on signup
- `src/lib/supabase.ts` — server client with cookie sync
- `src/lib/supabase-browser.ts` — **singleton** browser client using `@supabase/ssr createBrowserClient` (avoids "Multiple GoTrueClient instances" warning + keeps cookies in sync with server)

---

## 9. Operational runbook (common tasks)

### Add a new norm to the KB

1. Edit the relevant file under `docs/knowledge-base/<region>/<file>.md`. Use the existing card format (see §7 example).
2. `bun run consolidate-kb` to regenerate the Desktop master doc.
3. (Optional) `bun run verify-kb -- --card=<your-key>` to fetch its URL and check it works.
4. (Optional) When ready to source-ground: add an entry to a `seed-batch-N.json` with the canonical PDF URL, then `bun run ingest-cards -- --cards=<your-key> --source-overrides=src/ingest/seed-batch-N.json`.

### Run the verifier on the whole corpus

```sh
bun run verify-kb -- --concurrency=3
```
~10–15 min, ~$0.50–1 of Haiku credit. Output: `docs/knowledge-base/.verification/report-latest.md`.

### Source-ground a batch of cards

```sh
# Example: re-run the cornerstone international set
bun run ingest-cards -- \
  --cards=un/ny-conv-1958,uncitral/model-law-2006,us/fcpa-1977,uk/bribery-act-2010,un/uncac-2003 \
  --source-overrides=src/ingest/seed-batch-1.json \
  --min-confidence=high
```
~5 min, ~$0.50 of Sonnet credit. Patches written to MD files; audit log per card in `.verification/audit/<key>.json`.

### Inspect verifier state from SQLite

```sh
bun -e 'import { Database } from "bun:sqlite"; const db = new Database("docs/knowledge-base/.verification/state.sqlite"); const rows = db.query("SELECT verdict, COUNT(*) AS n FROM card_verifications WHERE run_id=(SELECT MAX(run_id) FROM card_verifications) GROUP BY verdict ORDER BY n DESC").all(); console.table(rows);'
```

### Reset / re-apply the database schema

```sh
# Wipes data — only for dev
cat supabase/migrations/001_lexai_schema.sql | pbcopy
open "https://supabase.com/dashboard/project/djdvtshojjjpmfcvshwm/sql/new"
# Then in SQL editor, paste, click Run
```

---

## 10. What's done · in-progress · not started

Cross-referenced against `LEXAI-MVP-Build-Prompt.md` §6 phase plan.

### ✅ Done
- **Phase 0 — Foundation (mostly)**:
  - Supabase schema designed + migration file ready (564 lines, RLS on every tenant table, vector + pg_trgm + uuid-ossp + pgcrypto + btree_gin extensions)
  - Auth: email + password signup/login + cookie-sync via `@supabase/ssr`
  - Org/workspace/matter/contract data model with RBAC
  - Dashboard shell: 7 routes (workspaces, matters, contracts, sources, alerts, audit, settings) + Sidebar/Topbar
  - Public landing page (editorial design, single source-grounded sample citation)
- **Knowledge-base scaffold**: 344 cards across 37 files, organized by region/sector/cross-cutting
- **Pipeline tooling** (this is the "hard infrastructure"):
  - URL verifier with browser-UA + retry + archive.org fallback + PDF parsing (unpdf)
  - Heading-aware chunker (~1000 tok/chunk, preserves Article numbers in heading_path)
  - Multi-batch source-grounded validator (Sonnet) with claim-level dedup precedence
  - Auditable patcher with SHA-256 hash chain and source-grounding markers in MD
  - Multi-run SQLite state with per-run reports (JSON + MD)
- **5 cards source-grounded** (proof the pipeline works end-to-end): UAE PDPL, DIFC DPL, ADGM DPR, UNCITRAL Model Law, UN UNCAC

### 🟡 In progress / partial
- **Email confirmation**: disabled (Supabase rate limit). Needs custom SMTP for prod.
- **`.env.local`** assumes Supabase keys + Anthropic key are configured; Voyage + Stripe + Resend + DocuSign + Slack are placeholder.
- **KB quality**: 5/344 verified to ~9/10; the rest are scaffold (~5/10). Phase 1 ingestion needed to lift the bulk.

### ❌ Not started (Phase 1+)
- **`legal_sources` + `legal_chunks` tables are EMPTY**. The schema exists; no ingestion has populated them yet. Until they're populated, retrieval-grounded drafting cannot work.
- **Voyage embedding pipeline** (`src/ingest/embed.ts` per build prompt §5) — not built. Needed to populate `legal_chunks.embedding`.
- **Drafting flow** (Phase 2 vertical slice) — `dashboard/contracts/[id]` exists as scaffold but no actual generate-from-template UI.
- **Review pipeline** (Phase 3) — DOCX upload + clause segmentation + redline UI: not built.
- **Multi-jurisdiction fan-out** (Phase 4) — not built.
- **Regulatory-change pipeline** (Phase 5) — `pg_cron` daily diff jobs + `regulatory_events` + Slack/email alerts: not built.
- **Q&A assistant** (Phase 6) — workspace-scoped chat with RAG: not built.
- **Audit pack PDF export + DocuSign handoff** (Phase 7) — not built.

### 🎯 Recommended next 4 tasks (in order)
1. **Get the schema applied + dev signup working end-to-end on the CTO's machine** (steps in §5).
2. **Pick a seed batch of 5–10 cornerstone PDFs** (use `seed-batch-1.json` and `seed-batch-2.json` as templates) and run `ingest-cards` to lift them to source-grounded. Verifies the LLM pipeline costs + accuracy match expectations.
3. **Build `src/ingest/embed.ts`** — Voyage `voyage-multilingual-2`, batched, writes to `legal_chunks.embedding` (HNSW index already exists in schema). This unlocks RAG retrieval.
4. **Phase 2 vertical slice — DIFC services agreement drafting flow** (Phase 2 of build prompt). One template, one jurisdiction (DIFC), one language (English). Acceptance: 8/10 sample runs cite DIFC sources accurately.

---

## 11. Gotchas (things that already tripped us up)

- **`.env.local` placeholders** silently break Supabase auth. Symptom: browser console says `TypeError: Failed to fetch` on submit + storage key shows `sb-placeholder-auth-token`. Fix in `src/lib/supabase-browser.ts` now throws an explicit error if it detects placeholders.
- **Multiple GoTrueClient instances** warning was caused by `createBrowserClient()` returning a fresh client on every call. Fixed via module-level singleton.
- **Supabase email rate limit** (~2-4/hour on built-in SMTP) blocks signup loops in dev. Disable email confirmation under Auth → Providers → Email until SMTP is configured.
- **Supabase needs `vector` extension enabled manually** in the dashboard before the migration runs successfully (Database → Extensions → search "vector" → Enable).
- **`@supabase/ssr` vs raw `@supabase/supabase-js`**: always use `@supabase/ssr` `createBrowserClient` and `createServerClient` for cookie sync. Raw `@supabase/supabase-js.createClient` in App Router causes auth state desync.
- **Next.js 16 async APIs**: `cookies()`, `headers()`, `params`, `searchParams` MUST be awaited. Sync access removed entirely. Codemod available: `bunx @next/codemod@canary upgrade latest`.
- **Many regulator portals are JS-rendered or Cloudflare-protected** → land in `inconclusive` or `unreachable` from the verifier even with browser UA. Future fix: headless browser fallback (Playwright). Some PDFs only available as scanned bitmaps → need OCR (tesseract). Both are tracked but not built.
- **Counter bug in `consolidate-kb.ts`** previously showed `0 cards reachable` — fixed (`#{4,6}` regex post-demotion). Now reports correct 344.
- **Anthropic Haiku rate-limit** is 50k input tokens/min on default tier. `verify-kb` at concurrency 6 hits it on long runs (29 cards errored once). Drop to concurrency 3 for safety, or upgrade tier.
- **PDF URLs change frequently**. ADGM, OHADA, ICAO, OECD, Bahrain CBB, Côte d'Ivoire, Morocco SGG all had broken canonical URLs at first verifier run. We fixed 13 manually using WebSearch + WebFetch; expect to re-fix periodically.
- **The trailing space on `~/Desktop/bondyfans `** in another project's path used to break shell ops. Not a LEXAI issue but worth noting if you ever see weird `cd` failures across the user's projects.

---

## 12. Where to go for more depth

| Topic | File / URL |
|---|---|
| Product brief | `~/Desktop/lexai-us/LEXAI-MVP-Build-Prompt.md` |
| Business plan + markets | `~/Desktop/lexai-us/LEXAI_Business_Plan_Completo.html` |
| Schema reference | `~/Desktop/lexai-us/supabase/migrations/001_lexai_schema.sql` |
| Knowledge base index | `~/Desktop/lexai-us/docs/knowledge-base/README.md` |
| KB consolidated (sharable) | `~/Desktop/LEXAI-Norme-Master.md` |
| Latest verifier report | `~/Desktop/lexai-us/docs/knowledge-base/.verification/report-latest.md` |
| Next.js 16 upgrade notes | `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` |
| Supabase project | https://supabase.com/dashboard/project/djdvtshojjjpmfcvshwm |
| Anthropic console | https://console.anthropic.com |
| Voyage AI (embeddings) | https://www.voyageai.com |

---

## 13. License + IP posture

- The application source code is private (`"private": true` in package.json).
- The knowledge-base cards are LEXAI-authored summaries + citation pointers — not verbatim statute text. License classes flagged per card:
  - `public_domain` → official gazette text, free to ingest verbatim
  - `gov_open` → government publication, redistribution OK with attribution
  - `restricted_reference` → copyrighted but referenceable; we store **clause-pattern templates only**, not verbatim text (AAOIFI, FIDIC, AIPN, ISDA fall here)
  - `paywalled_meta_only` → citation pointer only
- The `Source-grounded:` audit annotations in MD files include SHA-256 hashes of the source-fetch-time content, used as evidence chain.
- Anthropic API outputs are subject to Anthropic Usage Policies. We do not opt into model training (verify in Console → Settings → Privacy).

---

*Generated 2026-05-12. Keep this in sync as the project evolves; consider committing it as `docs/HANDOFF.md` once you have a Github repo.*
