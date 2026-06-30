# CLAUDE.md

Entry point for AI coding agents. **Do not duplicate docs here.**

Read in order before doing anything:

1. [AGENTS.md](AGENTS.md) — repo manual: stack, conventions, patterns, workflow, checklists. **Start here.**
2. [SESSION.md](SESSION.md) — append-only changelog. Read before starting; append after every patch.
3. [HANDOFF.md](HANDOFF.md) — current-state snapshot. Read to resume; update after every patch.

Stable references — consult on demand, not every session:

- [ARCHITECTURE.md](ARCHITECTURE.md) — diagrams + ADR-lite (the dual provider abstraction).
- [DECISIONS.md](DECISIONS.md) — permanent decisions + rationale (append-only).
- [ROADMAP.md](ROADMAP.md) — planned work / priorities.
- [docs/](docs/) — long-form supporting material.

> Runtime is **Bun**. Next.js 16 here has breaking changes vs. training data — consult `node_modules/next/dist/docs/` before writing Next-specific code.
