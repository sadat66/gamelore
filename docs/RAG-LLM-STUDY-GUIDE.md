# Grimoire Deep Study Guide (RAG + LLM)

This guide explains how the project works folder-by-folder and file-by-file, with emphasis on interview-grade reasoning:

- what each file does
- why we built it this way
- what alternatives exist
- why one model/vector/technique is used over others

Use this as a walkthrough while reviewing the codebase and practicing your 50 questions.

---

## 1) System Overview

`Grimoire` is a game-lore assistant built with Retrieval-Augmented Generation (RAG):

1. Admin uploads lore files.
2. Files are parsed into text.
3. Text is chunked and embedded into vectors.
4. Vectors are stored in Supabase Postgres with `pgvector`.
5. User asks a question in chat.
6. Query is embedded, nearest chunks are retrieved, and passed to Groq LLM.
7. LLM answers using retrieved context.

### Why this architecture?

- **Grounded responses**: Retrieval reduces hallucination versus pure chat-only models.
- **Operational simplicity**: App, auth, DB, storage, and vector search all in Supabase.
- **Cost/performance split**: Embeddings and generation are decoupled, so you can tune each independently.

### Why 768-dimensional vectors?

- Current DB schema/index is designed for `vector(768)`.
- `src/lib/rag/embeddings.ts` enforces 768 dims at runtime to avoid silent incompatibilities.
- Lower dimensions can reduce storage and speed up similarity search; tradeoff is potential recall/semantic resolution loss compared to larger vectors.

---

## 2) Main Folder Map

- `src/app`: App Router pages, layouts, and API routes (BFF layer).
- `src/lib`: shared business logic (RAG, LLM calls, Supabase helpers, utilities).
- `src/components`: UI and composable visual building blocks.
- `src/hooks`: reusable UI behavior hooks.
- `supabase`: schema, security policies, vector retrieval SQL, migrations.
- `scripts`: operational/dev scripts.
- root config files: build/lint/test/runtime configuration.

---

## 3) `src/app` (Pages + API Boundary)

### Core layouts/pages

#### `src/app/layout.tsx`
- **What**: Root app shell and global providers.
- **Why**: Centralizes global metadata/styling/providers once.
- **Alternative**: Per-page providers (more flexible, more duplication).

#### `src/app/globals.css`
- **What**: Global Tailwind/theme design tokens and reusable utility classes.
- **Why**: Keeps style system consistent.
- **Alternative**: More CSS Modules/local styles (better isolation, less global cohesion).

#### `src/app/page.tsx`
- **What**: Marketing/landing page.
- **Why**: Product narrative and entry point before auth.
- **Alternative**: Fully componentized landing sections for easier long-term edits.

#### `src/app/(auth)/layout.tsx`
- **What**: Shared layout for auth pages.
- **Why**: Reuses branding + auth shell pattern.
- **Alternative**: Duplicate per-page layout (simpler local ownership, repeated code).

#### `src/app/(auth)/login/page.tsx`
- **What**: Login flow + session resume UX.
- **Why**: Smooth return for already signed-in users.
- **Alternative**: Immediate redirect if session exists (faster, less user control).

#### `src/app/(auth)/signup/page.tsx`
- **What**: Signup flow with submit-lock and verification messaging.
- **Why**: Avoids duplicate submissions and clarifies next steps.
- **Alternative**: Minimal form only (simpler, weaker UX robustness).

#### `src/app/auth/callback/route.ts`
- **What**: Auth callback route exchanging auth code for session.
- **Why**: Server-side session finalize is safer and standard for Supabase auth callbacks.
- **Alternative**: hosted auth callback pages.

#### `src/app/dashboard/layout.tsx`
- **What**: Auth guard and dashboard shell.
- **Why**: Protects all dashboard routes in one place.
- **Alternative**: Per-page auth checks.

#### `src/app/dashboard/page.tsx`
- **What**: Main chat page (game selection + conversation + rate-limit UX).
- **Why**: Primary user flow for RAG interaction.
- **Alternative**: Split chat logic into smaller hooks/state machines for stronger testability.

#### `src/app/dashboard/admin/layout.tsx`
- **What**: Admin-only guard for admin routes.
- **Why**: Defense-in-depth (UI-level role checks).
- **Alternative**: API-only role checks (still required, but worse navigation UX).

#### `src/app/dashboard/admin/page.tsx`
- **What**: Admin control center for game CRUD and lore upload.
- **Why**: Content ops without direct DB tooling.
- **Alternative**: Separate admin microfrontend/backoffice tool.

### API routes

#### `src/app/api/chat/route.ts`
- **What**: Auth check -> validation -> rate-limit -> query embedding -> vector match RPC -> Groq completion.
- **Why**: Keeps secrets, vector search, and prompting server-side.
- **Alternative**: client-direct vector/LLM calls (faster to prototype, weaker security/control).

#### `src/app/api/games/route.ts`
- **What**: Authenticated game list endpoint.
- **Why**: Stable response shape for dashboard; avoids scattering table reads in clients.
- **Alternative**: direct client Supabase query.

#### `src/app/api/gamespot/route.ts`
- **What**: allowlisted proxy for GameSpot API.
- **Why**: Prevents open-proxy abuse and hides external API key logic.
- **Alternative**: client-side API key usage (not safe).

#### `src/app/api/admin/games/route.ts`
- **What**: Admin-only game create/update with genre validation and thumbnail handling.
- **Why**: Centralized business validation.
- **Alternative**: DB triggers/functions for stronger data-level constraints.

#### `src/app/api/admin/documents/route.ts`
- **What**: Admin-only upload + ingest orchestration + status updates.
- **Why**: Single endpoint owns ingestion lifecycle.
- **Alternative**: Queue/worker-based async ingestion for large workloads.

---

## 4) `src/lib` (Business Logic, RAG, Integrations)

### RAG modules (`src/lib/rag`)

#### `src/lib/rag/extract-text.ts`
- **What**: Parses PDF/DOCX/JSON to plain text.
- **Why**: One normalized input text path before chunking.
- **Alternative**: external parsing pipeline/service (more format coverage, more ops).

#### `src/lib/rag/json-to-lore-text.ts`
- **What**: Flattens JSON structures into embedding-friendly text.
- **Why**: Lets structured lore docs join same RAG pipeline.
- **Alternative**: schema-aware extraction preserving richer field semantics.

