# ROADMAP.md

Planned, not-yet-done work. Current debt detail lives in [HANDOFF.md](HANDOFF.md); permanent rationale in [DECISIONS.md](DECISIONS.md). When an item ships, remove it here and record it in [SESSION.md](SESSION.md).

Priority: **P0** blocker · **P1** high · **P2** medium · **P3** low.

---

## Engineering

| P | Item | Notes |
|---|---|---|
| P1 | First integration tests | `bun test` for `askLegalAssistantAction` + review action; until then the zero-env build is the only gate |
| P1 | Typed Supabase client | Generate types from schema; remove `as unknown as` casts in `search.ts`/`events.ts`/pages |
| P1 | Zod on remaining FormData actions | `generateDocumentAction`, review action still use manual string guards |
| P2 | Centralised Server Action error shape | Replace raw `throw new Error` with a consistent response/result type |
| P2 | Embeddings + hybrid retrieval | pgvector + BM25/cosine once corpus > ~100 norms (HNSW index already in migration) |
| P2 | Transactional / idempotent writes | Wrap multi-step action writes in Postgres RPC or add compensation |
| P3 | OCR fallback | `unpdf` is text-only; add vision/Textract for scanned PDFs |
| P3 | DOCX/PDF export | Of generated drafts and review outputs |

## Product

| P | Item | Notes |
|---|---|---|
| P0 | Re-enable auth + multi-tenancy | Before any real design partner; schema + RLS already support it; helper signatures unchanged |
| P1 | Replace paraphrased corpus with verbatim sources | Re-ingest official PDFs via `bun run ingest-cards`; verify with `bun run verify-kb` |
| P2 | Regulatory monitoring pipeline | Scraper on official gazettes → diff → `regulatory_events` → workspace impacts (table exists, pipeline missing) |
| P2 | Validate positioning with real GCC counsel | 2–3 General Counsel interviews (DIFC / KSA / Qatar) before further build-out |

## Docs

| P | Item | Notes |
|---|---|---|
| P2 | Fix `README.md` doc links | Repoint stale `docs/...` links to root-level `AGENTS.md`/`SESSION.md`/`HANDOFF.md` |
