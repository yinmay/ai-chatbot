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
 * Classification-only Graph (for hybrid approach)
 *
 * Graph structure:
 *     START → classify → END
 *
 * This graph ONLY does intent classification.
 * Actual response generation is handled by Vercel AI SDK in stream.ts.
 */
const classifyWorkflow = new StateGraph(AgentState)
  .addNode("classify", classifyNode)
  .addEdge(START, "classify")
  .addEdge("classify", END);

/**
 * Classification Graph (used by stream.ts)
 *
 * Returns intent and confidence without generating a response.
 * Response streaming is handled by Vercel AI SDK.
 */
export const agentGraph = classifyWorkflow.compile();

/**
 * Full Agent Workflow (for reference/future use)
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
 * Note: This full graph is available for testing but not used in production.
 * Production uses the hybrid approach: LangGraph for classification + Vercel AI SDK for streaming.
 */
const fullWorkflow = new StateGraph(AgentState)
  .addNode("classify", classifyNode)
  .addNode("resumeOpt", resumeOptNode)
  .addNode("mockInterview", mockInterviewNode)
  .addNode("chat", chatNode)
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
 * Full Agent Graph (for testing/future use)
 */
export const fullAgentGraph = fullWorkflow.compile();

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