#### `src/lib/rag/chunk-text.ts`
- **What**: fixed-size chunking with overlap and normalization.
- **Why**: deterministic, simple, fast baseline.
- **Alternative**: sentence/semantic/token-aware chunking; often better retrieval quality but more complexity.

#### `src/lib/rag/embeddings.ts`
- **What**: Multi-provider embedding abstraction (`nomic`, openai-compatible, openai, huggingface), strict 768 check.
- **Why**: decouples embedding provider from pipeline, allows local/cloud options.
- **Alternative**: single provider only (simpler config, less portability).

#### `src/lib/rag/ingest.ts`
- **What**: end-to-end ingestion orchestrator (extract -> chunk -> embed -> insert chunks).
- **Why**: single orchestration module keeps ingest behavior consistent.
- **Alternative**: asynchronous job system (retry/resume/scaling friendly).

#### `src/lib/rag/chunk-text.test.ts`
- **What**: chunking behavior tests.
- **Why**: protects retrieval quality assumptions from regressions.

### LLM + chat

#### `src/lib/groq-chat.ts`
- **What**: Builds system prompt and calls Groq chat completion.
- **Why**: isolates prompt/model invocation from route layer.
- **Alternative**: model-router (choose model by query type/latency budget).

#### `src/lib/chat-rate-limit.ts`
- **What**: in-memory user-based throttling.
- **Why**: simple, no extra infra.
- **Alternative**: Redis/distributed limiter for multi-instance consistency.

#### `src/lib/chat-rate-constants.ts`
- **What**: shared rate-limit constants and helper math.
- **Why**: keeps client/server cooldown in sync.

#### `src/lib/chat-rate-constants.test.ts`
- **What**: tests cooldown math behavior.
- **Why**: prevents UI timer drift/regressions.

### Supabase adapters (`src/lib/supabase`)

#### `src/lib/supabase/client.ts`
- **What**: browser Supabase client factory.
- **Why**: avoids duplicate setup.

#### `src/lib/supabase/server.ts`
- **What**: server Supabase client factory with cookie handling.
- **Why**: required for server components/route handlers with user session.

#### `src/lib/supabase/service.ts`
- **What**: service-role Supabase client factory.
- **Why**: privileged operations (ingest/vector RPC/admin updates).
- **Alternative**: SQL SECURITY DEFINER functions to reduce service-role surface.

#### `src/lib/supabase/middleware.ts`
- **What**: session update/route protection middleware logic.
- **Why**: centralized auth path behavior.

#### `src/lib/supabase/public-env.ts`
- **What**: resolves public env vars and build-safe placeholders.
- **Why**: CI/build can compile without secrets.

### Domain + utilities

#### `src/lib/game-utils.ts`
- **What**: game slug/image URL helpers.
- **Why**: consistent URL and thumbnail behavior.

#### `src/lib/game-utils.test.ts`
- **What**: utility tests for slug behavior.

#### `src/lib/game-genres.ts`
- **What**: canonical genre list + validation helpers.
- **Why**: prevents inconsistent free-text genre values.

#### `src/lib/gamespot.ts`
- **What**: external GameSpot integration helpers + fallbacks.
- **Why**: isolates third-party API mapping/reliability logic.

#### `src/lib/dashboard-events.ts`
- **What**: dashboard custom event constants.
- **Why**: light decoupling between dashboard UI parts.

#### `src/lib/utils.ts`
- **What**: `cn()` class merge utility.
- **Why**: ergonomic Tailwind class composition.

---

## 5) `src/components` (UI Building Blocks)

### Dashboard/Auth/Product components

#### `src/components/dashboard/dashboard-shell.tsx`
- **What**: dashboard shell, navigation, account controls.
- **Why**: consistent protected-app chrome across pages.

#### `src/components/auth/login-credentials-form.tsx`
- **What**: login form logic with submit lock.
- **Why**: safer UX against duplicate requests.

#### `src/components/auth/session-resume-card.tsx`
- **What**: existing-session resume card.
- **Why**: better return-user experience.

#### `src/components/landing/navbar.tsx`
- **What**: responsive landing navbar and CTAs.
- **Why**: conversion-focused entry navigation.

#### `src/components/brand/brand-mark.tsx`
- **What**: reusable brand icon/wordmark.
- **Why**: consistent branding in one source.

#### `src/components/providers/toast-provider.tsx`
- **What**: global toast provider setup.
- **Why**: unified notifications and style.

### UI primitives (`src/components/ui`)

#### `button.tsx`, `input.tsx`, `label.tsx`, `card.tsx`, `separator.tsx`, `skeleton.tsx`, `spinner.tsx`
- **What**: composable primitives with design-system classes.
- **Why**: standard UI behavior and visual consistency.
- **Alternative**: raw HTML/Tailwind directly in pages (fewer abstractions, more repetition/inconsistency risk).

---

## 6) `src/hooks`

#### `src/hooks/use-submit-lock.ts`
- **What**: reusable lock (`acquire/release`) for async submit actions.
- **Why**: prevents duplicate form submissions and race conditions.
- **Alternative**: state-machine form management for richer transitions.

---

## 7) `supabase` (Schema + Security + Vector Retrieval)

#### `supabase/migrations/20260405120000_lore_rag.sql`
- **What**: foundational schema for profiles, games, lore docs/chunks, RLS, storage policies, retrieval RPC.
- **Why**: codifies secure data model and retrieval contract in SQL.
- **Alternative**: external vector DB + application-level ACL mapping.

#### `supabase/migrations/20260406120000_embeddings_768_groq.sql`
- **What**: migration to 768-dim embeddings and related index/function updates.
- **Why**: aligns DB with configured embedding model dimension.
- **Tradeoff**: requires reindex/reingest when dimension changes.

#### `supabase/migrations/20260406140000_add_game_genre.sql`
- **What**: adds `genre` field and index.
- **Why**: better filtering/organization in UI.

#### `supabase/config.toml`
- **What**: local Supabase CLI project settings.
- **Why**: reproducible local dev stack.

#### `supabase/seed.sql`
- **What**: seed scaffold.
- **Why**: optional local bootstrap data.

#### `supabase/.gitignore`
- **What**: ignores local Supabase artifacts/secrets.
- **Why**: prevents accidental sensitive commits.

---

## 8) `scripts`

#### `scripts/create-admin.mjs`
- **What**: creates/promotes admin account and sets profile flag.
- **Why**: fast environment bootstrap for admin workflows.
- **Alternative**: manual SQL updates (error-prone, slower).

