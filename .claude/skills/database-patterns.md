# Database Patterns Skill

## Overview
Drizzle ORM patterns for PostgreSQL in this project.

## Schema Definition

### Table Template
```typescript
// lib/db/schema.ts
import { pgTable, varchar, timestamp, text, json, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('User', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});
```

### Relations
```typescript
import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many }) => ({
  chats: many(chats),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, {
    fields: [chats.userId],
    references: [users.id],
  }),
  messages: many(messages),
}));
```

### Composite Primary Keys
```typescript
export const documents = pgTable(
  'Document',
  {
    id: varchar('id', { length: 36 }).notNull(),
    createdAt: timestamp('createdAt').notNull(),
    // ... other columns
  },
  (table) => [primaryKey({ columns: [table.id, table.createdAt] })]
);
```

### JSON Columns
```typescript
export const messages = pgTable('Message_v2', {
  id: varchar('id', { length: 36 }).primaryKey(),
  chatId: varchar('chatId', { length: 36 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  parts: json('parts').notNull(), // Array of message parts
  attachments: json('attachments'), // Optional attachments
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});
```

## Queries

### Select with Relations
```typescript
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Find one
const chat = await db.query.chats.findFirst({
  where: eq(chats.id, chatId),
  with: {
    messages: true,
    user: true,
  },
});

// Find many
const userChats = await db.query.chats.findMany({
  where: eq(chats.userId, userId),
  orderBy: (chats, { desc }) => [desc(chats.createdAt)],
  limit: 10,
});
```

### Insert
```typescript
import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema';

await db.insert(chats).values({
  id: generateId(),
  userId: session.user.id,
  title: 'New Chat',
  visibility: 'private',
});

// Insert multiple
await db.insert(messages).values([
  { id: '1', chatId, role: 'user', parts: [...] },
  { id: '2', chatId, role: 'assistant', parts: [...] },
]);
```

### Update
```typescript
import { eq } from 'drizzle-orm';

await db
  .update(chats)
  .set({ title: newTitle })
  .where(eq(chats.id, chatId));
```

### Delete
```typescript
import { eq, and, gt } from 'drizzle-orm';

// Single delete
await db.delete(chats).where(eq(chats.id, chatId));

// Conditional delete
await db.delete(messages).where(
  and(
    eq(messages.chatId, chatId),
    gt(messages.createdAt, timestamp)
  )
);
```

## Query Helpers

### Project Query Pattern
```typescript
// lib/db/queries.ts
import { db } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';

export const getChatById = async ({ id }: { id: string }) => {
  return db.query.chats.findFirst({
    where: eq(chats.id, id),
  });
};

export const getMessagesByChatId = async ({ chatId }: { chatId: string }) => {
  return db.query.messages.findMany({
    where: eq(messages.chatId, chatId),
    orderBy: [desc(messages.createdAt)],
  });
};

export const saveMessages = async ({
  chatId,
  messages: newMessages,
}: {
  chatId: string;
  messages: Array<{ role: string; parts: unknown[] }>;
}) => {
  await db.insert(messages).values(
    newMessages.map((msg) => ({
      id: generateId(),
      chatId,
      role: msg.role,
      parts: msg.parts,
      createdAt: new Date(),
    }))
  );
};
```

## Migrations

### Create Migration
```bash
pnpm db:generate  # Generate from schema changes
```

### Apply Migrations
```bash
pnpm db:migrate   # Run pending migrations
pnpm db:push      # Push schema directly (dev only)
```

### Migration File Structure
```typescript
// lib/db/migrations/0001_create_users.sql
CREATE TABLE "User" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "email" varchar(64) NOT NULL,
  "password" varchar(64),
  "createdAt" timestamp DEFAULT now() NOT NULL
);
```

### Migration Runner
```typescript
// lib/db/migrate.ts
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { db } from './index';

const runMigrations = async () => {
  if (!process.env.POSTGRES_URL) {
    console.log('⏭️ POSTGRES_URL not defined, skipping migrations');
    return;
  }

  await migrate(db, { migrationsFolder: './lib/db/migrations' });
  console.log('✅ Migrations complete');
};

runMigrations();
```

## Connection

### Neon Serverless Setup
```typescript
// lib/db/index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.POSTGRES_URL!);
export const db = drizzle(sql, { schema });
```

## Best Practices

### Transaction Pattern
```typescript
await db.transaction(async (tx) => {
  await tx.insert(chats).values({ ... });
  await tx.insert(messages).values({ ... });
});
```

### Type Inference
```typescript
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { chats } from './schema';

export type Chat = InferSelectModel<typeof chats>;
export type NewChat = InferInsertModel<typeof chats>;
```
