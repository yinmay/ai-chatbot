import { Annotation } from "@langchain/langgraph";
import type { ChatMessage } from "@/lib/types";

/**
 * User intent types for routing
 */
export const INTENT_TYPES = {
  RESUME_OPT: "resume_opt",
  MOCK_INTERVIEW: "mock_interview",
  RELATED_TOPICS: "related_topics",
  OTHERS: "others",
} as const;

export type IntentType = (typeof INTENT_TYPES)[keyof typeof INTENT_TYPES];

/**
 * LangGraph State Annotation for the AI Agent
 *
 * This defines the state that flows through the graph:
 * - messages: The conversation history
 * - intent: Classified user intent (resume_opt, mock_interview, etc.)
 * - confidence: Classification confidence score (0-1)
 * - response: The generated response text
 * - selectedModel: The AI model to use
 * - hasPDF: Whether the messages contain PDF attachments
 * - hasResumeContent: Whether resume content is detected
 */
export const AgentState = Annotation.Root({
  // Input
  messages: Annotation<ChatMessage[]>({
    reducer: (current, update) => update ?? current,
    default: () => [],
  }),
  selectedModel: Annotation<string>({
    reducer: (current, update) => update ?? current,
    default: () => "deepseek/deepseek-chat",
  }),

  // Classification results
  intent: Annotation<IntentType | null>({
    reducer: (current, update) => update ?? current,
    default: () => null,
  }),
  confidence: Annotation<number>({
    reducer: (current, update) => update ?? current,
    default: () => 0,
  }),

  // Content detection
  hasPDF: Annotation<boolean>({
    reducer: (current, update) => update ?? current,
    default: () => false,
  }),
  hasResumeContent: Annotation<boolean>({
    reducer: (current, update) => update ?? current,
    default: () => false,
  }),

  // Output
  response: Annotation<string>({
    reducer: (current, update) => update ?? current,
    default: () => "",
  }),
  reasoning: Annotation<string | null>({
    reducer: (current, update) => update ?? current,
    default: () => null,
  }),
});

export type AgentStateType = typeof AgentState.State;