---

## 9) Root Configuration Files

#### `package.json`
- **What**: scripts, dependencies, and runtime contracts.
- **Why**: canonical build/test/dev interface.

#### `next.config.ts`
- **What**: Next runtime/bundling settings (including PDF parser server behavior).
- **Why**: ensures parsing dependencies work in server runtime.

#### `tsconfig.json`
- **What**: strict TS configuration + path aliases.
- **Why**: type safety and import ergonomics.

#### `eslint.config.mjs`
- **What**: lint rules and ignores.
- **Why**: quality gate before CI and PRs.

#### `vitest.config.ts`
- **What**: unit test runner configuration.
- **Why**: fast confidence on utility and logic modules.

#### `postcss.config.mjs`
- **What**: Tailwind/PostCSS integration.
- **Why**: required for styling pipeline.

#### `components.json`
- **What**: generator config for UI primitives.
- **Why**: keeps generated UI aligned with project conventions.

#### `src/proxy.ts`
- **What**: proxy/middleware entry integration.
- **Why**: centralized auth/session behavior on route matching.

---

## 10) Interview-Focused Reasoning (Why This, Not That)

### Embeddings model/provider strategy

- **Current**: provider-flexible abstraction with strict dimensional contract.
- **Why strong**:
  - avoids lock-in
  - lets you run local compatible endpoints
  - runtime dimension checks catch failures early
- **Alternatives**:
  - fixed provider (operationally simple, less flexible)
  - larger dimensions (possible quality gain, cost/storage/index overhead)

### Vector storage choice

- **Current**: `pgvector` in Supabase Postgres.
- **Why strong**:
  - one datastore for app + vectors
  - simpler consistency and backup story
  - easier team operations early-stage
- **Alternatives**:
  - dedicated vector DB (better at very large ANN scale, extra infra complexity)

### Retrieval pattern

- **Current**: top-k cosine similarity via SQL RPC.
- **Why strong**:
  - transparent and auditable logic
  - easy to version with migrations
- **Alternatives**:
  - hybrid retrieval (BM25 + vector)
  - reranking stage (cross-encoder/LLM reranker) for precision

### Chunking strategy

- **Current**: fixed-size overlap chunking.
- **Why strong**:
  - deterministic and easy to test
  - low implementation complexity
- **Alternatives**:
  - sentence/semantic chunking (often better recall/precision, harder tuning)
  - metadata-aware chunking (headers/page boundaries for better citations)

### Generation model choice

- **Current**: Groq-based chat generation with context snippets.
- **Why strong**:
  - simple API and usually low latency
  - clean separation from embeddings path
- **Alternatives**:
  - multi-model routing (cheap model for simple Qs, stronger model for complex reasoning)
  - streaming responses (better UX perceived latency)

### Security architecture

- **Current**: layered checks (middleware + layout guards + API auth/admin + RLS + service-role only server-side).
- **Why strong**:
  - defense in depth
  - protected chunks not exposed directly to clients
- **Alternatives**:
  - fewer layers (simpler, riskier)

---

## 11) Recommended Improvement Backlog (Great Interview Talking Points)

1. Add async ingestion queue with retries and dead-letter handling.
2. Add hybrid retrieval and reranking.
3. Add answer citations (doc name, chunk/page metadata) in chat response.
4. Replace in-memory rate limiter with Redis/distributed limiter.
5. Add offline evaluation set for retrieval precision and answer faithfulness.
6. Add observability: latency buckets for embed/retrieve/generate stages.

---

## 12) How to Study This Repo Effectively

1. Start at `src/app/api/chat/route.ts` and trace data dependencies.
2. Read `src/lib/rag/*` in ingest order: extract -> chunk -> embed -> ingest.
3. Read Supabase migrations to understand hard data/security contracts.
4. Compare admin upload path vs user query path.
5. Practice explaining each architecture decision using the alternatives above.

If you can defend these decisions with tradeoffs, you are interview-ready for many RAG/LLM application engineering roles.

---

## 13) Full Elaboration (What + Why + How + Alternatives)

This section expands every major point from the guide into deeper interview-ready explanations.  
If Section 1-12 is your quick map, this section is your deep preparation layer.

---

### 13.1 End-to-End Product Intent

#### What this product is actually solving

At a business level, this app solves a classic enterprise AI problem: users want answers in natural language, but they need those answers to be grounded in private/domain-specific content (game lore in this case). Pure LLM chat is not enough because:

- model training data is stale and incomplete
- model may hallucinate details not present in your corpus
- model cannot know proprietary/internal documents by default

So the system implements Retrieval-Augmented Generation (RAG): retrieve relevant context first, then ask the LLM to answer from that context.

#### Why this is a good interview project

This project demonstrates core real-world RAG engineering dimensions:

- data ingestion pipeline
- chunking and embeddings
- vector retrieval
- secure API boundaries
- prompt orchestration
- role-based admin/user behavior
- production concerns (rate limiting, fallback handling, CI)

Many interviewers care less about fancy model fine-tuning and more about whether you can ship a secure, stable, maintainable system that gives useful grounded answers. This project is aligned with that expectation.

---

### 13.2 Architecture Decision: Monolithic Next.js + Supabase

#### What the current architecture does

The app uses Next.js App Router as the main application layer and Supabase as:

- Auth provider
- relational DB
- vector store (`pgvector` extension in Postgres)
- file storage (source documents, thumbnails)

It keeps most logic in one deployable app boundary.

#### Why this choice is practical

- **Operational simplicity**: fewer moving parts than split microservices.
- **Faster iteration**: one repo, one deployment path, fewer coordination overheads.
- **Strong coherence**: DB schema, security policies, and app retrieval logic evolve together.

#### Alternative and trade-off

Alternative: separate services (ingest worker service, retrieval API service, vector DB service, frontend service).

- Pros: better independent scaling and team isolation.
- Cons: significantly higher complexity (auth propagation, retries, observability, infra maintenance).

Interview framing: this architecture is ideal for early-stage or medium-scale products prioritizing delivery speed and correctness over maximal scale isolation.

---

### 13.3 `src/app` Deep Dive

#### `src/app/layout.tsx` (root shell)

**What**  
Defines the app-wide shell: HTML/body wrappers, metadata, and globally mounted providers (like toast notifications).

**Why**  
Global concerns belong in one place to avoid drift. If each page mounted its own providers/styles, subtle inconsistencies and duplicate provider instances can appear.

