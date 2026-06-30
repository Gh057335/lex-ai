# AGENTS.md

Universal entry point for AI coding agents working on **Lexai** (Claude Code, Codex CLI, Gemini CLI, Cursor, Windsurf, Cline, and future agents). Read fully before editing. Optimized for fast scan + low token cost.

> Flow: **AGENTS.md** (you are here) → [docs/SESSION.md](docs/SESSION.md) → [docs/HANDOFF.md](docs/HANDOFF.md)
>
> Stable references (on demand): [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/DECISIONS.md](docs/DECISIONS.md) · [docs/ROADMAP.md](docs/ROADMAP.md) · [docs/](docs/)
>
> Human-facing docs: [README.md](README.md). Claude Code shim: [CLAUDE.md](CLAUDE.md).

---

## 1. Project overview

- AI legal assistant SaaS for **emerging-markets corporate counsel** (GCC + Africa: DIFC, ADGM, UAE, Qatar, QFC, KSA, Bahrain).
- Three end-to-end flows over a curated legal corpus:
  - **AI Assistant** (`/dashboard/assistant`) — Q&A with article-level citations.
  - **Document Review** (`/dashboard/review`) — upload PDF → clause segmentation → risk flags + redlines + citations.
  - **Document Drafting** (modal in Assistant) — generate NDA/DPA/SHA/arbitration clauses grounded in corpus.
  - Plus: regulatory alerts + AI digest.
- **Portfolio project.** Must run **standalone with zero env vars** (demo mode). Not production-hardened.

## 2. Tech stack

| Layer | Choice |
|---|---|
| Runtime / PM / test | **Bun** (never npm/yarn/pnpm/node) |
| Framework | Next.js 16.2 (App Router, Server Components, Server Actions, Turbopack) |
| UI | React 19.2, Tailwind v4, Lucide, `clsx` + `tailwind-merge` |
| Data | Supabase Postgres (real) **or** in-memory mock (demo) |
| AI | `@anthropic-ai/sdk` 0.90 — Sonnet 4.6 (chat) / Opus 4.7 (draft), **or** deterministic mock |
| Validation | Zod 4 |
| PDF | `unpdf` (text-only, no OCR) |
| TS | strict, ES2017 target, `@/*` → repo root |

## 3. Architecture (core idea: dual provider abstraction)

Every external dependency is **optional and provider-abstracted**. Presence of credentials auto-selects live vs. mock — **same code paths, no branching in feature code**.

- **Data layer** `lib/supabase/`: `index.ts` returns real or mock `SupabaseClient`; `mock.ts`/`store.ts`/`seed.ts` back demo mode.
- **AI layer** `lib/ai/`: `index.ts` is the only façade; `providers/anthropic.ts` is the **only** Anthropic SDK importer; `providers/mock.ts` is deterministic + corpus-grounded.
- **Auth removed** (demo): `lib/auth.ts` returns fixed context, `lib/demo.ts` lazily seeds; service-role only.
- **Retrieval**: `lib/search.ts` lexical tsvector over `legal_chunks` with `browseLaws` fallback.

> Full diagrams, request lifecycle, layer table, ADR-lite, and delicate points → **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**. The *why* behind these → **[docs/DECISIONS.md](docs/DECISIONS.md)**.

## 4. Folder structure

```
app/                Next.js App Router. dashboard/* = product, marketing pages at root, legal/ pricing/ security/
  dashboard/<feat>/page.tsx        Server Component (data fetch)
  dashboard/<feat>/<Feat>Client.tsx  'use client' interactive UI
components/          Shared UI (Sidebar, Topbar, MarketingShell, Logo)
config/env.ts        Zod env validation + hasAnthropic()/hasSupabase()/getSiteUrl()
lib/
  ai/                AI layer (façade index.ts, provider.ts, models.ts, prompts.ts, types.ts, providers/*)
  supabase/          Data layer (index.ts, mock.ts, store.ts, seed.ts)
  actions/           Server Actions ('use server'): assistant, review, matters, workspaces, digest
  db/matters.ts      Shared ensureAutoMatter()
  auth.ts demo.ts    Demo auth context + lazy seeding
  audit.ts rbac.ts review.ts search.ts events.ts pdf.ts taxonomy.ts utils.ts
ingest/              Bun CLI scripts: corpus ingestion, KB verify, seed (lib/ helpers)
types/               database.ts (mirrors SQL schema), index.ts
pitch/               Business/pitch docs (non-code)
```

## 5. Conventions

### Coding style
- Server-only data access via `createAdminClient()`. Never import the Anthropic SDK outside `lib/ai/providers/anthropic.ts`.
- Feature code imports AI from `@/lib/ai` and data from `@/lib/supabase` — never from a concrete provider/SDK.
- Comments explain *why*, not *what*; match existing density (terse, high-signal).
- Path alias `@/*` everywhere (no deep relative imports).

### Naming
- Pages: `page.tsx` (server). Interactive client split: `<Feature>Client.tsx` with `'use client'`.
- Server Actions: `<verb><Noun>Action` (e.g. `askLegalAssistantAction`, `generateDocumentAction`), file in `lib/actions/`.
- DB row types in `types/database.ts` mirror SQL; extend via `Pick`/`Omit`, don't redeclare.
- Jurisdiction keys: `ae-difc`, `ae-adgm`, `qa-qfc`, etc. (normalize `:` → `-`).

### State management
- No client state library. Server Components fetch; Server Actions mutate + `revalidatePath`/`redirect`. Client components hold only local UI state.

