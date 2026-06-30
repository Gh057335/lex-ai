# HANDOFF.md — Current state snapshot

> Living snapshot of the repo, **not** a changelog (history lives in [SESSION.md](SESSION.md)). Rewrite the affected sections after every patch so a fresh agent can resume cold.

_Last updated: 2026-07-01 (Patch #007)._

## Where things stand

Lexai is a working **portfolio MVP** of an AI legal assistant for GCC/emerging-markets corporate counsel. It runs **fully standalone with zero environment variables** and deploys to Vercel as-is. Three product flows work end-to-end: AI Assistant (cited Q&A), Document Review (PDF → clause risk + redlines), and Document Drafting (corpus-grounded NDA/DPA/SHA/arbitration). Regulatory alerts + AI digest are also wired.

The codebase was recently (2026-07-01) migrated from `src/` to a root-level App Router layout, refactored to a production-grade architecture, and then made zero-config via a **dual provider abstraction**: both the data layer (`lib/supabase`) and the AI layer (`lib/ai`) auto-select a real implementation when credentials are present and a deterministic mock otherwise — over identical code paths.

## Completed

- Root-level App Router structure (`app/`, `lib/`, `components/`, `config/`, `types/`, `ingest/`).
- Centralised, Zod-validated env (`config/env.ts`) with all credentials optional.
- AI layer fully abstracted behind `AIProvider`; Anthropic SDK isolated to one module; deterministic corpus-grounded mock provider.
- Mock Supabase client (in-memory PostgREST-compatible builder) with seeded fixed-id dataset; demo auth via `lib/demo.ts` + `lib/auth.ts`.
- Hash-chain audit logging on AI mutations.
- Verified: zero-env `next build` = 0 errors/0 warnings, all routes 200, full lifecycle headless.
- AI-first agent docs: `CLAUDE.md`, `AGENTS.md`, `SESSION.md`, `HANDOFF.md`, plus stable references `ARCHITECTURE.md`, `DECISIONS.md`, `ROADMAP.md`, and `docs/`.

## Key architectural decisions

- **Optional-everything / dual provider abstraction** — credentials select live vs. mock; feature code never branches on mode.
- **Single AI façade** (`lib/ai/index.ts`) — no SDK imports leak into features.
- **Auth removed for demo** — single seeded org, service-role client only (RLS bypassed by design, server-only).
- **Lexical retrieval** (tsvector) chosen over embeddings for current corpus size.
- **Types mirror SQL** in `types/database.ts`; centralised enums to kill duplication.

## Problems solved

- Broken Supabase magic-link auth that blocked iteration → replaced with auto-seeded demo context.
- Duplicate type definitions across `review.ts`/`events.ts` → centralised in `types/database.ts`.
- Hard dependency on credentials → made every external service optional with mocks.

## Open problems / technical debt (priority order)

1. **Untyped mock client** → `as unknown as SupabaseClient` casts in `search.ts`/`events.ts`/pages. Generate typed Supabase client to remove them.
2. **No real auth / single-tenant** — schema supports multi-tenancy + RLS; re-enable Supabase sessions to restore it (helper signatures unchanged, so no call sites move).
3. **No Zod on FormData inputs** of `generateDocumentAction` / review action (still manual string guards).
4. **No centralised error shape** for Server Actions (raw `throw new Error`).
5. **Corpus is paraphrase, not verbatim** — re-ingest official PDFs via `bun run ingest-cards`, verify with `bun run verify-kb`.
6. **Lexical retrieval only** — add pgvector embeddings + hybrid search beyond ~100 norms.
7. **No OCR** (`unpdf` text-only) — scanned PDFs need a vision/Textract fallback.
8. **No export** (DOCX/PDF) of drafts/reviews.
9. **Non-atomic multi-step writes** in actions — no transactions/idempotency; audit log is the only safety net.

## Missing tests / risks

- **Zero automated tests.** Minimum next step: `bun test` covering `askLegalAssistantAction` and the review action. Until then, the **zero-env `bun run build` + route smoke check is the regression gate**.
- Risk: mock client drifting from real Supabase query surface — any unsupported operator silently breaks demo mode.
- Risk: renaming fixed seed ids in `seed.ts` breaks pages that reference them.

## Next priorities

1. Add the first two integration tests (assistant + review).
2. Zod-validate the remaining FormData Server Actions.
3. Generate a typed Supabase client and remove `as unknown as` casts.
4. (Product) Re-enable auth + multi-tenancy before any real design partner; replace paraphrased corpus with verbatim sources.