**How**  
App Router layout files compose route trees, so root layout is the canonical place for cross-cutting app behavior.

**Alternative**  
Local per-page providers provide isolation but increase duplication and maintenance risk.

---

#### `src/app/globals.css` (global style system)

**What**  
Contains global Tailwind/theme tokens and utility classes used across pages and components.

**Why**  
RAG product UX still needs consistent visual language; this file makes spacing, tone, and component aesthetics predictable.

**Risk**  
Global CSS can accidentally bleed into unrelated UI surfaces if naming is not disciplined.

**Alternative**  
More CSS Modules or component-scoped styling for stronger encapsulation.

---

#### `src/app/page.tsx` (landing page)

**What**  
The public-facing marketing page explaining value proposition and likely showing optional external content (e.g., GameSpot news fallback strategy).

**Why**  
Separate unauthenticated storytelling from authenticated product workflow. This helps conversion, onboarding, and demo clarity.

**Alternative**  
Route directly to login/dashboard and skip marketing content. Good for internal tools, weak for portfolio/public products.

---

#### `src/app/(auth)/layout.tsx`, `login/page.tsx`, `signup/page.tsx`

**What**  
Shared auth visuals + specialized login/signup forms with submit locks and user-friendly transitions.

**Why**  
Auth is high-friction by default. The code tries to lower friction (resume session) while preserving correctness (prevent duplicate submits, explicit feedback).

**Interview angle**  
Demonstrates practical frontend reliability patterns:

- optimistic UX where safe
- explicit loading states
- duplicate action prevention
- deliberate post-auth redirection strategy

**Alternative**  
Server-only redirects and minimal forms can reduce client complexity but often feel harsher in UX.

---

#### `src/app/auth/callback/route.ts`

**What**  
Exchanges auth callback code for active session and redirects to target route.

**Why**  
Standard secure auth pattern; keeps token exchange off raw client orchestration.

**Alternative**  
Hosted callback pages are easier initially but reduce direct control over product-specific redirect rules.

---

#### `src/app/dashboard/layout.tsx` and `admin/layout.tsx`

**What**  
These layouts enforce route-level access:

- dashboard requires authenticated user
- admin routes additionally require admin role

**Why**  
This is part of defense-in-depth. UI guards are not enough alone, but they improve UX and reduce accidental access.

**Important**  
Backend API routes still enforce auth/role checks too. Never rely only on UI route protection.

---

#### `src/app/dashboard/page.tsx` (main chat interface)

**What**  
Core user flow:

1. pick realm/game
2. ask question
3. send chat payload to `/api/chat`
4. render LLM answer and rate-limit countdown if needed

**Why**  
Keeps the retrieval + generation boundary server-side while frontend manages conversational UX.

**Trade-off**  
If full message history is sent each turn, payload grows and session memory is temporary.  
Alternative is persisted conversation tables with message IDs and retrieval-aware history summarization.

---

#### `src/app/dashboard/admin/page.tsx`

**What**  
Administrative workspace to manage games and upload lore files for ingestion.

**Why**  
Makes non-engineering content operations possible without SQL or backend console usage.

**Trade-off**  
Synchronous ingestion from route request can increase request duration and timeout risk for large files.

**Alternative**  
Queue-based background ingestion worker:

- API returns immediately with job ID
- worker parses/chunks/embeds asynchronously
- frontend polls status

---

### 13.4 `src/app/api` Deep Dive

#### `src/app/api/chat/route.ts`

**What**  
The server orchestration path for user chat:

1. verify user session
2. validate `gameId` and messages
3. enforce rate limit
4. embed latest user query
5. call SQL RPC `match_lore_chunks`
6. build context snippets and send to Groq
7. return answer + metadata (`chunksUsed`, `gameTitle`)

**Why**  
This route is the trust boundary:

- API keys stay server-side
- retrieval logic stays auditable
- access restrictions are enforced before expensive model calls

**Design strength**  
Clear fail-fast checks (invalid JSON, missing game, no user message, rate-limit failures, embedding/provider errors, RPC errors).

**Alternative**  
Model gateway service separate from Next route:

- better at scale
- cleaner separation
- but introduces extra deployment and latency hops

---

#### `src/app/api/games/route.ts`

**What**  
Returns game catalog metadata for signed-in users.

**Why**  
Acts as a thin BFF (Backend-for-Frontend), allowing the client to consume one stable endpoint rather than constructing raw table queries itself.

**Alternative**  
Direct client Supabase table queries.  
Simple, but shifts shape/security coupling to frontend code.

---

#### `src/app/api/gamespot/route.ts`

**What**  
A constrained proxy to an external API with allowlisted endpoints/params.

**Why**  
This prevents accidentally creating an open proxy, which is both security and abuse risk.

**Interview point**  
When integrating third-party data, always constrain surface area:

- fixed endpoint set
- parameter allowlist
- timeouts/fallbacks
- optional caching

---

#### `src/app/api/admin/games/route.ts`

**What**  
Admin-only CRUD-style operations for game metadata, potentially including asset upload.

**Why**  
Central business rule enforcement (valid genres, allowed shape) belongs server-side.

**Alternative**  
Write directly from admin UI to DB via client.  
Faster to build, much weaker governance and auditing.

---

#### `src/app/api/admin/documents/route.ts`

**What**  
Admin-only document ingestion endpoint handling:

- file upload storage
- document record creation
- ingest pipeline trigger
- status transitions (`processing`, `ready`, `error`)

**Why**  
Encapsulates ingestion lifecycle in one endpoint and one ownership boundary.

**Key risk**  
Long-running synchronous execution under HTTP duration limits.

**Upgrade path**  
Move embedding/index operations to async jobs with retry and poison-job handling.

---

### 13.5 `src/lib/rag` Deep Dive (Critical for Interviews)

#### `extract-text.ts`

**What**  
Transforms source binary buffers (PDF, DOCX, JSON) into plain text.

**Why**  
Retrieval quality starts with extraction quality. If extraction is noisy, chunking/embedding quality drops regardless of model quality.

**Failure modes to discuss**

- malformed PDFs produce fragmented text
- scans/image-only PDFs need OCR (not covered by plain parser)
- inconsistent DOCX formatting may lose hierarchy cues

**Alternative improvements**

- add OCR fallback for image PDFs
- preserve source structure metadata (page/section) during extraction

---

#### `json-to-lore-text.ts`

**What**  
Converts nested JSON to textual representation for embeddings.

