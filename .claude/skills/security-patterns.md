# Security Patterns Skill

## Overview
Security rules from Ultracite for safe code in this project.

## Secrets and Credentials

### No Hardcoded Secrets
```typescript
// ❌ Bad
const API_KEY = 'sk-1234567890abcdef';
const password = 'admin123';

// ✅ Good
const API_KEY = process.env.API_KEY;
const password = process.env.ADMIN_PASSWORD;
```

### Environment Variables
```typescript
// .env.local (never commit)
AUTH_SECRET=your-secret-here
POSTGRES_URL=postgresql://...
DEEPSEEK_API_KEY=sk-...

// .env.example (commit this)
AUTH_SECRET=
POSTGRES_URL=
DEEPSEEK_API_KEY=
```

## XSS Prevention

### No dangerouslySetInnerHTML with Children
```typescript
// ❌ Bad
<div dangerouslySetInnerHTML={{ __html: html }}>
  {children}
</div>

// ✅ Good - one or the other
<div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
// or
<div>{children}</div>
```

### Sanitize User Input
```typescript
// When dangerouslySetInnerHTML is needed
import DOMPurify from 'dompurify';

const sanitizedHtml = DOMPurify.sanitize(userHtml);
<div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
```

## Links and Navigation

### External Links Need rel="noopener"
```typescript
// ❌ Bad
<a href="https://external.com" target="_blank">Link</a>

// ✅ Good
<a href="https://external.com" target="_blank" rel="noopener noreferrer">
  Link
</a>
```

### Valid Anchors Only
```typescript
// ❌ Bad
<a href="javascript:void(0)" onClick={handleClick}>Click</a>
<a href="#">Click</a>

// ✅ Good
<button type="button" onClick={handleClick}>Click</button>
<a href="/actual-path">Click</a>
```

## Cookies

### No Direct document.cookie Assignment
```typescript
// ❌ Bad
document.cookie = `token=${token}`;

// ✅ Good - use Next.js cookies API
import { cookies } from 'next/headers';

const cookieStore = await cookies();
cookieStore.set('token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
});
```

## TypeScript Safety

### No @ts-ignore
```typescript
// ❌ Bad
// @ts-ignore
const value = unsafeOperation();

// ✅ Good - fix the type or use proper type assertion
const value = unsafeOperation() as ExpectedType;
// or with type guard
if (isExpectedType(value)) {
  // safe to use
}
```

### No any Type
```typescript
// ❌ Bad
const data: any = fetchData();

// ✅ Good
const data: UserData = fetchData();
// or
const data: unknown = fetchData();
if (isUserData(data)) { ... }
```

## No eval()

```typescript
// ❌ Bad
eval(userCode);
new Function(userCode)();

// ✅ Good - use safe alternatives
// For JSON parsing
const data = JSON.parse(jsonString);

// For dynamic behavior, use predefined functions
const actions = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
};
actions[actionName](1, 2);
```

## Authentication Patterns

### Session Validation
```typescript
// lib/auth.ts
import { auth } from '@/app/(auth)/auth';

export const getSession = async () => {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session;
};

// In API route
export async function POST(request: Request) {
  const session = await getSession();
  // session.user is guaranteed to exist
}
```

### Rate Limiting
```typescript
// Check user entitlements
const entitlements = entitlementsByUserType[session.user.type];
if (messageCount >= entitlements.maxMessages) {
  throw new ChatSDKError('rate_limit_exceeded', 'Too many messages');
}
```

## Input Validation

### Zod Schemas
```typescript
import { z } from 'zod';

const messageSchema = z.object({
  content: z.string().min(1).max(10000),
  chatId: z.string().uuid(),
});

// In API route
const body = await request.json();
const { content, chatId } = messageSchema.parse(body);
```

### SQL Injection Prevention
```typescript
// Drizzle ORM handles parameterization automatically
// ❌ Bad (if using raw SQL)
const query = `SELECT * FROM users WHERE id = '${userId}'`;

// ✅ Good - Drizzle handles this
import { eq } from 'drizzle-orm';
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
});
```

## Node.js Specific

### Use node: Protocol
```typescript
// ❌ Bad
import fs from 'fs';
import path from 'path';

// ✅ Good
import fs from 'node:fs';
import path from 'node:path';
```

### No __dirname/__filename in Global Scope
```typescript
// ❌ Bad (at module level in ESM)
const configPath = path.join(__dirname, 'config.json');

// ✅ Good
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const configPath = join(__dirname, 'config.json');
```
