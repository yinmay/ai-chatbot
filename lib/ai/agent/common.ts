import {
  convertToModelMessages,
  smoothStream,
  stepCountIs,
  streamText,
  type UIMessageStreamWriter,
} from "ai";
import type { Session } from "next-auth";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isProductionEnvironment } from "@/lib/constants";
import { saveMessages, updateMessage } from "@/lib/db/queries";
import { extractPDFFromUrl, formatPDFForAI } from "@/lib/pdf/extract";
import type { ChatMessage } from "@/lib/types";

/**
 * Process messages to extract PDF content and convert to text
 * This allows AI to understand PDF content even if the model doesn't support PDF natively
 */
export async function processMessagesWithPDF(
  messages: ChatMessage[]
): Promise<ChatMessage[]> {
  const processedMessages: ChatMessage[] = [];

  for (const message of messages) {
    const newParts: ChatMessage["parts"] = [];

    for (const part of message.parts) {
      if (
        part.type === "file" &&
        "mediaType" in part &&
        part.mediaType === "application/pdf"
      ) {
        // Extract PDF content and convert to text part
        try {
          const pdfContent = await extractPDFFromUrl(part.url);
          const filename =
            "filename" in part && part.filename
              ? part.filename
              : "document.pdf";
          const formattedText = formatPDFForAI(pdfContent, filename);

          newParts.push({
            type: "text",
            text: formattedText,
          });
        } catch (error) {
          console.error("Failed to extract PDF content:", error);
          // If extraction fails, add a note about the PDF
          const filename =
            "filename" in part && part.filename
              ? part.filename
              : "document.pdf";
          newParts.push({
            type: "text",
            text: `[PDF Document: ${filename}] (Unable to extract content)`,
          });
        }
      } else {
        // Keep non-PDF parts as-is
        newParts.push(part);
      }
    }

    processedMessages.push({
      ...message,
      parts: newParts,
    });
  }

  return processedMessages;
}

/**
 * Executes the streamText with proper configuration
 */
export async function executeStreamText({
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
  dataStream: UIMessageStreamWriter<ChatMessage>;
}) {
  const isReasoningModel =
    selectedChatModel.includes("reasoning") ||
    selectedChatModel.includes("thinking");

  // Process PDF attachments before converting to model messages
  const processedMessages = await processMessagesWithPDF(uiMessages);

  return streamText({
    model: getLanguageModel(selectedChatModel),
    system: systemPrompt({ selectedChatModel, requestHints }),
    messages: await convertToModelMessages(processedMessages),
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
export async function handleFinishedMessages({
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