### API / data handling
- All DB calls go through `createAdminClient()` using the standard Supabase query-builder API (so the mock stays compatible). New FK joins must be registered in `REGISTRY` in `lib/supabase/mock.ts`.
- Multi-step writes are not transactional — audit log is the safety net.

### AI provider
- New AI operation = add method to `AIProvider` interface (`lib/ai/provider.ts`) + implement in **both** `providers/anthropic.ts` and `providers/mock.ts` + expose via `lib/ai/index.ts`.
- Model ids only in `lib/ai/models.ts` (`MODELS.chat` / `MODELS.draft`). Prompts in `lib/ai/prompts.ts`.

### Env vars
- Read **only** via `getEnv()` / `hasAnthropic()` / `hasSupabase()` from `config/env.ts`. Never touch `process.env` directly (except inside `config/env.ts`).
- **Every credential stays optional.** Never make one mandatory.

### TypeScript
- `strict: true`, zero TS errors is the bar. `bunx tsc --noEmit` must pass.
- Validate Server Action / external inputs with Zod schemas.
- Existing `as unknown as` casts on Supabase joins are known debt (untyped mock client) — match the pattern, don't introduce new untyped surfaces gratuitously.

## 6. Patterns to follow / anti-patterns to avoid

**Follow**
- Provider abstraction for any new external dependency.
- `ensureAutoMatter(orgId, name)` for auto-created matters.
- Hash-chain audit via `recordAudit` on every AI mutation (`promptHash`/`retrievalHash`/`outputHash`).
- Server Component fetches → passes plain data to `*Client.tsx`.

**Avoid**
- Importing Anthropic SDK outside `providers/anthropic.ts`.
- Reading `process.env` outside `config/env.ts`.
- Making any env var required / adding a hard failure when a credential is missing.
- Branching feature logic on demo-vs-live (the abstraction handles it).
- New deep relative imports instead of `@/*`.
- Adding a client state library.

## 7. Development workflow

1. Read [docs/SESSION.md](docs/SESSION.md) (history) + [docs/HANDOFF.md](docs/HANDOFF.md) (current state).
2. Consult `node_modules/next/dist/docs/` for any Next.js 16 API.
3. Implement against the provider interfaces; keep demo mode working.
4. `bunx tsc --noEmit` (0 errors) and `bun run lint`.
5. Verify zero-env demo path still builds: `bun run build` with no env vars.
6. Update docs/SESSION.md (append entry) + docs/HANDOFF.md (rewrite affected sections only).

### Pre-implementation checklist
- [ ] Read docs/SESSION.md + docs/HANDOFF.md.
- [ ] Identified the right layer (ai / supabase / actions / page).
- [ ] Confirmed no new mandatory credential is introduced.
- [ ] Checked Next.js 16 docs for any framework API used.

### Post-implementation checklist
- [ ] `bunx tsc --noEmit` → 0 errors.
- [ ] `bun run lint` clean.
- [ ] Demo mode (zero env) still builds & runs; new AI ops have a mock impl.
- [ ] New FK joins added to `REGISTRY` in `mock.ts` if applicable.
- [ ] Audit recorded for new AI mutations.
- [ ] docs/SESSION.md appended; docs/HANDOFF.md updated.

### Regression strategy
- Treat the **zero-env demo build** as the canonical smoke test — it exercises both mock layers end-to-end. If it builds clean and all routes 200, behavior is preserved.
- Never delete history in docs/SESSION.md; mark each patch `Regression: YES/NO` with reason.

## 8. Important files

| File | Role |
|---|---|
| `config/env.ts` | Single source of env truth; mode selection |
| `lib/ai/index.ts` / `provider.ts` | AI façade + provider selection |
| `lib/ai/providers/anthropic.ts` | Only Anthropic SDK importer; exports `anthropic()` |
| `lib/supabase/index.ts` / `mock.ts` / `store.ts` / `seed.ts` | Data layer + mock + seed |
| `lib/demo.ts` / `lib/auth.ts` | Demo context + lazy seeding |
| `lib/search.ts` | Lexical retrieval over corpus |
| `lib/actions/*` | Server Actions (entry points for mutations) |
| `types/database.ts` | Row types mirroring SQL schema |

## 9. Critical dependencies

- `@anthropic-ai/sdk` (isolated in one module), `@supabase/supabase-js` + `@supabase/ssr`, `zod`, `unpdf`, `next` 16.2, `react` 19.2, Tailwind v4. `stripe`/`resend` present, not core to demo.

## 10. Delicate architecture points

Summary (full detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#delicate-points-handle-with-care)):

- **Mock fidelity** — `lib/supabase/mock.ts` must match the real Supabase query surface; unsupported operators silently break demo. New FK joins → `REGISTRY`.
- **Fixed seed ids** in `seed.ts` — referenced across pages; don't rename.
- **No per-user tenancy** — demo org via service-role only.
- **Non-atomic multi-step writes** — audit log is the only safety net.
- **Lexical retrieval** scales to ~100 norms; embeddings deferred (see [docs/ROADMAP.md](docs/ROADMAP.md)).

## 11. Git / commit / patch conventions

- Branch off `main`; don't commit/push unless asked. Never commit `.env*`.
- Commit messages: Conventional Commits — `feat:`, `refactor:`, `fix:`, `chore:` + concise scope (match existing history).
- One logical change per patch ("patch" = one completed unit of work tracked in docs/SESSION.md).
- After every patch: append to [docs/SESSION.md](docs/SESSION.md), update [docs/HANDOFF.md](docs/HANDOFF.md). Never rewrite history.
- End commit messages with: `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
