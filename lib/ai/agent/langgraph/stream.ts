import { createUIMessageStream, smoothStream, streamText } from "ai";
import type { Session } from "next-auth";
import type { RequestHints } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
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

        const responseText =
          result.response && typeof result.response === "string"
            ? result.response
            : "I'm sorry, I couldn't process your request. Please try again.";

        // Use streamText with the response as a prompt to create proper stream
        const streamResult = streamText({
          model: getLanguageModel(selectedChatModel),
          prompt: `Respond with exactly this text, do not add anything:\n\n${responseText}`,
          experimental_transform: smoothStream({ chunking: "word" }),
        });

        // Merge the stream into dataStream
        dataStream.merge(
          streamResult.toUIMessageStream({
            sendReasoning: true,
          })
        );

        // Wait for stream to complete
        await streamResult.consumeStream();
      } catch (error) {
        console.error("[LangGraph] Error:", error);

        // Create error stream
        const errorResult = streamText({
          model: getLanguageModel(selectedChatModel),
          prompt: `Respond with: Sorry, an error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
        });

        dataStream.merge(errorResult.toUIMessageStream({}));
        await errorResult.consumeStream();
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
