# Architecture

## AI Agent Routing System

```
POST /api/chat
    └─ createChatStream() (lib/ai/agent/index.ts)
        ├─ classifyUserIntent() → Determines intent with confidence score
        └─ Routes to:
            ├─ resume_opt → resumeOptimizationAgent()
            ├─ mock_interview → mockInterviewAgent()
            └─ default → standard chat stream
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/ai/agent/index.ts` | Main entry, agent routing |
| `lib/ai/agent/classify.ts` | Intent classification (structured output) |
| `lib/ai/agent/resume-opt.ts` | Resume optimization agent |
| `lib/ai/agent/mock-interview.ts` | Interview simulation agent |
| `lib/ai/agent/common.ts` | Shared utilities (PDF processing, message saving) |

## AI Provider Configuration

- `lib/ai/providers.ts` - Provider routing (DeepSeek direct, others via Vercel AI Gateway)
- `lib/ai/models.ts` - Available models (Anthropic, OpenAI, Google, DeepSeek)
- Default model: DeepSeek Chat

## AI Tools

Tools are defined in `lib/ai/tools/`:

| Tool | Purpose |
|------|---------|
| `evaluateSkills` | Algorithmic skill scoring based on experience |
| `createDocument` | Create document artifacts |
| `updateDocument` | Update existing documents |
| `requestSuggestions` | Generate document suggestions |

## Authentication (Auth.js v5)

- Credentials provider (email/password with bcrypt)
- Guest mode support
- Session enrichment with user type
- Rate limiting via `entitlementsByUserType`

## Route Groups

- `(auth)` - Login/register pages
- `(chat)` - Main chat interface and API routes