**Why**  
Many enterprise data sources are structured JSON. Flattening enables one unified embedding pipeline.

**Trade-off**

- Pro: broad compatibility
- Con: flattening may lose relational meaning and schema semantics

**Advanced alternative**

- schema-aware templating (e.g., "character.name", "character.affiliation", etc.)
- field-weighted chunk construction

---

#### `chunk-text.ts`

**What**  
Implements fixed-size chunking with overlap.

**Why this baseline is common**

- easy to reason about
- deterministic
- fast and cheap
- robust enough for MVP retrieval

**Why overlap matters**

Without overlap, facts split at boundaries can vanish from both adjacent chunks semantically. Overlap preserves continuity.

**Main limitation**

Chunk boundaries are not semantic. A sentence can be cut mid-thought.

**Alternative strategy matrix**

- fixed chars: simplest, least context-aware
- fixed tokens: better model-aligned size control
- sentence/paragraph chunking: better coherence
- semantic chunking by embedding shifts: highest sophistication, higher complexity/tuning needs

---

#### `embeddings.ts`

**What**  
Provider abstraction that chooses embedding backend based on env configuration and enforces vector dimensionality.

**Why this is important**

- avoids provider lock-in
- supports local OpenAI-compatible endpoints
- catches dimension mismatch early (`assertDim`)

**Why strict dimension checks are non-negotiable**

Vector DB schema and ANN index depend on fixed dimensions. If dimensions drift, retrieval breaks or corrupts assumptions.

**Why provider flexibility helps interviews**

You can explain procurement/compliance scenarios:

- cloud provider unavailable in region
- temporary outage
- local/offline inference required

Same app logic survives by swapping provider.

---

#### `ingest.ts`

**What**  
Orchestrates extract -> chunk -> batch embed -> insert chunk vectors.

**Why**

- isolates ingestion complexity away from route handlers
- makes ingestion logic testable and reusable
- supports status tracking in document table

**Scalability considerations**

- batching reduces API overhead
- but process is still request-coupled in current design

**Alternative**

event-driven worker pipeline with:

- idempotency keys
- checkpointing
- dead-letter queue
- automatic retries with backoff

---

### 13.6 `src/lib/groq-chat.ts` Deep Dive

#### What it does

Builds system prompt and sends completion request to Groq model using retrieved snippets and chat turns.

#### Why this separation matters

Keeping prompt and provider call outside API route:

- improves maintainability
- enables future prompt versioning
- allows easy provider/model swap

#### Why Groq here

Typical reason in such architectures:

- fast inference latency
- good enough quality for grounded QA when retrieval is strong

#### Trade-off

A single hardcoded model can be suboptimal for all query types.

Potential router policy:

- simple factual queries -> cheaper/faster model
- ambiguous synthesis queries -> stronger model

---

### 13.7 `src/lib/chat-rate-limit.ts` and constants

#### What

In-memory per-user sliding-window throttling.

#### Why

Quick and easy abuse protection with zero extra dependencies.

#### Limitation

In multi-instance deployments, each instance tracks different in-memory state, so effective limit is inconsistent.

#### Better production option

Distributed rate limit (Redis, durable KV, or DB-based leaky bucket/token bucket).

Interview phrasing:

"For MVP, in-memory is acceptable and simple. For horizontal scale, I would migrate to shared state limiter to guarantee global limits."

---

### 13.8 Supabase Adapter Layer (`src/lib/supabase/*`)

#### `client.ts`, `server.ts`, `service.ts`

**What**  
Different Supabase clients for different trust contexts:

- browser client: anon + user session
- server client: server-side request context with cookies
- service client: privileged server-only operations

**Why**  
Least-privilege design. Not all code paths should have service-role powers.

**Security principle**

Service-role key should never leak to client bundles. Keeping a dedicated `service.ts` module helps enforce this convention.

---

#### `middleware.ts` / `src/proxy.ts`

**What**  
Handles session refresh and route-protection behavior in middleware/proxy flow.

**Why**  
Centralized auth decisions reduce duplicated checks and inconsistent route behavior.

**Trade-off**

Middleware adds complexity and requires careful matcher scoping to avoid overhead on irrelevant paths.

---

#### `public-env.ts`

**What**  
Resolves public env values and placeholder behavior for CI/build.

**Why**  
Build pipelines often need compile-time values without exposing real secrets.

**Risk to manage**

Make sure placeholder mode is not mistaken for healthy runtime config in production.

---

### 13.9 Domain and Utility Files

#### `game-utils.ts` and `game-utils.test.ts`

**What**  
Slug and media URL helper functions + tests.

**Why**  
Stable slug behavior improves routing, SEO-friendliness, and consistent IDs.

**Alternative**  
DB-generated slugs with uniqueness constraints.

---

#### `game-genres.ts`

**What**  
Defines allowed genres and validation helpers.

**Why**  
Constrained taxonomy avoids dirty data and inconsistent filtering.

**Trade-off**

Strict list improves quality but may require updates when new categories appear.

---

#### `gamespot.ts`

**What**  
External API integration mapping and fallback strategy.

**Why**  
Isolating third-party logic prevents API schema changes from leaking through entire app.

**Good production behavior**

Graceful fallback means homepage still works even if upstream is unavailable.

---

#### `dashboard-events.ts`, `utils.ts`

**What**  
Small helpers for event naming and class merging.

**Why**  
Reduce repeated literals and repetitive style composition boilerplate.

---

### 13.10 `src/components` and `src/hooks` Deep Rationale

#### Component architecture philosophy

The project uses a blend of:

- feature components (`dashboard-shell`, auth forms)
- primitive UI components (`button`, `card`, `input`, etc.)
- global provider wrappers (`toast-provider`)

This is a common and pragmatic design-system approach.

#### Why split primitives and feature components

- primitives enforce consistency and accessibility baseline
- feature components encapsulate business flow and state behavior

Without primitives, large projects drift stylistically.  
Without feature encapsulation, pages become unmaintainable.

---

#### `use-submit-lock.ts`

**What**  
A simple concurrency guard for async submissions.

**Why**  
Double-clicks and repeated keypresses cause duplicated writes and race conditions.

**Alternative**

- state machine forms (more explicit transitions)
- server idempotency keys (stronger backend guarantees)

Best practice is often both client lock + server idempotency.

---

### 13.11 Supabase Migrations Deep Dive

#### `20260405120000_lore_rag.sql`

