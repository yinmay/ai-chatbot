import { createUIMessageStream } from "ai";
import type { Session } from "next-auth";
import type { RequestHints } from "@/lib/ai/prompts";
import { updateChatTitleById } from "@/lib/db/queries";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { executeStreamText, handleFinishedMessages } from "./common";

// Re-export user intent classification (legacy)
export {
  classifyUserIntent,
  type UserIntent,
  userIntentSchema,
} from "./classify";

// Import for internal use
import { classifyUserIntent } from "./classify";

export type { AgentStateType, IntentType } from "./langgraph";
// Re-export LangGraph agent
export {
  AgentState,
  agentGraph,
  createLangGraphStream,
  getGraphVisualization,
  INTENT_TYPES,
} from "./langgraph";
// Re-export mock interview agent
export { mockInterviewAgent } from "./mock-interview";
// Re-export resume optimization agent
export { resumeOptimizationAgent } from "./resume-opt";

export type CreateChatStreamOptions = {
  chatId: string;
  selectedChatModel: string;
  requestHints: RequestHints;
  uiMessages: ChatMessage[];
  session: Session;
  isToolApprovalFlow: boolean;
  titlePromise?: Promise<string> | null;
};

// LangGraph stream
import { createLangGraphStream } from "./langgraph";
import { executeMockInterviewStream } from "./mock-interview";
// Import execute functions
import { executeResumeOptStream } from "./resume-opt";

// LangGraph is opt-in (set USE_LANGGRAPH=true to enable)
// Default to legacy routing until LangGraph streaming is fully implemented
const USE_LANGGRAPH = process.env.USE_LANGGRAPH === "true";

/**
 * Creates an AI chat stream with message handling
 *
 * By default uses LangGraph-based agent routing.
 * Set USE_LANGGRAPH=false to use legacy if/else routing.
 *
 * LangGraph Architecture:
 * - StateGraph with classify -> route -> agent nodes
 * - Conditional edges based on user intent
 * - Supports resume_opt, mock_interview, and general chat
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
  // Use LangGraph-based routing by default
  if (USE_LANGGRAPH) {
    console.log("[Agent] Using LangGraph-based routing");
    return createLangGraphStream({
      chatId,
      selectedChatModel,
      requestHints,
      uiMessages,
      session,
      isToolApprovalFlow,
      titlePromise,
    });
  }

  // Legacy routing (fallback)
  console.log("[Agent] Using legacy if/else routing");

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
      const userIntent = await classifyUserIntent(
        uiMessages,
        selectedChatModel
      );

      // Route to appropriate agent based on intent
      if (userIntent.intent === "resume_opt") {
        await executeResumeOptStream(uiMessages, selectedChatModel, dataStream);
      } else if (userIntent.intent === "mock_interview") {
        await executeMockInterviewStream(
          uiMessages,
          selectedChatModel,
          dataStream
        );
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
