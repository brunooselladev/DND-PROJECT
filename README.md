# D&D Compendium - Phase 1 (SRD Only)

Minimal compendium foundation built with:

- Next.js (App Router)
- TypeScript
- TailwindCSS
- PostgreSQL + Prisma
- NextAuth (optional sign-in, browsing is public)

## Scope

This phase includes only SRD compendium browsing:

- `/spells` and `/spells/[id]`
- `/monsters` and `/monsters/[id]`
- `/rules` and `/rules/[id]`

Removed from runtime:

- Upload pipeline
- AI/RAG endpoints
- Embedding/chunk processing

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy env file:

```bash
cp .env.example .env
```

3. Generate Prisma client and apply migration:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name phase1_srd
```

4. Seed data:

```bash
npm run prisma:seed
```

5. Run development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Filters

- Spells: `q`, `level`, `school`
- Monsters: `q`, `cr`
- Rules: `q`, `category`

Each listing is server-rendered and capped to a max result set for fast responses.