**What**  
Creates foundational schema, storage policies, RLS, and retrieval function contract.

**Why**  
Core business/security behavior should be versioned in migration history, not hidden in ad-hoc console edits.

**Interview value**

Shows you understand database as a product boundary, not just storage.

---

#### `20260406120000_embeddings_768_groq.sql`

**What**  
Migrates embeddings from old dimension to 768 and updates index/function signatures.

**Why**  
Model/provider changes can require schema updates. This migration acknowledges and codifies that coupling.

**Trade-off**

Dimension migrations often require re-embedding corpus; operationally expensive but necessary for correctness.

---

#### `20260406140000_add_game_genre.sql`

**What**  
Adds indexed metadata field for filtering/organization.

**Why**  
Metadata is critical in RAG apps for scoping retrieval and improving user navigation.

---

### 13.12 Security Model (Detailed)

#### Layer 1: Route middleware/layout checks

Provides early rejection and clean UX flow.

#### Layer 2: API route auth/admin checks

Ensures protected operations fail even if UI routes are bypassed.

#### Layer 3: Supabase RLS and storage policies

Data layer enforces access constraints independent of app bugs.

#### Layer 4: service-role isolation

Privileged operations are server-only and intentionally narrow in usage.

#### Why multi-layer security is necessary

No single layer is perfect. Defense-in-depth reduces blast radius from mistakes.

---

### 13.13 Retrieval Strategy: Why top-k cosine in SQL RPC

#### What

Query embedding is compared against indexed chunk embeddings; top-k matches are returned by similarity.

#### Why it is a good baseline

- straightforward implementation
- transparent SQL logic
- easy observability at DB level
- good enough quality for many corpora

#### Known limitations

- misses lexical matches not captured semantically
- may return near-duplicates
- no second-stage rerank

#### Next evolution

Hybrid retrieval:

1. lexical prefilter (BM25/tsvector)
2. vector search
3. reranking (cross-encoder or small LLM judge)

This improves precision for nuanced domain questions.

---

### 13.14 Prompt Strategy and Context Framing

#### What current approach does

Injects retrieved snippets and chat history into a constrained system prompt.

#### Why this matters

Prompt instructions are policy control:

- force grounded style
- discourage making up unsupported claims
- define response style/tone boundaries

#### Limitation

Prompt-only controls are not guarantees.  
Model can still fail, especially when context quality is weak.

#### Stronger future controls

- citation-required outputs
- confidence thresholds
- fallback responses when retrieval confidence is low
- answer verification pass

---

### 13.15 Operational Concerns and Scaling Path

#### Current strengths

- clear modular boundaries
- tested core utilities
- CI pipeline with lint/test/build
- constrained external integrations

#### Current bottlenecks likely at scale

- synchronous ingestion duration
- in-memory rate limit consistency
- lack of streaming UX for long completions
- limited retrieval quality controls (no reranker)

#### Practical scaling roadmap

1. Async ingestion jobs + retries.
2. Distributed rate limiter.
3. Retrieval evaluation dataset + score tracking.
4. Hybrid retrieval + reranker.
5. Response citations + observability dashboards.

---

### 13.16 How to Explain "Why this model / vector / technique"

Use this interview script pattern:

1. **State requirement**: "We needed grounded domain QA with low latency and manageable ops."
2. **State chosen approach**: "We used RAG with pgvector in Supabase and Groq for generation."
3. **State rationale**: "One datastore simplified ops; 768-dim vectors matched model+schema and controlled cost."
4. **State limitation**: "Fixed chunking and top-k vector-only retrieval can miss edge cases."
5. **State upgrade path**: "Add hybrid retrieval, reranking, and async ingestion workers."

This structure signals engineering maturity: decision -> tradeoff -> future plan.

---

### 13.17 Detailed "What and Why" by File Group (Condensed Index)

Use this as a memorization checkpoint before interviews.

#### App routing and pages

- `src/app/layout.tsx`: global shell and providers; ensures consistency.
- `src/app/globals.css`: shared design tokens; ensures visual coherence.
- `src/app/page.tsx`: public landing; supports onboarding and conversion.
- `src/app/(auth)/*`: auth UX and guardrails; prevents friction and submit races.
- `src/app/dashboard/*`: protected product experience and admin segmentation.

#### API routes

- `api/chat`: secure RAG orchestration boundary.
- `api/games`: curated game list for frontend.
- `api/gamespot`: safe third-party proxy.
- `api/admin/games`: admin content governance.
- `api/admin/documents`: ingest lifecycle control.

#### RAG internals

- `extract-text`: normalize source types.
- `json-to-lore-text`: structured data to embedding text.
- `chunk-text`: deterministic segmentation baseline.
- `embeddings`: provider abstraction + dim contract.
- `ingest`: pipeline orchestration and batching.

#### LLM + reliability

- `groq-chat`: prompt + completion wrapper.
- `chat-rate-limit` + constants: anti-abuse control.

#### Supabase adapters

- `client/server/service`: trust-context-specific DB access.
- `middleware/proxy`: session and route protections.
- `public-env`: CI/runtime config safety.

#### Utility/domain

- `game-utils`, `game-genres`, `gamespot`, `dashboard-events`, `utils`.

#### UI + hooks

- `components/*`: reusable visual + feature components.
- `hooks/use-submit-lock`: race prevention on user actions.

#### Database and ops

- `supabase/migrations/*`: schema/security/retrieval contracts.
- `scripts/create-admin.mjs`: environment bootstrap.
- root configs: build/lint/type/test/runtime alignment.

---

### 13.18 If You Want to Study Like an Interview Bootcamp

For each major file, practice answering these 6 prompts out loud:

1. What does this file own?
2. Why is this logic here and not somewhere else?
3. What can go wrong in this layer?
4. What metrics would you watch for this layer?
5. What alternative design exists and why not chosen now?
6. What is your next improvement if traffic 10x-es?

If you can answer those six for `api/chat`, `rag/ingest`, `rag/embeddings`, and Supabase migrations, you are already stronger than many candidates.

---

## 14) Failure Modes + Debugging Checklist (File-by-File Incident Prep)

This section is for interview scenarios like:

- "Answers got worse after a deploy. Where do you look first?"
- "Uploads are timing out. How would you diagnose?"
- "Why are users getting 429s unexpectedly?"
- "How do you prove whether failure is retrieval, model, or data layer?"

Use this section as your troubleshooting playbook.

---

