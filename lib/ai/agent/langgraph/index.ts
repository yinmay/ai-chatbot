/**
 * LangGraph-based AI Agent Module
 *
 * This module provides a state machine-based agent architecture using LangGraph.
 * It replaces the previous if/else routing with a proper graph-based workflow.
 *
 * Architecture:
 * - State: Defined in state.ts with Annotation API
 * - Nodes: Intent classification and agent nodes in nodes.ts
 * - Graph: Workflow definition with conditional routing in graph.ts
 *
 * Usage:
 * ```typescript
 * import { agentGraph } from "@/lib/ai/agent/langgraph";
 *
 * const result = await agentGraph.invoke({
 *   messages: chatMessages,
 *   selectedModel: "deepseek/deepseek-chat",
 * });
 * ```
 */

export { agentGraph, fullAgentGraph, getGraphVisualization } from "./graph";
export {
  chatNode,
  classifyNode,
  mockInterviewNode,
  resumeOptNode,
  routeByIntent,
} from "./nodes";
export type { AgentStateType, IntentType } from "./state";
export { AgentState, INTENT_TYPES } from "./state";
export type { CreateLangGraphStreamOptions } from "./stream";
export { createLangGraphStream } from "./stream";
