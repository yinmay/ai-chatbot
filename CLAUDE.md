# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Career Assistant - An intelligent AI assistant for frontend developers providing resume optimization and technical interview preparation. Built with Next.js 16 (App Router), React 19, and Vercel AI SDK.

## Commands

```bash
pnpm dev              # Start dev server with Turbo mode
pnpm build            # Run migrations + build
pnpm db:migrate       # Apply database migrations
pnpm db:push          # Push schema changes to database
pnpm db:studio        # Open Drizzle Studio (visual DB manager)
pnpm lint             # Lint with Ultracite (npx ultracite check)
pnpm format           # Format with Ultracite (npx ultracite fix)
pnpm test             # Run Playwright e2e tests
```

## Architecture

### Agent Routing System

The core AI logic uses an agent-based routing pattern:

```
POST /api/chat
    └─ createChatStream() (lib/ai/agent/index.ts)
        ├─ classifyUserIntent() → Determines intent with confidence score
        └─ Routes to:
            ├─ resume_opt → resumeOptimizationAgent()
            ├─ mock_interview → mockInterviewAgent()
            └─ default → standard chat stream
```

**Key files:**
- `lib/ai/agent/classify.ts` - Intent classification using structured output
- `lib/ai/agent/resume-opt.ts` - Resume optimization agent with evaluateSkills tool
- `lib/ai/agent/mock-interview.ts` - Interview simulation agent
- `lib/ai/agent/common.ts` - Shared `executeStreamText()` utility

### AI Provider Configuration

- `lib/ai/providers.ts` - Provider routing (DeepSeek direct, others via Vercel AI Gateway)
- `lib/ai/models.ts` - Available models (Anthropic, OpenAI, Google, DeepSeek)
- Default model: DeepSeek Chat

### Database (Drizzle + PostgreSQL)

Schema in `lib/db/schema.ts`:
- **User** - Accounts with regular/guest types
- **Chat** - Sessions with visibility settings
- **Message_v2** - Messages with parts and attachments (JSON)
- **Document** - Artifacts (text, code, image, sheet kinds)
- **Vote_v2** - Message voting

Migrations: `lib/db/migrations/`

### Authentication (Auth.js v5)

- Credentials provider (email/password with bcrypt)
- Guest mode support
- Session enrichment with user type
- Rate limiting via `entitlementsByUserType`

### Route Groups

- `(auth)` - Login/register pages
- `(chat)` - Main chat interface and API routes

## Code Style (Ultracite)

This project uses Ultracite (Biome-based) for linting and formatting. Key rules:
- No TypeScript enums - use `as const` objects
- No `any` type
- Use `import type` for type imports
- Use `for...of` instead of `Array.forEach`
- Arrow functions over function expressions
- No `var` - use `const`/`let`

## AI Tools

Tools are defined in `lib/ai/tools/`:
- `resumeTemplate` - Generate resume templates by tech stack and experience level
- `createDocument` / `updateDocument` - Artifact management
- `requestSuggestions` - Document suggestions

## Environment Variables

Required (see `.env.example`):
- `AUTH_SECRET` - NextAuth secret
- `POSTGRES_URL` - Neon PostgreSQL
- `REDIS_URL` - For resumable streams
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob
- `AI_GATEWAY_API_KEY` or `DEEPSEEK_API_KEY` - AI provider keys
