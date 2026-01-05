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
 * Creates a chat stream using LangGraph agent with streamEvents
 *
 * Uses LangGraph's streamEvents API to get real-time streaming output
 * from the graph nodes.
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
      const messageId = generateUUID();
      let currentIntent: string | null = null;
      let fullResponse = "";

      try {
        // Use streamEvents to get real-time updates from the graph
        const eventStream = agentGraph.streamEvents(
          {
            messages: uiMessages,
            selectedModel: selectedChatModel,
          },
          { version: "v2" }
        );

        for await (const event of eventStream) {
          // Log events for debugging
          if (event.event === "on_chain_end" && event.name === "classify") {
            // Classification completed
            const output = event.data?.output;
            if (output?.intent) {
              currentIntent = output.intent;
              console.log(
                `[LangGraph] Intent: ${output.intent}, Confidence: ${output.confidence}`
              );
            }
          }

          // Capture LLM streaming tokens
          if (event.event === "on_llm_stream") {
            const chunk = event.data?.chunk;
            if (chunk?.content) {
              const content =
                typeof chunk.content === "string"
                  ? chunk.content
                  : chunk.content[0]?.text || "";

              if (content) {
                fullResponse += content;
                dataStream.write({
                  type: "text-delta",
                  textDelta: content,
                });
              }
            }
          }

          // Capture final response from agent nodes
          if (event.event === "on_chain_end") {
            const nodeName = event.name;
            if (["resumeOpt", "mockInterview", "chat"].includes(nodeName)) {
              const output = event.data?.output;
              if (output?.response && !fullResponse) {
                // Only use this if we didn't get streaming tokens
                fullResponse = output.response;
                // Stream the response word by word
                const words = output.response.split(/(\s+)/);
                for (const word of words) {
                  dataStream.write({
                    type: "text-delta",
                    textDelta: word,
                  });
                }
              }
            }
          }
        }

        // If no response was captured, send fallback
        if (!fullResponse) {
          dataStream.write({
            type: "text-delta",
            textDelta:
              "I'm sorry, I couldn't process your request. Please try again.",
          });
        }
      } catch (error) {
        console.error("[LangGraph] Stream error:", error);
        dataStream.write({
          type: "text-delta",
          textDelta: `Sorry, an error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
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
