# Grimoire

Grimoire is a web app where signed-in users pick a game and ask questions about its lore. Answers are generated with an LLM **grounded in admin-uploaded documents**: text is chunked, embedded into **pgvector** in Supabase, retrieved by similarity for each question, then passed to **Groq** as context—so the assistant stays tied to your corpus, not the open web.

## Features

- **RAG pipeline**: PDF/Word (and similar) → extract → chunk → embed → store → vector search → LLM reply  
- **Supabase**: Auth, Postgres + **Row Level Security**, Storage for source files  
- **Dashboard**: Game picker, lore chat UI, client + server **rate limiting** on chat  
- **Admin**: Manage games and ingest lore documents (see migrations and API routes under `src/app/api/admin/`)  
- **Landing page**: Marketing UI; optional **GameSpot** news when `GAMESPOT_API_KEY` is set  

## Stack

- **Next.js** (App Router), **React**, **TypeScript**, **Tailwind CSS**  
- **Supabase** (Auth, DB, Storage, pgvector)  
- **Groq** for chat completions  
- Embeddings via **Nomic**, **OpenAI-compatible** APIs, **OpenAI**, or **Hugging Face** (768-dimensional vectors; see `src/lib/rag/embeddings.ts`)  

## Prerequisites

- **Node.js 20+** (matches CI)  
- A **Supabase** project with migrations applied (`supabase/migrations/`)  
- API keys as described in [Environment](#environment)  

## Local development

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase URL/keys, GROQ_API_KEY, and an embedding provider.

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database

Apply SQL migrations to your Supabase project (CLI or SQL editor), in order:

- `supabase/migrations/20260405120000_lore_rag.sql`  
- `supabase/migrations/20260406120000_embeddings_768_groq.sql`  
- `supabase/migrations/20260406140000_add_game_genre.sql`  

Optional: `supabase/seed.sql` if you use it.

### First admin user

After migrations and env are set:

```bash
npm run create-admin
```

Uses `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. See `scripts/create-admin.mjs` for options (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).

## Environment

Copy `.env.example` to `.env.local` and set variables there. At minimum you need Supabase URL + anon key (+ service role for admin ingest and scripts), `GROQ_API_KEY`, and **one** embedding provider configured for 768-dim vectors.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client and server Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; RAG ingest, admin operations, `create-admin` |
| `GROQ_API_KEY` | Chat completions |
| `NOMIC_API_KEY` / `OPENAI_API_KEY` / `EMBEDDINGS_*` / `HUGGINGFACE_API_KEY` | Embeddings (see `embeddings.ts`) |
| `GAMESPOT_API_KEY` | Optional; homepage news (falls back without it) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm test` | Run unit tests once (Vitest) |
| `npm run test:watch` | Vitest watch mode |
| `npm run create-admin` | Create or promote a Supabase user to admin |

## CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and pull request: **lint → test → build**. The build step sets placeholder `NEXT_PUBLIC_SUPABASE_*` values so Next.js can compile without your real secrets.

## License

Private / unpublished—adjust as needed for your portfolio.
