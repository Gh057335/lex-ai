# SESSION.md — Chronological project memory

> **Every implementation must begin by reading this document and end by updating this log.**

Rules:
- Append-only. **Never delete or rewrite** past entries.
- One row per completed patch, newest at the **bottom**.
- Always set `Regression: YES/NO` with a one-line reason.

Format:
`Date | Time | Patch #ID | Branch | Area | Description | Regression: YES/NO | Reason | Author`

---

## Changelog

2026-05-15 | 18:33 | Patch #001 | main | Bootstrap | Initial commit — Next.js scaffold (legacy `src/` layout) | Regression: NO | Greenfield. | Emanuele
2026-06-30 | 23:44 | Patch #002 | main | Repo | Removed old LEXAI docs, updated `.gitignore` | Regression: NO | Docs/cleanup only. | Emanuele
2026-07-01 | 00:08 | Patch #003 | main | Structure | Migrated `src/` → root-level App Router (`app/`, `lib/`, `components/`) | Regression: NO | Pure file relocation; import paths via `@/*`. | Emanuele
2026-07-01 | 00:29 | Patch #004 | main | Architecture | Production-grade refactor: AI layer extraction, Zod, `config/env.ts`, type dedup (`RiskLevel`/`Confidence`/`ChangeType`/`Severity` centralised in `types/database`), shared `ensureAutoMatter`, env via `getEnv()` | Regression: NO | TS 0 errors; behavior preserved, internals reorganised. | Emanuele
2026-07-01 | 01:09 | Patch #005 | main | Demo mode | Zero-config standalone demo: dual provider abstraction — mock Supabase (`lib/supabase/mock.ts`+`store.ts`+`seed.ts`) and mock AI (`lib/ai/providers/mock.ts`); credentials now optional, auto-selected | Regression: NO | Verified `next build` zero-env = 0 errors/warnings, all 18 routes HTTP 200, full lifecycle headless. | Emanuele
2026-07-01 | (docs) | Patch #006 | main | Docs | Authored AI-first agent docs: `CLAUDE.md` (entry), `AGENTS.md` (main reference), `SESSION.md` (this log), `HANDOFF.md` (state snapshot); replaced corrupted `AGENTS.md` and stale `HANDOFF.md` | Regression: NO | Documentation only, no code touched. | Emanuele
2026-07-01 | (docs) | Patch #007 | main | Docs | Split stable reference out of `AGENTS.md`: added `ARCHITECTURE.md` (diagrams + ADR-lite), `DECISIONS.md` (append-only rationale), `ROADMAP.md` (planned work), `docs/README.md` (doc map); trimmed `AGENTS.md` §3/§10 to point at them; updated `CLAUDE.md` doc list | Regression: NO | Documentation only; scalable structure for future patches. | Emanuele
