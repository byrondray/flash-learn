# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

FlashLearn — a Next.js 15 (App Router) app that turns notes into AI-generated flashcards and quizzes. Notes support real-time multi-user collaborative editing (Tiptap + Yjs) via a separate Hocuspocus WebSocket server. Auth is Kinde. DB is Turso/libSQL via Drizzle ORM. AI generation uses OpenAI/LangChain.

## Commands

```bash
npm run dev              # Next.js dev server with turbopack
npm run build             # production build
npm run start             # run production build
npm run lint               # next lint

npm run push               # bunx drizzle-kit push  (push schema to DB)
npm run generate           # bunx drizzle-kit generate  (generate migrations into ./drizzle)
```

There is no test runner configured in this repo (no `test` script, no test files).

### Real-time collaboration server (separate process, required for live note editing)

The collaboration backend lives in `server/` and is a standalone Node project (own `package.json`, `type: module`), not part of the Next.js build:

```bash
cd server
npm run dev    # tsx watch index.ts — Hocuspocus server on $PORT (default 8080)
npm run start  # tsx index.ts
```

The Next.js app connects to it via `NEXT_PUBLIC_COLLAB_URL` (defaults to `ws://localhost:8080`), set in [src/app/notes/[id]/page.tsx](src/app/notes/[id]/page.tsx). Run this server locally alongside `npm run dev` whenever testing note editing/collaboration.

### AWS Lambda WebSocket functions (`src/lambda/`)

`src/lambda/` is a **separate, currently-unwired** AWS API Gateway WebSocket implementation (DynamoDB-backed connection tracking) with its own `package.json`/build/deploy scripts (`npm run deploy` inside `src/lambda`, invoked via the root `deploy:websocket` script). The app does not call this at runtime today — collaboration goes through the Hocuspocus `server/` above instead. Be aware both exist so you don't conflate them.

## Architecture

### Server actions, not API routes

Feature logic lives in per-route `actions.ts` files marked `"use server"`, colocated with the page under `src/app/<feature>/.../[id]/actions.ts`. There is no REST API layer beyond `src/app/api/auth/*` (Kinde auth routes) and `src/app/api/og` (OG image). When adding a feature, follow the existing pattern:

1. **Action** (`actions.ts`) — parses/validates input with a Zod schema from [src/lib/validations.ts](src/lib/validations.ts), gets the current user via `getKindeServerSession()`, checks authorization, then calls a service function. Never put DB queries directly in an action.
2. **Service** (`src/services/*.service.ts`) — the only layer that touches Drizzle/the DB. Pure data-access functions, no auth logic.
3. **Schema** (`src/database/schema/*.ts`) — Drizzle table definitions; each exports `X` (table), `X` select type, and `XInsert` insert type.

Feature areas each follow this `page.tsx` + `actions.ts` (+ optional `client.tsx` for public/share pages, `layout.tsx`) structure under `src/app/{notes,flashCards,quizQuestions}/...`.

### Authorization model

Notes have an **owner** (`notes.userId`) and optional **collaborators** (`noteCollaborators`, with `permission: "edit" | "view"`). Access checks go through `src/services/collaborator.service.ts` (`canAccessNote`, `isNoteOwner`) — always check role/permission before mutating, and branch owner vs. collaborator update paths (see [src/app/notes/[id]/actions.ts](src/app/notes/[id]/actions.ts) for the pattern: owner writes are scoped by `userId`, collaborator writes are not).

Notes also support three separate public share mechanisms, each its own unique token column on `notes`: `inviteToken` (collaboration invite), `quizShareToken`, `flashcardShareToken`. Public share/invite pages live at `.../share/[token]` and `.../invite/[token]` and are explicitly excluded from auth in [src/middleware.ts](src/middleware.ts)'s `publicPaths`. When adding a new public-token-gated route, add its prefix there.

### Auth middleware

[src/middleware.ts](src/middleware.ts) wraps Kinde's `withAuth` and applies to `/notes/:path*`, `/flashCards/:path*`, `/quizQuestions/:path*`, except paths under `publicPaths` (share/invite links).

### Database

Turso (libSQL) accessed through Drizzle. [src/database/client.ts](src/database/client.ts) exports a memoized `getDB()` singleton — always use this, don't instantiate new clients. `IS_DEV` env var switches between `LOCAL_DB_URL` and `DB_URL`. Schema files live in `src/database/schema/`; migrations are generated into `./drizzle` via `drizzle-kit` (config: [drizzle.config.ts](drizzle.config.ts)).

Core tables: `users` → `notes` (1:many) → `flashCards` / `quizQuestions` (1:many each) → `questionOptions` / `testScores`. `noteCollaborators` is a join table (composite PK `noteId`+`userId`) with per-user `permission`.

### Real-time collaborative editing

Editor is Tiptap (`@tiptap/react` + extensions) bound to a Yjs doc. [src/hooks/useCollaboration.ts](src/hooks/useCollaboration.ts) wraps `HocuspocusProvider`, authenticating with the Kinde user ID as the token and the note ID as the document name. Server-side, [server/index.ts](server/index.ts) authenticates connections by checking note ownership/collaborator rows directly against the DB (raw SQL over the same libSQL client, not Drizzle), and persists Yjs state as a blob (`notes.yjsState`) plus a rendered HTML snapshot (`notes.content`) on every store — content is converted between Yjs docs and Tiptap HTML using `@hocuspocus/transformer` and a JSDOM-polyfilled `generateHTML`/`generateJSON` (needed because Tiptap's server-side HTML generation expects a DOM).

### AI generation

[src/utils/createAiQuestions.ts](src/utils/createAiQuestions.ts) generates flashcards/quiz questions via LangChain's `ChatOpenAI` (gpt-4o). Note content is chunked (~400 chars/sentence-boundary split) and each chunk is sent through a JSON-output prompt chain with retry/timeout logic (3 retries, 8s per-attempt timeout, shrinking chunk size on retry); results are capped at 5 items. `generateUniqueQuestions` additionally excludes previously-generated questions by passing them into the prompt. These calls are slow — Vercel function config in [vercel.json](vercel.json) raises `maxDuration`/`memory` specifically for the quiz/flashcard `actionts.ts` action routes.

### Validation & rate limiting

All server action inputs are validated with Zod schemas from [src/lib/validations.ts](src/lib/validations.ts) before touching auth or the DB. [src/lib/rate-limit.ts](src/lib/rate-limit.ts) is an in-memory (per-instance, not distributed) sliding-window limiter keyed by user ID — used to throttle expensive AI-generation actions.

### Path alias

`@/*` maps to `src/*` (see [tsconfig.json](tsconfig.json)).
