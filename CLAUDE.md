# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RenderMe - An intelligent AI assistant for frontend developers providing resume optimization and technical interview preparation. Built with Next.js 16 (App Router), React 19, and Vercel AI SDK.

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

## Development Workflow

### Progress Tracking

项目使用 `progress.md` 和 `feature_list.json` 跟踪开发进度。

**每次开发任务完成后必须:**

1. **更新 progress.md**
   - 将完成的功能从"待开发"移到"已完成"
   - 勾选对应的测试用例 `[x]`
   - 在"更新日志"中添加变更记录

2. **更新 feature_list.json**
   - **只能**将对应测试用例的 `status` 从 `"failed"` 改为 `"passed"`
   - **只能**更新 `summary` 中的统计数据
   - **禁止**修改功能列表的内容（功能名称、描述、测试步骤等）
   - **禁止**添加或删除功能/测试用例

3. **执行测试验证**
   - 按照 feature_list.json 中的测试步骤手动验证功能
   - 确保功能正常工作后再标记为完成

### 示例更新流程

```bash
# 1. 实现功能
# 2. 启动开发服务器测试
pnpm run dev

# 3. 按测试步骤验证功能
# 4. 更新 progress.md 和 feature_list.json
# 5. 提交代码
git add .
git commit -m "feat: implement feature X"
```

### 文件说明

| 文件 | 用途 |
|------|------|
| `progress.md` | 人类可读的进度跟踪，包含更新日志 |
| `feature_list.json` | 结构化的功能和测试用例定义 |
| `init.sh` | 开发环境初始化脚本 |
