import {
  convertToModelMessages,
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
import type { ChatMessage } from "@/lib/types";

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