### 14.1 `src/app/api/chat/route.ts`

#### Common failure modes

1. `401 Unauthorized` because session retrieval fails.
2. `400` due to malformed JSON or missing `gameId/messages`.
3. `404 Game not found` for deleted/stale IDs.
4. `429` from in-memory limiter, perceived as random by users across multiple tabs.
5. `500` embedding provider issues (bad keys, model down, dim mismatch).
6. `500` RPC errors (`match_lore_chunks` signature mismatch, DB issues).
7. Reply quality degradation when retrieval returns low-relevance snippets.

#### Debugging checklist

1. Confirm auth state with a known valid session.
2. Log request body shape (without PII content leakage).
3. Verify `gameId` exists in `games` table.
4. Inspect rate-limit path (`takeChatRateSlot`) and timestamps.
5. Validate embedding provider env vars at runtime.
6. Inspect RPC call parameters and DB function signature.
7. Compare `chunksUsed` and sampled snippet relevance.

#### Signals/metrics to track

- `chat_request_total`, `chat_error_total` by status code
- embedding latency p50/p95
- RPC retrieval latency p50/p95
- completion latency p50/p95
- average `chunksUsed`
- empty-snippet response count

#### Interview angle

"I would isolate failures by stage (auth/validate/rate-limit/embed/retrieve/generate), add stage timing spans, and then decide whether issue is infrastructure, data quality, or prompt/model behavior."

---

### 14.2 `src/lib/rag/embeddings.ts`

#### Common failure modes

1. Missing provider env vars.
2. Provider returns non-JSON or API error shape changes.
3. Returned vector dimension != 768.
4. OpenAI-compatible endpoint path mismatch (`/v1/embeddings` confusion).
5. Batch size too high for provider quotas.

#### Debugging checklist

1. Print chosen provider from `getEmbeddingProvider()`.
2. Validate all required env vars for that provider.
3. Run single-text embedding smoke test.
4. Confirm vector length before DB write/query.
5. Inspect provider raw error payload.
6. Reduce batch size to test rate/size limits.

#### Signals/metrics

- embedding request success/error rate by provider
- dimension mismatch count
- provider-specific timeout rate
- average vectors/sec during ingest

#### Interview angle

"Dimension assertions are guardrails against silent data corruption. I prefer fail-fast behavior over latent retrieval bugs."

---

### 14.3 `src/lib/rag/ingest.ts`

#### Common failure modes

1. Parser produces empty text, resulting in zero chunks.
2. Huge document causes long processing and request timeout.
3. Partial ingestion if an embedding batch fails mid-run.
4. Duplicate ingestion for same file due to retries without idempotency keys.
5. DB insert errors due to schema constraints.

#### Debugging checklist

1. Verify extracted text length.
2. Check chunk count and sample content quality.
3. Confirm batch iteration progress and batch sizes.
4. Inspect exact batch that failed (index range).
5. Validate document status transitions (`processing -> ready/error`).
6. Check if duplicate document/chunks exist.

#### Signals/metrics

- docs ingested per hour
- ingest duration p50/p95
- chunks per document distribution
- failed batch count
- retry rate

#### Interview angle

"I would make ingestion idempotent and asynchronous first. That improves reliability under retries and removes request-time coupling."

---

### 14.4 `src/lib/rag/chunk-text.ts`

#### Common failure modes

1. Overly small chunks reduce semantic completeness.
2. Overly large chunks dilute relevance and increase token usage.
3. Insufficient overlap cuts concepts at boundaries.
4. Overlap too large causes near-duplicate retrieval results.

#### Debugging checklist

1. Sample random chunks from multiple docs.
2. Check boundary quality (sentence clipping).
3. Compare retrieval relevance before/after chunk-size tuning.
4. Validate token budget impact downstream.

#### Signals/metrics

- average chunk length
- overlap ratio
- retrieval duplicate-rate (similar chunks returned together)
- answer grounding score from evaluation set

#### Interview angle

"Chunking is a quality lever, not just preprocessing. I tune it using retrieval metrics and evaluation prompts, not intuition alone."

---

### 14.5 `src/lib/rag/extract-text.ts`

#### Common failure modes

1. Unsupported MIME type.
2. OCR-required PDFs produce low text output.
3. Broken DOCX extraction with strange formatting.
4. JSON flattening leads to verbose but semantically weak text.

#### Debugging checklist

1. Log MIME type and extraction path taken.
2. Measure extracted character count.
3. Compare extracted text against original document manually.
4. Add source-specific adapters for problematic formats.

#### Signals/metrics

- extraction failure rate by MIME type
- extracted chars per file
- zero-content extraction count

#### Interview angle

"Extraction quality is upstream of all RAG quality. If extraction is poor, no model can recover that lost signal."

---

### 14.6 `src/lib/groq-chat.ts`

#### Common failure modes

1. Model/API outage.
2. Prompt drift after edits causes style/grounding regressions.
3. Token limit exceeded when history/snippets are too long.
4. Non-deterministic answer quality fluctuations.

#### Debugging checklist

1. Inspect model response metadata and errors.
2. Compare prompt versions when quality changed.
3. Cap history/snippet lengths and retest.
4. Run fixed evaluation prompts for regression check.

#### Signals/metrics

- completion error rate
- completion latency
- tokens per request
- fallback response frequency

#### Interview angle

"Prompt changes are code changes. I version prompts and test them against a fixed eval suite."

---

### 14.7 `src/lib/chat-rate-limit.ts` + `chat-rate-constants.ts`

#### Common failure modes

1. Legit users throttled too aggressively.
2. Inconsistent behavior across multiple instances.
3. Memory growth if stale entries are not cleaned well.

#### Debugging checklist

1. Inspect limiter state size and timestamp windows.
2. Reproduce rapid-send scenarios in one and many tabs.
3. Compare behavior between local single-instance and production multi-instance.
4. Verify `Retry-After` matches client countdown.

#### Signals/metrics

- 429 rate by endpoint/user segment
- limiter map size over time
- mean retry-after seconds

#### Interview angle

"I’d keep this for MVP but migrate to distributed token-bucket when scaling horizontally."

---

### 14.8 `src/app/api/admin/documents/route.ts`

#### Common failure modes

1. Upload succeeds but ingestion fails (status stuck/error).
2. Storage write permission mismatch.
3. Large files exceed processing window.
4. Partial success leaves orphan storage objects or DB rows.

#### Debugging checklist

