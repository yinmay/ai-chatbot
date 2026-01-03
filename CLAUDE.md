# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**RenderMe** - AI assistant for frontend developers providing resume optimization and technical interview preparation.

**Tech Stack**: Next.js 16 (App Router), React 19, Vercel AI SDK, Drizzle ORM, PostgreSQL

## Quick Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm db:push      # Push schema to database
pnpm lint         # Check code style
pnpm format       # Auto-fix code style
```

## Code Style (Ultracite/Biome)

- No TypeScript `enum` - use `as const` objects
- No `any` type
- Use `import type` for type imports
- Use `for...of` instead of `.forEach()`
- Arrow functions over function expressions
- `const`/`let` only, no `var`

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `lib/ai/agent/` | AI agent routing and handlers |
| `lib/ai/tools/` | AI tool definitions |
| `lib/db/` | Database schema and queries |
| `app/(chat)/api/` | API routes |

## Additional Documentation

The following docs contain domain-specific details. Read as needed:

- [Architecture](./docs/ARCHITECTURE.md) - System design and AI agent flow
- [Database](./docs/DATABASE.md) - Schema and data model
- [Development](./docs/DEVELOPMENT.md) - Workflow and progress tracking
