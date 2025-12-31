# React Patterns Skill

## Overview
React and JSX best practices aligned with Ultracite/Biome rules for this Next.js project.

## Component Rules

### No Components Inside Components
```typescript
// ❌ Bad
const Parent = () => {
  const Child = () => <div>Child</div>; // Re-created on every render
  return <Child />;
};

// ✅ Good
const Child = () => <div>Child</div>;
const Parent = () => <Child />;
```

### Key Props - No Array Index
```typescript
// ❌ Bad
{items.map((item, index) => <Item key={index} />)}

// ✅ Good
{items.map((item) => <Item key={item.id} />)}
```

### Use Short Fragment Syntax
```typescript
// ❌ Bad
import { Fragment } from 'react';
<Fragment><div /><div /></Fragment>

// ✅ Good
<><div /><div /></>
```

### Button Type Required
```typescript
// ❌ Bad
<button onClick={handleClick}>Click</button>

// ✅ Good
<button type="button" onClick={handleClick}>Click</button>
<button type="submit">Submit</button>
```

### No Self-Closing Tags for Elements with Children
```typescript
// ❌ Bad
<div></div>

// ✅ Good
<div />
// or with children
<div>Content</div>
```

### Hook Dependencies
```typescript
// ❌ Bad - missing dependency
useEffect(() => {
  fetchData(userId);
}, []); // userId missing

// ✅ Good
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

### Hooks at Top Level Only
```typescript
// ❌ Bad
const Component = () => {
  if (condition) {
    const [state, setState] = useState(false); // Inside conditional
  }
};

// ✅ Good
const Component = () => {
  const [state, setState] = useState(false);
  if (condition) { ... }
};
```

## Next.js Specific

### Use next/image
```typescript
// ❌ Bad
<img src="/photo.jpg" alt="Photo" />

// ✅ Good
import Image from 'next/image';
<Image src="/photo.jpg" alt="Photo" width={500} height={300} />
```

### No next/head in App Router
```typescript
// ❌ Bad - Pages Router pattern
import Head from 'next/head';

// ✅ Good - App Router uses metadata export
export const metadata = {
  title: 'Page Title',
};
```

## Project Patterns

### Server vs Client Components
```typescript
// Server Component (default in App Router)
// lib/ai/agent/index.ts pattern
export async function createChatStream({ ... }) {
  // Can use async/await directly
  const result = await db.query.chats.findFirst({ ... });
}

// Client Component
'use client';
import { useChat } from '@ai-sdk/react';

export function ChatInterface() {
  const { messages, input, handleSubmit } = useChat();
  // ...
}
```

### Suspense Boundaries
```typescript
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AsyncComponent />
    </Suspense>
  );
}
```