1. Verify storage object exists.
2. Verify DB document row status and error details.
3. Correlate upload timestamp with ingest logs.
4. Confirm admin role check and service client availability.
5. Validate compensation logic for partial failures.

#### Signals/metrics

- upload success rate
- ingest completion rate
- average processing duration
- stuck `processing` count older than threshold

#### Interview angle

"For reliability, I’d make upload and ingest explicit separate stages with a durable job state machine."

---

### 14.9 `src/app/api/admin/games/route.ts` + `src/lib/game-genres.ts`

#### Common failure modes

1. Invalid genre values bypassed accidentally.
2. Thumbnail upload URL issues.
3. Duplicate game slugs/titles causing ambiguity.

#### Debugging checklist

1. Validate genre helper usage on every write path.
2. Verify uploaded asset path/public URL.
3. Check uniqueness constraints for identity fields.

#### Signals/metrics

- invalid payload rejection rate
- asset upload failure rate
- update conflict/error rate

#### Interview angle

"I enforce taxonomy at API boundary and ideally back it with DB constraints to prevent drift."

---

### 14.10 `src/app/api/gamespot/route.ts` + `src/lib/gamespot.ts`

#### Common failure modes

1. Third-party API key invalid/expired.
2. Upstream schema changes break mapping.
3. Timeout spikes from remote service.
4. Improperly constrained query params create abuse risk.

#### Debugging checklist

1. Confirm endpoint/param allowlists are intact.
2. Validate upstream HTTP status and body.
3. Compare mapped output shape with expected frontend contract.
4. Check fallback path behavior.

#### Signals/metrics

- upstream success/error/timeout rates
- fallback usage frequency
- endpoint-level latency

#### Interview angle

"Third-party integration should degrade gracefully and never become a trust boundary hole."

---

### 14.11 `src/lib/supabase/service.ts`, `server.ts`, `client.ts`, `middleware.ts`, `src/proxy.ts`

#### Common failure modes

1. Service key missing in environment.
2. Wrong client used in wrong context (privileged operation attempted with anon client).
3. Session refresh issues causing intermittent auth redirects.
4. Middleware matcher accidentally over/under-covers routes.

#### Debugging checklist

1. Validate env keys at process startup.
2. Audit imports: privileged actions must use `service.ts`.
3. Trace middleware route matching and cookie flows.
4. Reproduce login/logout/session-expiration cases explicitly.

#### Signals/metrics

- auth redirect loop count
- unauthorized error rate by route
- middleware execution time

#### Interview angle

"I separate clients by trust level so security intent is visible in code, not implicit."

---

### 14.12 Supabase Migrations (`supabase/migrations/*`)

#### Common failure modes

1. Local and production schema drift.
2. RPC signature mismatch after migration.
3. Index missing or invalid causing retrieval latency spikes.
4. Dimension migration performed without re-ingesting vectors.

#### Debugging checklist

1. Compare applied migrations between environments.
2. Verify function definitions and argument types.
3. Confirm index exists and query plan uses it.
4. Validate sample row vector dimensions.

#### Signals/metrics

- retrieval query latency
- index hit/scan characteristics
- migration success/failure logs

#### Interview angle

"Schema is part of application logic. I treat migrations as versioned contracts and validate app compatibility after every schema change."

---

### 14.13 `src/app/dashboard/page.tsx` + UI components

#### Common failure modes

1. Message state desync after failed requests.
2. Countdown timer mismatch with server retry-after.
3. Duplicate sends without proper button-lock state.
4. Loading skeleton/spinner states not cleared on error.

#### Debugging checklist

1. Reproduce with network throttling and forced 429/500.
2. Verify optimistic update and rollback behavior.
3. Ensure submit lock and disabled states are aligned.
4. Confirm error toasts/messages are user actionable.

#### Signals/metrics

- frontend error event frequency
- time-to-first-answer
- retry attempts per session

#### Interview angle

"Resilience in chat UX means handling partial failures gracefully, not just rendering success paths."

---

### 14.14 `src/hooks/use-submit-lock.ts`

#### Common failure modes

1. Lock never released on exception path.
2. Shared lock used across unrelated forms.

#### Debugging checklist

1. Verify `finally` blocks release lock.
2. Ensure each flow has isolated lock instance.
3. Test rapid clicks and keyboard submits.

#### Signals/metrics

- duplicate submit incidence
- locked-state duration anomalies

#### Interview angle

"Client locking prevents accidental duplicate actions; server idempotency complements it for true safety."

---

### 14.15 Root Config Files

#### `next.config.ts`

**Failure mode**: server package bundling issues (e.g., PDF parser runtime mismatch).  
**Debug**: compare build/runtime logs and module resolution behavior.

#### `tsconfig.json`

**Failure mode**: path alias inconsistencies across test/build.  
**Debug**: ensure tooling (`vitest`, ESLint, TS) uses same alias map.

#### `vitest.config.ts`

**Failure mode**: tests pass locally but fail in CI due to env/runtime differences.  
**Debug**: align Node version and test environment setup.

#### `eslint.config.mjs`

**Failure mode**: noisy lint disables hide real issues.  
**Debug**: tighten rules progressively and monitor false positives.

#### `package.json`

**Failure mode**: dependency upgrades subtly break provider APIs.  
**Debug**: pin versions carefully and run smoke tests for ingestion/chat paths.

---

### 14.16 Triage Decision Tree (Fast Incident Isolation)

When chat quality/availability drops, run this order:

1. **Availability first**: is `/api/chat` returning non-200?
2. **Auth first**: are users authenticated correctly?
3. **Rate limit**: 429 spike?
4. **Embed stage**: vector generation errors?
5. **Retrieve stage**: RPC errors or zero/irrelevant chunks?
6. **Generate stage**: Groq errors or degraded response quality?
7. **Data quality**: were recent ingested docs parsed/chunked correctly?

This prevents random debugging and gives you a crisp incident narrative.

---

### 14.17 Interview Drill: "Root Cause + Fix + Prevention" Template

For each incident you describe:

1. **Symptom**: "Users received vague answers and latency increased."
2. **Root cause**: "Embedding provider fallback misconfigured; retrieval returned poor matches."
3. **Fix**: "Restored provider config and validated dimensions."
4. **Prevention**: "Added startup health checks and retrieval relevance monitors."
5. **Long-term**: "Introduce automated eval set in CI for grounding regression detection."

Use this pattern repeatedly; interviewers love structured incident communication.
