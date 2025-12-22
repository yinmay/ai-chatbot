import { streamText } from "ai";
import { z } from "zod";
import { getLanguageModel } from "@/lib/ai/providers";
import type { ChatMessage } from "@/lib/types";

/**
 * User intent classification schema
 */
export const userIntentSchema = z.object({
  intent: z
    .enum(["resume_opt", "mock_interview", "related_topics", "others"])
    .describe(
      "用户意图分类：resume_opt(简历优化), mock_interview(模拟面试), related_topics(编程/面试/简历相关话题), others(其他话题)"
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("分类置信度，0-1之间"),
});

export type UserIntent = z.infer<typeof userIntentSchema>;

/**
 * System prompt for user intent classification
 */
const INTENT_CLASSIFICATION_PROMPT = `你是一个互联网大公司的资深程序员和面试官，尤其擅长前端技术栈，包括 HTML、CSS、JavaScript、TypeScript、React、Vue、Node.js、小程序等技术。

请根据用户输入的内容，判断用户属于哪一种情况？按说明输出 JSON 格式。

分类标准：
- resume_opt：用户想要优化简历、修改简历、询问简历如何写、项目经历如何描述等与简历优化相关的内容
- mock_interview：用户想要进行模拟面试、面试练习、被提问等与模拟面试相关的内容
- related_topics：用户提出的是与编程、技术面试、简历准备相关的问题或讨论（但不是上述两种具体需求）
- others：与编程、面试、简历无关的其他话题

输出格式示例：
{
  "intent": "resume_opt",
  "confidence": 0.95
}`;

/**
 * Classify user intent from messages using AI SDK workflow
 *
 * This is a workflow node that:
 * - Takes messages as input
 * - Uses AI to classify user intent
 * - Returns structured JSON output
 */
export async function classifyUserIntent(
  messages: ChatMessage[],
  selectedChatModel: string
): Promise<UserIntent> {
  // Get the latest user message
  const latestUserMessage = messages
    .filter((m) => m.role === "user")
    .slice(-1)[0];

  if (!latestUserMessage) {
    return { intent: "others" };
  }

  // Extract text from message parts
  const userText = latestUserMessage.parts
    .filter((part) => part.type === "text")
    .map((part) => ("text" in part ? part.text : ""))
    .join(" ");

  if (!userText.trim()) {
    return { intent: "others" };
  }

  try {
    // Use streamText with a tool for structured output
    const result = streamText({
      model: getLanguageModel(selectedChatModel) as any,
      system: INTENT_CLASSIFICATION_PROMPT,
      messages: [
        {
          role: "user",
          content: userText,
        },
      ],
      tools: {
        classifyIntent: {
          description: "分类用户意图并输出结构化的 JSON 数据",
          inputSchema: userIntentSchema,
          execute: async (params) => params,
        },
      },
      toolChoice: {
        type: "tool",
        toolName: "classifyIntent",
      },
    });

    // Get the tool call result
    const response = await result.response;

    // Extract tool calls from the response
    for (const message of response.messages) {
      if (message.role === "assistant" && message.content) {
        for (const content of message.content) {
          if (
            typeof content !== "string" &&
            "type" in content &&
            content.type === "tool-call" &&
            "toolName" in content &&
            content.toolName === "classifyIntent" &&
            "args" in content
          ) {
            return content.args as UserIntent;
          }
        }
      }
    }

    return { intent: "others" };
  } catch (error) {
    console.error("Failed to classify user intent:", error);
    return { intent: "related_topics" }; // Default to related topics on error
  }
}
