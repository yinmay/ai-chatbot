# TypeScript Patterns Skill

## Overview
Enforces TypeScript best practices aligned with Ultracite/Biome rules for this project.

## Core Rules

### No Enums - Use `as const` Objects
```typescript
// ❌ Bad
enum Status {
  Active = 'active',
  Inactive = 'inactive'
}

// ✅ Good
const Status = {
  Active: 'active',
  Inactive: 'inactive'
} as const;
type Status = typeof Status[keyof typeof Status];
```

### No `any` Type
```typescript
// ❌ Bad
const data: any = fetchData();

// ✅ Good
const data: UserData = fetchData();
// or use unknown with type guards
const data: unknown = fetchData();
if (isUserData(data)) { ... }
```

### Import/Export Types Correctly
```typescript
// ❌ Bad
import { UserType } from './types';
export { UserType };

// ✅ Good
import type { UserType } from './types';
export type { UserType };
```

### No Non-Null Assertions
```typescript
// ❌ Bad
const user = getUser()!;

// ✅ Good
const user = getUser();
if (!user) throw new Error('User not found');
```

### Avoid Literal Type Annotations
```typescript
// ❌ Bad - unnecessary annotation
const name: string = 'John';
const count: number = 5;

// ✅ Good - inferred from literal
const name = 'John';
const count = 5;
```

### Consistent Array Syntax
```typescript
// Pick one and be consistent (project uses T[])
const items: string[] = [];
// Not: const items: Array<string> = [];
```

### No TypeScript Namespaces
```typescript
// ❌ Bad
namespace Utils {
  export const helper = () => {};
}

// ✅ Good - use ES modules
export const helper = () => {};
```

### No Parameter Properties
```typescript
// ❌ Bad
class User {
  constructor(private name: string) {}
}

// ✅ Good
class User {
  private name: string;
  constructor(name: string) {
    this.name = name;
  }
}
```

## Project-Specific Patterns

### Zod Schema Definitions
```typescript
import { z } from 'zod';

// Define schemas for structured output
const intentSchema = z.object({
  intent: z.enum(['resume_opt', 'mock_interview', 'related_topics', 'others']),
  confidence: z.number().min(0).max(1),
});

type Intent = z.infer<typeof intentSchema>;
```

### Server Actions Type Safety
```typescript
'use server';

import type { UIMessage } from 'ai';

export async function generateTitle({ message }: { message: UIMessage }) {
  // Type-safe server action
}
```
