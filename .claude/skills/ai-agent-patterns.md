# AI Agent Patterns Skill

## Overview
Patterns for building AI agents in this project using Vercel AI SDK.

## Agent Structure

### Agent File Template
```typescript
// lib/ai/agent/[agent-name].ts
import { streamText } from 'ai';
import type { UIMessage } from 'ai';
import { getLanguageModel } from '../providers';
import { executeStreamText, type StreamTextParams } from './common';

// System prompt as const
const systemPrompt = `You are a specialized agent for...

## Your Role
- ...

## Guidelines
- ...
`;

// Agent function
export const myAgent = async ({
  model,
  chatId,
  messages,
  session,
}: StreamTextParams) => {
  return executeStreamText({
    model,
    chatId,
    messages,
    session,
    system: systemPrompt,
    tools: {
      // Define tools here
    },
  });
};
```

### Intent Classification
```typescript
// lib/ai/agent/classify.ts
import { generateObject } from 'ai';
import { z } from 'zod';

const intentSchema = z.object({
  intent: z.enum(['resume_opt', 'mock_interview', 'related_topics', 'others']),
  confidence: z.number().min(0).max(1),
});

export const classifyUserIntent = async (messages: UIMessage[]) => {
  const { object } = await generateObject({
    model: getLanguageModel('deepseek/deepseek-chat'),
    schema: intentSchema,
    prompt: `Analyze the user's intent from these messages...`,
  });
  return object;
};
```

### Agent Routing
```typescript
// lib/ai/agent/index.ts
export const createChatStream = async ({ model, chatId, messages, session }) => {
  const intent = await classifyUserIntent(messages);

  switch (intent.intent) {
    case 'resume_opt':
      return resumeOptimizationAgent({ model, chatId, messages, session });
    case 'mock_interview':
      return mockInterviewAgent({ model, chatId, messages, session });
    default:
      return executeStreamText({ model, chatId, messages, session, system: defaultPrompt });
  }
};
```

## Tool Definitions

### Tool Template
```typescript
// lib/ai/tools/my-tool.ts
import { tool } from 'ai';
import { z } from 'zod';

export const myTool = tool({
  description: 'Clear description of what this tool does',
  parameters: z.object({
    param1: z.string().describe('What this parameter is for'),
    param2: z.number().optional().describe('Optional parameter'),
  }),
  execute: async ({ param1, param2 }) => {
    // Tool logic here
    return {
      success: true,
      data: result,
    };
  },
});
```

### Tool with Database Access
```typescript
import { tool } from 'ai';
import { z } from 'zod';
import { db } from '@/lib/db';

export const createDocument = ({ session }: { session: Session }) =>
  tool({
    description: 'Create a document artifact',
    parameters: z.object({
      title: z.string(),
      kind: z.enum(['text', 'code', 'image', 'sheet']),
      content: z.string(),
    }),
    execute: async ({ title, kind, content }) => {
      const document = await db.insert(documents).values({
        id: generateId(),
        userId: session.user.id,
        title,
        kind,
        content,
        createdAt: new Date(),
      });
      return { id: document.id };
    },
  });
```

## Streaming Patterns

### Basic Stream
```typescript
import { streamText, createUIMessageStream } from 'ai';

const result = streamText({
  model: getLanguageModel(modelId),
  system: systemPrompt,
  messages,
  tools,
});

return createUIMessageStream({
  stream: result.toDataStream(),
});
```

### Stream with Callbacks
```typescript
const result = streamText({
  model,
  messages,
  onFinish: async ({ response }) => {
    // Save messages to database
    await saveMessages({
      chatId,
      messages: response.messages,
    });
  },
});
```

### Resumable Streams
```typescript
import { createResumableStreamContext } from 'resumable-stream';
import { after } from 'next/server';

// In API route
const streamContext = createResumableStreamContext({
  waitUntil: after,
});

return new Response(
  await streamContext.resumableStream(streamId, () => {
    return createChatStream({ ... });
  })
);
```

## Provider Configuration

### Model Selection
```typescript
// lib/ai/providers.ts
import { gateway } from '@ai-sdk/gateway';
import { createDeepSeek } from '@ai-sdk/deepseek';

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export const getLanguageModel = (modelId: string) => {
  // Handle DeepSeek directly
  if (modelId.startsWith('deepseek/')) {
    return deepseek(modelId.replace('deepseek/', ''));
  }

  // Use AI Gateway for other providers
  return gateway.languageModel(modelId);
};
```

### Reasoning Models
```typescript
import { wrapLanguageModel, extractReasoningMiddleware } from 'ai';

const reasoningModel = wrapLanguageModel({
  model: gateway.languageModel('anthropic/claude-3.7-sonnet'),
  middleware: extractReasoningMiddleware({ tagName: 'thinking' }),
});
```

## System Prompt Best Practices

### Structure
```typescript
const systemPrompt = `## Role
You are [specific role description].

## Capabilities
- Capability 1
- Capability 2

## Guidelines
1. Always do X
2. Never do Y
3. When Z happens, do A

## Output Format
- Use markdown formatting
- Structure responses with headers
- Include examples when helpful

## Tools
You have access to the following tools:
- toolName: description and when to use it
`;
```

### Chinese Language Prompts
```typescript
// For this project's Chinese-language agents
const resumeOptPrompt = `## 角色设定
你是一位资深程序员和简历优化专家。

## 工作流程
1. 分析用户提供的简历内容
2. 使用 evaluateSkills 工具进行评分
3. 提供具体的优化建议

## 评估标准
- ✅ 加分项：量化数据、STAR 方法
- ❌ 减分项：模糊描述、缺乏具体案例
`;
```
