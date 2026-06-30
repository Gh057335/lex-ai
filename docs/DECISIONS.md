# DECISIONS.md

Permanent decisions and their rationale. **Append-only** — supersede an entry with a new one rather than rewriting it (note "Supersedes #ID"). The architectural index lives in [ARCHITECTURE.md](ARCHITECTURE.md); planned work in [ROADMAP.md](ROADMAP.md).

Format: `#ID — Title` · **Decision** · **Why** · **Consequences** · **Status**.

---

### D-001 — Zero-config standalone demo mode
- **Decision:** App must run end-to-end with **no environment variables**.
- **Why:** It's a portfolio project; a reviewer must clone & deploy (Vercel) and see the full product with no setup.
- **Consequences:** Every credential is optional; both data and AI need a mock implementation; the zero-env build is the regression gate.
- **Status:** Active.

### D-002 — Dual provider abstraction (data + AI)
- **Decision:** Hide every external service behind an interface; auto-select live vs. mock by credential presence.
- **Why:** One codebase serves both demo and production without conditional feature logic.
- **Consequences:** New external dependency ⇒ add an abstraction + both implementations. No demo-vs-live branching in features. Supersedes any direct-SDK usage.
- **Status:** Active.

### D-003 — Anthropic SDK isolated to one module
- **Decision:** Only `lib/ai/providers/anthropic.ts` imports `@anthropic-ai/sdk`; everyone imports `@/lib/ai`.
- **Why:** Provider swap (OpenAI/Bedrock/local) becomes a single-file change; keeps the dependency surface auditable.
- **Consequences:** New AI op = method on `AIProvider` + impl in anthropic **and** mock + façade export.
- **Status:** Active.

### D-004 — Authentication removed for demo
- **Decision:** Replace Supabase session auth with a fixed, lazily-seeded demo context.
- **Why:** Magic-link auth was broken and blocked every iteration; demo mode needs no login.
- **Consequences:** Single-tenant; service-role client bypasses RLS (server-only). Helper signatures (`requireMembership`, etc.) kept stable so real auth returns without touching call sites.
- **Status:** Active (reversible — see [ROADMAP.md](ROADMAP.md)).

### D-005 — Lexical retrieval before embeddings
- **Decision:** Use Postgres `tsvector` full-text search; defer pgvector/embeddings.
- **Why:** Current corpus (~tens of norms) doesn't justify embedding infra; lexical is simpler and adequate.
- **Consequences:** Retrieval quality degrades past ~100 norms; revisit then (hybrid BM25 + cosine).
- **Status:** Active.

### D-006 — Centralised, all-optional env via Zod
- **Decision:** Single `config/env.ts` with Zod; read only through `getEnv()`/`hasAnthropic()`/`hasSupabase()`. No mandatory vars.
- **Why:** One validation point; malformed values fail loudly, missing values select demo mode.
- **Consequences:** Never read `process.env` elsewhere; never make a credential required.
- **Status:** Active.

### D-007 — Types mirror the SQL schema
- **Decision:** `types/database.ts` is the single source for row types and enums; extend via `Pick`/`Omit`.
- **Why:** Kill duplicate type definitions that had drifted across modules.
- **Consequences:** Column changes update SQL + this file together; feature code doesn't redeclare shapes.
- **Status:** Active.

### D-008 — Runtime is Bun
- **Decision:** Use Bun for runtime, package manager, scripts, and tests.
- **Why:** Project/global convention; faster, single toolchain.
- **Consequences:** Never use npm/yarn/pnpm/node/npx. Ingest scripts run via `bun ingest/*.ts`.
- **Status:** Active.
