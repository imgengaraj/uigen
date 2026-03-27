# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Initial setup (install deps + generate Prisma client + run migrations)
npm run setup

# Development server (uses Turbopack, requires node-compat.cjs)
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Run all tests
npm test

# Run a single test file
npx vitest run src/lib/__tests__/file-system.test.ts

# Reset database
npm run db:reset
```

After changing the Prisma schema, run: `npx prisma migrate dev`

## Architecture Overview

UIGen is an AI-powered React component generator. Users describe a component in the chat; the AI generates/edits files in a virtual file system; a live preview renders the result in an iframe.

### Data Flow

1. User sends a message → `ChatContext` (`src/lib/contexts/chat-context.tsx`) calls `/api/chat` via Vercel AI SDK's `useChat`
2. The entire virtual file system is serialized and included in every request body
3. `/src/app/api/chat/route.ts` reconstructs the VFS, streams a response from Claude with up to 40 tool-call steps
4. Tool calls (`str_replace_editor`, `file_manager`) are intercepted client-side in `FileSystemContext.handleToolCall` and applied to the in-memory VFS
5. `PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) reacts to `refreshTrigger` — it uses Babel standalone to transform JSX, creates blob URLs, builds an import map, and injects it into an `<iframe srcdoc>`

### Key Modules

**`src/lib/file-system.ts`** — `VirtualFileSystem` class. Fully in-memory tree; no disk I/O. Key methods: `serialize()` / `deserializeFromNodes()` for round-tripping through the API and database.

**`src/lib/transform/jsx-transformer.ts`** — Client-side JSX transform pipeline. Uses `@babel/standalone` to compile `.jsx`/`.tsx` to JS, creates blob URLs for each file, builds an ES module import map, resolves `@/` aliases, fetches third-party packages from `esm.sh`, and generates a complete HTML document for the preview iframe. Tailwind CSS is loaded from CDN inside the iframe.

**`src/lib/provider.ts`** — Returns either the real `claude-haiku-4-5` model (when `ANTHROPIC_API_KEY` is set) or a `MockLanguageModel` that produces static multi-step responses without making API calls.

**`src/lib/tools/`** — AI tool implementations that operate on `VirtualFileSystem`:
- `str-replace.ts`: `str_replace_editor` tool (create/str_replace/insert commands)
- `file-manager.ts`: `file_manager` tool (rename/delete commands)

**`src/lib/contexts/`** — Two React contexts wrapping the entire app:
- `FileSystemContext`: owns the `VirtualFileSystem` instance, exposes mutation methods, and handles incoming tool calls
- `ChatContext`: wraps Vercel AI SDK's `useChat`, passes the serialized VFS in every request body, and forwards tool calls to `FileSystemContext`

**`src/lib/auth.ts`** — JWT sessions stored in `httpOnly` cookies (7-day expiry). `JWT_SECRET` env var defaults to a hardcoded development value.

**`src/lib/prompts/generation.tsx`** — System prompt sent to Claude, cached with Anthropic's `ephemeral` cache control.

### Persistence

Prisma + SQLite (`prisma/dev.db`). The `Project` model stores `messages` (JSON array) and `data` (serialized VFS nodes) as plain strings. Projects only save to DB when a user is authenticated; anonymous sessions track work in `anon-work-tracker.ts` (likely localStorage).

The Prisma client is generated to `src/generated/prisma` (not the default location).

### Routing

- `/` — home page, anonymous or authenticated
- `/[projectId]` — loads a saved project by ID; passes existing messages and VFS data to `MainContent`

`src/middleware.ts` handles auth-aware routing.

### Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | No | Falls back to mock provider if absent |
| `JWT_SECRET` | No | Defaults to `"development-secret-key"` |

### Testing

Vitest with jsdom + React Testing Library. Config in `vitest.config.mts`. Tests live in `__tests__` directories co-located with source files.
