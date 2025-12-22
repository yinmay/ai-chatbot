import { createUIMessageStream } from "ai";
import type { Session } from "next-auth";
import type { RequestHints } from "@/lib/ai/prompts";
import {
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { executeStreamText } from "./common";

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
export function createChatStream({
  chatId,
  selectedChatModel,
  requestHints,
  uiMessages,
  session,
  isToolApprovalFlow,
  titlePromise,
}: CreateChatStreamOptions) {
  const stream = createUIMessageStream({
    // Pass original messages for tool approval continuation
    originalMessages: isToolApprovalFlow ? uiMessages : undefined,
    execute: async ({ writer: dataStream }) => {
      // Handle title generation in parallel
      if (titlePromise) {
        titlePromise.then((title) => {
          updateChatTitleById({ chatId, title });
          dataStream.write({ type: "data-chat-title", data: title });
        });
      }

      // Classify user intent first
      const userIntent = await classifyUserIntent(uiMessages, selectedChatModel);

      let result;

      // Route to appropriate agent based on intent
      if (userIntent.intent === "resume_opt") {
        // Use resume optimization agent
        const { resumeOptimizationAgent } = await import("./resume-opt");
        result = await resumeOptimizationAgent(
          uiMessages,
          selectedChatModel,
          session
        );
      } else if (userIntent.intent === "mock_interview") {
        // Use mock interview agent
        const { mockInterviewAgent } = await import("./mock-interview");
        result = await mockInterviewAgent(
          uiMessages,
          selectedChatModel,
          session
        );
      } else {
        // Use default chat stream for related_topics and others
        result = await executeStreamText({
          selectedChatModel,
          requestHints,
          uiMessages,
          session,
          dataStream,
        });
      }

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

/**
 * Handles saving finished messages to database
 */
async function handleFinishedMessages({
  finishedMessages,
  uiMessages,
  chatId,
  isToolApprovalFlow,
}: {
  finishedMessages: ChatMessage[];
  uiMessages: ChatMessage[];
  chatId: string;
  isToolApprovalFlow: boolean;
}) {
  if (isToolApprovalFlow) {
    // For tool approval, update existing messages (tool state changed) and save new ones
    for (const finishedMsg of finishedMessages) {
      const existingMsg = uiMessages.find((m) => m.id === finishedMsg.id);
      if (existingMsg) {
        // Update existing message with new parts (tool state changed)
        await updateMessage({
          id: finishedMsg.id,
          parts: finishedMsg.parts,
        });
      } else {
        // Save new message
        await saveMessages({
          messages: [
            {
              id: finishedMsg.id,
              role: finishedMsg.role,
              parts: finishedMsg.parts,
              createdAt: new Date(),
              attachments: [],
              chatId,
            },
          ],
        });
      }
    }
  } else if (finishedMessages.length > 0) {
    // Normal flow - save all finished messages
    await saveMessages({
      messages: finishedMessages.map((currentMessage) => ({
        id: currentMessage.id,
        role: currentMessage.role,
        parts: currentMessage.parts,
        createdAt: new Date(),
        attachments: [],
        chatId,
      })),
    });
  }
}
