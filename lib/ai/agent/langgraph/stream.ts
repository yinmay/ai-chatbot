import { smoothStream, streamText } from "ai";
import { createUIMessageStream } from "ai";
import type { Session } from "next-auth";
import { getLanguageModel } from "@/lib/ai/providers";
import type { RequestHints } from "@/lib/ai/prompts";
import { updateChatTitleById } from "@/lib/db/queries";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { handleFinishedMessages, processMessagesWithPDF } from "../common";
import { agentGraph } from "./graph";
import { INTENT_TYPES, type IntentType } from "./state";

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
 * System prompts for different agent types
 */
const RESUME_OPT_PROMPT = `You are an expert resume optimization consultant for software developers.
Your expertise includes frontend tech stacks (React, Vue, TypeScript, Node.js) and resume optimization.
Help users optimize their resumes using the STAR method and quantified achievements.`;

const MOCK_INTERVIEW_PROMPT = `You are a senior frontend technical interviewer from a top tech company.
Conduct mock interviews covering JavaScript basics, algorithms, system design, and project experience.
Ask one question at a time and provide brief feedback after each answer.`;

const CHAT_PROMPT = `You are a helpful AI assistant for software developers.
Help with programming questions, debugging, best practices, and career advice.
Be concise and provide code examples when appropriate.`;

/**
 * Creates a chat stream using LangGraph agent for routing
 *
 * This uses a hybrid approach:
 * - LangGraph: Intent classification and routing
 * - Vercel AI SDK: Actual streaming responses
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
        // Step 1: Use LangGraph for intent classification only
        console.log("[LangGraph] Classifying intent...");

        const graphResult = await agentGraph.invoke({
          messages: uiMessages,
          selectedModel: selectedChatModel,
        });

        const intent = graphResult.intent as IntentType;
        const confidence = graphResult.confidence as number;
        console.log(`[LangGraph] Intent: ${intent}, Confidence: ${confidence}`);

        // Step 2: Process messages (handle PDFs)
        const processedMessages = await processMessagesWithPDF(uiMessages);

        // Step 3: Select system prompt based on intent
        let systemPrompt: string;
        let modelToUse = selectedChatModel;

        switch (intent) {
          case INTENT_TYPES.RESUME_OPT:
            systemPrompt = RESUME_OPT_PROMPT;
            // Use deep thinking model for PDF resumes
            if (graphResult.hasPDF) {
              modelToUse = "deepseek/deepseek-reasoner";
            }
            break;
          case INTENT_TYPES.MOCK_INTERVIEW:
            systemPrompt = MOCK_INTERVIEW_PROMPT;
            break;
          case INTENT_TYPES.RELATED_TOPICS:
          case INTENT_TYPES.OTHERS:
          default:
            systemPrompt = CHAT_PROMPT;
            break;
        }

        // Step 4: Stream response using Vercel AI SDK
        const result = streamText({
          model: getLanguageModel(modelToUse) as ReturnType<
            typeof getLanguageModel
          >,
          system: systemPrompt,
          messages: processedMessages.map((msg) => ({
            role: msg.role,
            content: msg.parts
              .filter((part) => part.type === "text")
              .map((part) => ("text" in part ? part.text : ""))
              .join(" "),
          })),
          experimental_transform: smoothStream({ chunking: "word" }),
        });

        // Step 5: Merge the stream (correct Vercel AI SDK pattern)
        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        );

        // Wait for stream to complete
        await result.consumeStream();
      } catch (error) {
        console.error("[LangGraph] Error:", error);
        // Create a simple error stream
        const errorResult = streamText({
          model: getLanguageModel(selectedChatModel) as ReturnType<
            typeof getLanguageModel
          >,
          messages: [
            {
              role: "user",
              content: "Say: Sorry, an error occurred. Please try again.",
            },
          ],
        });
        dataStream.merge(errorResult.toUIMessageStream());
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
