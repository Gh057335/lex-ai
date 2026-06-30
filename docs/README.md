# docs/

Technical documentation for **Lexai**. The repo-root files ([AGENTS.md](../AGENTS.md), [CLAUDE.md](../CLAUDE.md)) are the entry path; this folder holds the evolving and reference material they link out to.

## Document map

| File | Type | Read when |
|---|---|---|
| [../README.md](../README.md) | Human-facing project README | Onboarding as a developer |
| [../AGENTS.md](../AGENTS.md) | Universal AI agent entry point (router) | First, for any AI agent |
| [../CLAUDE.md](../CLAUDE.md) | Claude Code shim | First, for Claude Code (redirects to AGENTS.md) |
| [SESSION.md](SESSION.md) | Append-only changelog | Before starting; append after each patch |
| [HANDOFF.md](HANDOFF.md) | Current-state snapshot | To resume; update after each patch |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Diagrams + ADR-lite | When touching cross-cutting structure |
| [DECISIONS.md](DECISIONS.md) | Permanent decisions + rationale | When questioning/changing a decision |
| [ROADMAP.md](ROADMAP.md) | Planned work | When picking up new work |

## Not yet created (see [ROADMAP.md](ROADMAP.md))

`DEPLOYMENT.md`, `SECURITY.md`, `API.md`, `CONTRIBUTING.md` — planned, require real content from the codebase before being authored.
