# Contributing

Thanks for your interest in Lexai.

## Setup

```bash
bun install
cp .env.example .env.local   # fill ANTHROPIC_API_KEY (optional — demo mode works without it)
bun dev
```

## Workflow

1. Open an issue first for non-trivial changes.
2. Branch off `main`: `git checkout -b feat/my-feature`.
3. Keep commits small and descriptive (we use conventional-style messages).
4. Open a PR — the CI must be green before merge.

## Rules

- **Demo mode must always work**: `USE_REAL_AI=false bun dev` should run with zero credentials.
- No new dependencies without discussion.
- TypeScript strict mode is on — do not disable it.
