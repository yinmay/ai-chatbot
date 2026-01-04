import { END, START, StateGraph } from "@langchain/langgraph";
import {
  chatNode,
  classifyNode,
  mockInterviewNode,
  resumeOptNode,
  routeByIntent,
} from "./nodes";
import { AgentState } from "./state";

/**
 * Build the LangGraph Agent Workflow
 *
 * Graph structure:
 *
 *     START
 *       │
 *       ▼
 *   ┌───────────┐
 *   │  classify │  ← Intent classification node
 *   └─────┬─────┘
 *         │
 *    ┌────┴────┬────────────┐
 *    ▼         ▼            ▼
 * resumeOpt  mockInterview  chat   ← Agent nodes
 *    │         │            │
 *    └────┬────┴────────────┘
 *         ▼
 *        END
 *
 * Flow:
 * 1. Classify user intent (resume_opt, mock_interview, or chat)
 * 2. Route to appropriate agent based on intent
 * 3. Generate response and end
 */
const workflow = new StateGraph(AgentState)
  // Add nodes
  .addNode("classify", classifyNode)
  .addNode("resumeOpt", resumeOptNode)
  .addNode("mockInterview", mockInterviewNode)
  .addNode("chat", chatNode)
  // Define edges
  .addEdge(START, "classify")
  .addConditionalEdges("classify", routeByIntent, [
    "resumeOpt",
    "mockInterview",
    "chat",
  ])
  .addEdge("resumeOpt", END)
  .addEdge("mockInterview", END)
  .addEdge("chat", END);

/**
 * Compiled LangGraph Agent
 *
 * Usage:
 * ```typescript
 * const result = await agentGraph.invoke({
 *   messages: chatMessages,
 *   selectedModel: "deepseek/deepseek-chat",
 * });
 * console.log(result.response);
 * ```
 */
export const agentGraph = workflow.compile();

/**
 * Get the graph visualization (Mermaid diagram)
 */
export function getGraphVisualization(): string {
  return `
graph TD
    START([START]) --> classify[Classify Intent]
    classify -->|resume_opt| resumeOpt[Resume Optimization Agent]
    classify -->|mock_interview| mockInterview[Mock Interview Agent]
    classify -->|others| chat[General Chat Agent]
    resumeOpt --> END([END])
    mockInterview --> END
    chat --> END
`;
}

export type { AgentStateType, IntentType } from "./state";
export { AgentState } from "./state";
