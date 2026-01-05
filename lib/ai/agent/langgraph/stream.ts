import { createUIMessageStream } from "ai";
import type { Session } from "next-auth";
import type { RequestHints } from "@/lib/ai/prompts";
import { updateChatTitleById } from "@/lib/db/queries";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { handleFinishedMessages } from "../common";
import { agentGraph } from "./graph";

export type CreateLangGraphStreamOptions = {
  chatId: string;
  selectedChatModel: string;
  requestHints: RequestHints;
  uiMessages: ChatMessage[];
  session: Session;
  isToolApprovalFlow: boolean;
  titlePromise?: Promise<string> | null;
};

/**
 * Creates a chat stream using LangGraph agent
 *
 * This function integrates the LangGraph state machine with
 * Vercel AI SDK's streaming response format.
 *
 * Flow:
 * 1. Invoke LangGraph with messages and model
 * 2. Get classified intent and routed response
 * 3. Stream response back to client
 */
export function createLangGraphStream({
  chatId,
  selectedChatModel,
  requestHints,
  uiMessages,
  session,
  isToolApprovalFlow,
  titlePromise,
}: CreateLangGraphStreamOptions) {
  // Handle title generation in parallel
  if (titlePromise) {
    titlePromise.then((title) => {
      updateChatTitleById({ chatId, title });
    });
  }

  const stream = createUIMessageStream({
    originalMessages: isToolApprovalFlow ? uiMessages : undefined,
    execute: async ({ writer: dataStream }) => {
      try {
        // Invoke LangGraph agent
        const result = await agentGraph.invoke({
          messages: uiMessages,
          selectedModel: selectedChatModel,
        });

        // Log the routing decision for debugging
        console.log(
          `[LangGraph] Intent: ${result.intent}, Confidence: ${result.confidence}`
        );
        console.log(`[LangGraph] Response exists: ${!!result.response}, Type: ${typeof result.response}`);

        const messageId = generateUUID();

        // Stream the response as text-delta (simulating streaming)
        if (result.response && typeof result.response === "string") {
          // Split response into chunks and stream them
          const chunks = result.response.split(/(?<=\s)/);
          for (const chunk of chunks) {
            dataStream.write({
              type: "text-delta",
              id: messageId,
              delta: chunk,
            });
          }
        } else {
          // Fallback message if no response
          dataStream.write({
            type: "text-delta",
            id: messageId,
            delta:
              "I'm sorry, I couldn't process your request. Please try again.",
          });
        }

        // If there's reasoning (from deep thinking models), include it
        if (result.reasoning && typeof result.reasoning === "string") {
          const reasoningId = generateUUID();
          dataStream.write({
            type: "reasoning-delta",
            id: reasoningId,
            delta: result.reasoning,
          });
        }
      } catch (error) {
        console.error("[LangGraph] Error:", error);
        const errorId = generateUUID();
        dataStream.write({
          type: "text-delta",
          id: errorId,
          delta: `Sorry, an error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
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
