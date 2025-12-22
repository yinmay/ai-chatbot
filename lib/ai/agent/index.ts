import {
  convertToModelMessages,
  createUIMessageStream,
  smoothStream,
  stepCountIs,
  streamText,
  type UIDataStreamWriter,
} from "ai";
import type { Session } from "next-auth";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isProductionEnvironment } from "@/lib/constants";
import {
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";

// Re-export user intent classification
export { classifyUserIntent, userIntentSchema, type UserIntent } from "./classify";

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

/**
 * Executes the streamText with proper configuration
 */
async function executeStreamText({
  selectedChatModel,
  requestHints,
  uiMessages,
  session,
  dataStream,
}: {
  selectedChatModel: string;
  requestHints: RequestHints;
  uiMessages: ChatMessage[];
  session: Session;
  dataStream: UIDataStreamWriter;
}) {
  const isReasoningModel =
    selectedChatModel.includes("reasoning") ||
    selectedChatModel.includes("thinking");

  return streamText({
    model: getLanguageModel(selectedChatModel),
    system: systemPrompt({ selectedChatModel, requestHints }),
    messages: await convertToModelMessages(uiMessages),
    stopWhen: stepCountIs(5),
    experimental_activeTools: isReasoningModel
      ? []
      : [
          "getWeather",
          "createDocument",
          "updateDocument",
          "requestSuggestions",
        ],
    experimental_transform: isReasoningModel
      ? undefined
      : smoothStream({ chunking: "word" }),
    providerOptions: isReasoningModel
      ? {
          anthropic: {
            thinking: { type: "enabled", budgetTokens: 10_000 },
          },
        }
      : undefined,
    tools: {
      getWeather,
      createDocument: createDocument({ session, dataStream }),
      updateDocument: updateDocument({ session, dataStream }),
      requestSuggestions: requestSuggestions({
        session,
        dataStream,
      }),
    },
    experimental_telemetry: {
      isEnabled: isProductionEnvironment,
      functionId: "stream-text",
    },
  });
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
