import { createUIMessageStream } from "ai";
import type { Session } from "next-auth";
import type { RequestHints } from "@/lib/ai/prompts";
import { updateChatTitleById } from "@/lib/db/queries";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { executeStreamText, handleFinishedMessages } from "./common";

// Re-export user intent classification
export { classifyUserIntent, userIntentSchema, type UserIntent } from "./classify";
// Import for internal use
import { classifyUserIntent } from "./classify";

// Re-export resume optimization agent
export { resumeOptimizationAgent } from "./resume-opt";

// Re-export mock interview agent
export { mockInterviewAgent } from "./mock-interview";

export type CreateChatStreamOptions = {
  chatId: string;
  selectedChatModel: string;
  requestHints: RequestHints;
  uiMessages: ChatMessage[];
  session: Session;
  isToolApprovalFlow: boolean;
  titlePromise?: Promise<string> | null;
};

/**
 * Creates an AI chat stream with message handling
 */
export async function createChatStream({
  chatId,
  selectedChatModel,
  requestHints,
  uiMessages,
  session,
  isToolApprovalFlow,
  titlePromise,
}: CreateChatStreamOptions) {
  // Handle title generation in parallel
  if (titlePromise) {
    titlePromise.then((title) => {
      updateChatTitleById({ chatId, title });
    });
  }

  // Classify user intent first
  const userIntent = await classifyUserIntent(uiMessages, selectedChatModel);

  // Route to appropriate agent based on intent
  if (userIntent.intent === "resume_opt") {
    // Use resume optimization agent
    const { resumeOptimizationAgent } = await import("./resume-opt");
    return resumeOptimizationAgent(
      uiMessages,
      selectedChatModel,
      session,
      chatId
    );
  } else if (userIntent.intent === "mock_interview") {
    // Use mock interview agent
    const { mockInterviewAgent } = await import("./mock-interview");
    return mockInterviewAgent(
      uiMessages,
      selectedChatModel,
      session,
      chatId
    );
  }

  // Use default chat stream for related_topics and others
  const stream = createUIMessageStream({
    // Pass original messages for tool approval continuation
    originalMessages: isToolApprovalFlow ? uiMessages : undefined,
    execute: async ({ writer: dataStream }) => {
      const result = await executeStreamText({
        selectedChatModel,
        requestHints,
        uiMessages,
        session,
        dataStream,
      });

      result.consumeStream();

      dataStream.merge(
        result.toUIMessageStream({
          sendReasoning: true,
        })
      );
    },
    generateId: generateUUID,
    onFinish: async ({ messages: finishedMessages }) => {
      await handleFinishedMessages({
        finishedMessages,
        uiMessages,
        chatId,
        isToolApprovalFlow,
      });
    },
    onError: () => {
      return "Oops, an error occurred!";
    },
  });

  return stream;
}
