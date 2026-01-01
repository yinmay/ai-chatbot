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

// Import execute functions
import { executeResumeOptStream } from "./resume-opt";
import { executeMockInterviewStream } from "./mock-interview";

/**
 * Creates an AI chat stream with message handling
 * Returns a stream immediately and performs classification inside the stream
 */
export function createChatStream({
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

  // Return stream immediately - classification happens inside execute
  const stream = createUIMessageStream({
    // Pass original messages for tool approval continuation
    originalMessages: isToolApprovalFlow ? uiMessages : undefined,
    execute: async ({ writer: dataStream }) => {
      // Classify user intent inside the stream execution
      const userIntent = await classifyUserIntent(uiMessages, selectedChatModel);

      // Route to appropriate agent based on intent
      if (userIntent.intent === "resume_opt") {
        await executeResumeOptStream(uiMessages, selectedChatModel, dataStream);
      } else if (userIntent.intent === "mock_interview") {
        await executeMockInterviewStream(uiMessages, selectedChatModel, dataStream);
      } else {
        // Use default chat stream for related_topics and others
        const result = await executeStreamText({
          selectedChatModel,
          requestHints,
          uiMessages,
          session,
          dataStream,
        });

        // Use merge to stream the result - it handles stream consumption
        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        );

        // Wait for the stream to complete
        await result.consumeStream();
      }
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
