# ARCHITECTURE.md

Stable architectural reference for **Lexai**. Consulted on demand — not every session. For conventions/workflow see [AGENTS.md](AGENTS.md); for the *why* behind choices see [DECISIONS.md](DECISIONS.md).

---

## Core principle — dual provider abstraction

Every external dependency is **optional and provider-abstracted**. The presence of credentials auto-selects a live implementation; their absence selects a deterministic mock. **Feature code runs identical paths in both modes** and never branches on demo-vs-live.

```
                        config/env.ts
              getEnv() · hasAnthropic() · hasSupabase()
                              │
        ┌─────────────────────┴─────────────────────┐
        ▼                                            ▼
  DATA LAYER  lib/supabase/                    AI LAYER  lib/ai/
  index.ts createAdminClient()                 index.ts (façade)
        │                                            │ getProvider()
   hasSupabase()?                              hasAnthropic()?
    ├─ yes → @supabase/supabase-js              ├─ yes → providers/anthropic.ts ──→ @anthropic-ai/sdk
    └─ no  → mock.ts (in-mem PostgREST)         └─ no  → providers/mock.ts (deterministic)
              ↑ store.ts (seeded singleton)
              ↑ seed.ts  (fixed-id dataset)
```

## Request lifecycle (AI Assistant example)

```
Client form ── Server Action (lib/actions/assistant.ts)
   │  requireMembership()  → demo context (lib/auth.ts → lib/demo.ts)
   │  getWorkspaceJurisdictions(orgId)
   │  searchLaws(q) ──(empty?)──► browseLaws()      [lib/search.ts · tsvector]
   │  askAssistant(q, chunks)  ─► getProvider() ─► anthropic | mock   [lib/ai]
   │  recordAudit({promptHash, retrievalHash, outputHash})  [lib/audit.ts]
   ▼
AssistantResponse { answer, citations, retrievedCount, jurisdictions }
```

Drafting (`generateDocumentAction`) and Review (`reviewUploadedDocumentAction`) follow the same shape: retrieve corpus → call provider → persist (contracts/clauses/citations) → audit → `revalidatePath`/`redirect`.

## Layer responsibilities

| Layer | Path | Responsibility |
|---|---|---|
| Pages | `app/dashboard/<feat>/page.tsx` | Server Component: fetch data, pass plain props |
| Client UI | `app/dashboard/<feat>/<Feat>Client.tsx` | `'use client'`, local UI state only |
| Actions | `lib/actions/*` | `'use server'` mutation entry points; orchestration |
| AI | `lib/ai/*` | Provider-abstracted AI ops; `anthropic.ts` is the **only** SDK importer |
| Data | `lib/supabase/*` | Real/mock client; query builder surface |
| Domain | `lib/search.ts`, `review.ts`, `events.ts`, `audit.ts`, `pdf.ts`, `taxonomy.ts`, `rbac.ts` | Retrieval, parsing, hashing, taxonomy |
| Config | `config/env.ts` | Env validation + mode selection |
| Types | `types/database.ts` | Row types mirroring SQL schema |

## ADR-lite (architecturally significant records)

> One-paragraph records. Permanent rationale lives in [DECISIONS.md](DECISIONS.md); this is the architectural index.

- **ADR-001 Dual provider abstraction.** Both data and AI behind interfaces; credentials select implementation at call time. Enables zero-config demo + production with the same code.
- **ADR-002 Single AI façade.** Everything imports `@/lib/ai`; the Anthropic SDK is confined to `providers/anthropic.ts`. Swapping/adding a provider = implement `AIProvider`, nothing else changes.
- **ADR-003 Auth removed for demo.** `lib/auth.ts` returns a fixed demo context; `lib/demo.ts` lazily seeds org/user/workspace. Service-role client only (RLS bypassed, server-only). Helper signatures unchanged so real auth can be reinstated without touching call sites.
- **ADR-004 Lexical retrieval first.** `lib/search.ts` uses Postgres `tsvector` (with `browseLaws` fallback). Embeddings/pgvector deferred until corpus > ~100 norms.
- **ADR-005 Centralised env.** All credentials optional, read only via `getEnv()`/`hasAnthropic()`/`hasSupabase()`. No direct `process.env` outside `config/env.ts`.
- **ADR-006 Types mirror SQL.** `types/database.ts` is the single source for row shapes and enums; extend via `Pick`/`Omit`.

## Delicate points (handle with care)

- **Mock fidelity** — `lib/supabase/mock.ts` must keep matching the real Supabase query surface used by feature code. Unsupported operators silently break demo mode. New FK joins → register in `REGISTRY`.
- **Fixed seed ids** — `demo-org`, `demo-user`, `ws-default`, `contract-nda`, `contract-employment` are referenced across pages; renaming breaks them.
- **No per-user tenancy** — everything is the single demo org via service-role.
- **Non-atomic multi-step writes** — actions perform sequential DB writes with no transaction; the hash-chain audit log is the only safety net.
- **Retrieval ceiling** — lexical search degrades past ~100 norms.

## Regression gate

The **zero-env `bun run build` + all-routes-200 smoke check** is the canonical regression test (it exercises both mock layers end-to-end). Keep it green.
