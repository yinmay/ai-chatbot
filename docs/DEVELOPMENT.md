# Development Workflow

## Progress Tracking

项目使用 `progress.md` 和 `feature_list.json` 跟踪开发进度。

### Files

| File | Purpose |
|------|---------|
| `progress.md` | Human-readable progress, changelog |
| `feature_list.json` | Structured feature and test case definitions |
| `init.sh` | Development environment setup script |

## After Completing a Task

### 1. Update progress.md
- Move completed feature from "待开发" to "已完成"
- Check the test case `[x]`
- Add changelog entry

### 2. Update feature_list.json
- Change test case `status` from `"failed"` to `"passed"`
- Update `summary` statistics
- **DO NOT** modify feature names, descriptions, or test steps
- **DO NOT** add or remove features/test cases

### 3. Verify
- Follow test steps in `feature_list.json`
- Ensure feature works before marking complete

## Example Flow

```bash
# 1. Implement feature
# 2. Start dev server
pnpm dev

# 3. Test according to feature_list.json steps
# 4. Update progress.md and feature_list.json
# 5. Commit
git add .
git commit -m "feat: implement feature X"
```

## Environment Setup

```bash
# First time setup
chmod +x init.sh
./init.sh

# Or manually
pnpm install
cp .env.example .env.local
# Edit .env.local with your values
pnpm db:push
pnpm dev
```

## Required Environment Variables

```bash
AUTH_SECRET=           # NextAuth secret
POSTGRES_URL=          # Neon PostgreSQL
REDIS_URL=             # For resumable streams
BLOB_READ_WRITE_TOKEN= # Vercel Blob (optional for dev)
DEEPSEEK_API_KEY=      # AI provider key
```
