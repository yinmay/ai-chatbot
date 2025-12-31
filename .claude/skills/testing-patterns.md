# Testing Patterns Skill

## Overview
Testing best practices from Ultracite for Playwright e2e tests in this project.

## Running Tests

```bash
pnpm test  # Runs: PLAYWRIGHT=True pnpm exec playwright test
```

## Test File Structure

### Basic Test
```typescript
// tests/chat.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chat Interface', () => {
  test('should send a message', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="chat-input"]', 'Hello');
    await page.click('[data-testid="send-button"]');
    await expect(page.locator('[data-testid="message"]')).toBeVisible();
  });
});
```

## Ultracite Testing Rules

### No Exports in Test Files
```typescript
// ❌ Bad
export const testHelper = () => { };
module.exports = { helper };

// ✅ Good - keep helpers in separate files
// tests/helpers.ts
export const testHelper = () => { };

// tests/chat.spec.ts
import { testHelper } from './helpers';
```

### No Focused Tests
```typescript
// ❌ Bad - will only run this test
test.only('should work', async ({ page }) => { });

// ✅ Good
test('should work', async ({ page }) => { });
```

### No Disabled Tests
```typescript
// ❌ Bad - test is skipped
test.skip('should work', async ({ page }) => { });

// ✅ Good - either fix or remove
test('should work', async ({ page }) => { });
```

### Assertions Inside Test Functions
```typescript
// ❌ Bad
const checkVisible = async (page) => {
  expect(page.locator('button')).toBeVisible(); // Outside test
};

// ✅ Good
test('button is visible', async ({ page }) => {
  await expect(page.locator('button')).toBeVisible();
});
```

### No Callbacks in Async Tests
```typescript
// ❌ Bad
test('async test', (done) => {
  fetchData().then(() => done());
});

// ✅ Good
test('async test', async () => {
  await fetchData();
});
```

### Don't Nest describe() Too Deeply
```typescript
// ❌ Bad
test.describe('Level 1', () => {
  test.describe('Level 2', () => {
    test.describe('Level 3', () => {
      test.describe('Level 4', () => { }); // Too deep
    });
  });
});

// ✅ Good - keep nesting shallow
test.describe('Feature', () => {
  test.describe('Scenario', () => {
    test('case', async () => { });
  });
});
```

### No Duplicate Hooks
```typescript
// ❌ Bad
test.describe('Suite', () => {
  test.beforeEach(async () => { });
  test.beforeEach(async () => { }); // Duplicate
});

// ✅ Good
test.describe('Suite', () => {
  test.beforeEach(async () => {
    // All setup in one hook
  });
});
```

## Playwright Patterns

### Page Object Model
```typescript
// tests/pages/chat.page.ts
export class ChatPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async sendMessage(text: string) {
    await this.page.fill('[data-testid="chat-input"]', text);
    await this.page.click('[data-testid="send-button"]');
  }

  async getMessages() {
    return this.page.locator('[data-testid="message"]').all();
  }
}

// tests/chat.spec.ts
test('send message', async ({ page }) => {
  const chatPage = new ChatPage(page);
  await chatPage.goto();
  await chatPage.sendMessage('Hello');
});
```

### Authentication Fixture
```typescript
// tests/fixtures.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('[type="submit"]');
    await page.waitForURL('/');
    await use(page);
  },
});
```

### Mock API Responses
```typescript
test('handles API error', async ({ page }) => {
  await page.route('/api/chat', (route) => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Server error' }),
    });
  });

  await page.goto('/');
  await expect(page.locator('[data-testid="error"]')).toBeVisible();
});
```

### Wait for Network
```typescript
test('loads data', async ({ page }) => {
  const responsePromise = page.waitForResponse('/api/chats');
  await page.goto('/');
  await responsePromise;
  await expect(page.locator('[data-testid="chat-list"]')).toBeVisible();
});
```

## Project Test Environment

### Environment Detection
```typescript
// lib/constants.ts
export const isTestEnvironment = process.env.PLAYWRIGHT === 'True';

// Usage in providers
export const myProvider = isTestEnvironment
  ? mockProvider
  : realProvider;
```

### Mock Models for Testing
```typescript
// lib/ai/models.mock.ts
import { MockLanguageModelV1 } from 'ai/test';

export const chatModel = new MockLanguageModelV1({
  doGenerate: async () => ({
    text: 'Mock response',
    finishReason: 'stop',
    usage: { promptTokens: 10, completionTokens: 20 },
  }),
});
```
