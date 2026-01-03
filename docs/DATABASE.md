# Database

## Overview

- **ORM**: Drizzle
- **Database**: PostgreSQL (Neon)
- **Schema**: `lib/db/schema.ts`
- **Migrations**: `lib/db/migrations/`

## Schema

### User
```typescript
{
  id: UUID (PK)
  email: VARCHAR(64)
  password: VARCHAR(64)  // bcrypt hash
}
```

### Chat
```typescript
{
  id: UUID (PK)
  userId: UUID (FK → User)
  title: TEXT
  visibility: "public" | "private"
  createdAt: TIMESTAMP
}
```

### Message_v2
```typescript
{
  id: UUID (PK)
  chatId: UUID (FK → Chat)
  role: "user" | "assistant"
  parts: JSON      // Multi-modal content (text, file, tool-call)
  attachments: JSON
  createdAt: TIMESTAMP
}
```

#### Message Parts Structure
```json
{
  "parts": [
    { "type": "text", "text": "..." },
    { "type": "file", "url": "data:...", "mediaType": "application/pdf" },
    { "type": "tool-invocation", "toolName": "evaluateSkills", "result": {...} }
  ]
}
```

### Document
```typescript
{
  id: UUID
  userId: UUID (FK → User)
  title: TEXT
  content: TEXT
  kind: "text" | "code" | "image" | "sheet"
  createdAt: TIMESTAMP
  // Composite PK: (id, createdAt) for versioning
}
```

### Vote_v2
```typescript
{
  chatId: UUID (FK → Chat)
  messageId: UUID (FK → Message_v2)
  isUpvoted: BOOLEAN
  // Composite PK: (chatId, messageId)
}
```

### Stream
```typescript
{
  id: UUID (PK)
  chatId: UUID (FK → Chat)
  createdAt: TIMESTAMP
}
```

## Commands

```bash
pnpm db:push      # Push schema changes
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio
```

## Environment Variables

```bash
POSTGRES_URL=postgresql://user:password@host:5432/database
```
