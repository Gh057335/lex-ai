This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Demo mode (zero configuration)

LEXAI runs end-to-end with **no environment variables**. When Supabase / Anthropic
credentials are absent it transparently uses:

- an **in-memory mock database** seeded with representative legal data
  (jurisdictions, sources, corpus chunks, matters, contracts, regulatory events,
  audit trail), and
- a **deterministic mock AI provider** for the assistant, drafting, document
  review and the regulatory digest.

This makes it deployable to Vercel as a portfolio out of the box. The architecture
is production-grade: both the data layer (`lib/supabase`) and the AI layer
(`lib/ai`) are provider-abstracted, so adding credentials switches the **same code
paths** to the live services with no other change. See [`env.example`](env.example).

## Documentazione e orientamento agenti AI
- Documentazione architetturale: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Regole e orientamento agenti: [docs/agents/AGENTS.md](docs/agents/AGENTS.md)
- Gestione sessioni: [docs/agents/session.md](docs/agents/session.md)
- Knowledge base: [docs/knowledge-base/](docs/knowledge-base/)
## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
