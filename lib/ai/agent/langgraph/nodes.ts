import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import type { ChatMessage } from "@/lib/types";
import { processMessagesWithPDF } from "../common";
import type { AgentStateType } from "./state";
import { INTENT_TYPES, type IntentType } from "./state";

/**
 * Get LLM instance for LangChain
 */
function getLLM(model: string) {
  // Map model names to OpenAI-compatible endpoints
  if (model.includes("deepseek")) {
    return new ChatOpenAI({
      modelName: "deepseek-chat",
      configuration: {
        baseURL: "https://api.deepseek.com/v1",
        apiKey: process.env.DEEPSEEK_API_KEY,
      },
      temperature: 0.7,
    });
  }

  // Default to OpenAI
  return new ChatOpenAI({
    modelName: model.includes("gpt") ? model : "gpt-4o-mini",
    temperature: 0.7,
  });
}

/**
 * Intent classification schema
 */
const intentSchema = z.object({
  intent: z.enum(["resume_opt", "mock_interview", "related_topics", "others"]),
  confidence: z.number().min(0).max(1),
});

/**
 * Classification Node - Classifies user intent
 *
 * This is the first node in the graph that determines
 * which agent should handle the user's request.
 */
export async function classifyNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const { messages, selectedModel } = state;

  // Get the latest user message
  const latestUserMessage = messages
    .filter((m) => m.role === "user")
    .slice(-1)[0];

  if (!latestUserMessage) {
    return {
      intent: INTENT_TYPES.OTHERS,
      confidence: 1,
    };
  }

  // Extract text from message parts
  const userText = latestUserMessage.parts
    .filter((part) => part.type === "text")
    .map((part) => ("text" in part ? part.text : ""))
    .join(" ");

  if (!userText.trim()) {
    return {
      intent: INTENT_TYPES.OTHERS,
      confidence: 1,
    };
  }

  // Check for PDF attachments
  const hasPDF = messages.some((msg) =>
    msg.parts.some(
      (part) =>
        part.type === "file" &&
        "mediaType" in part &&
        part.mediaType === "application/pdf"
    )
  );

  // Check for resume content (simple heuristic)
  const hasResumeContent = messages
    .filter((m) => m.role === "user")
    .some((msg) => {
      const text = msg.parts
        .filter((part) => part.type === "text")
        .map((part) => ("text" in part ? part.text : ""))
        .join(" ");
      return text.length > 50;
    });

  try {
    const llm = getLLM(selectedModel);

    const systemPrompt = `You are an intent classifier for a career assistant AI.

Classify the user's message into one of these categories:
- resume_opt: User wants to optimize resume, modify resume, ask how to write resume, describe project experience
- mock_interview: User wants to do mock interview, interview practice, be asked questions
- related_topics: Programming, technical interview, or resume preparation related questions (but not the above two)
- others: Unrelated topics

You MUST respond with ONLY a valid JSON object, no other text:
{"intent": "category_name", "confidence": 0.95}`;

    const result = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userText),
    ]);

    // Parse the response as JSON
    const content =
      typeof result.content === "string"
        ? result.content
        : JSON.stringify(result.content);

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*"intent"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        intent: parsed.intent as IntentType,
        confidence: parsed.confidence ?? 0.8,
        hasPDF,
        hasResumeContent,
      };
    }

    // Fallback if JSON parsing fails
    return {
      intent: INTENT_TYPES.RELATED_TOPICS,
      confidence: 0.5,
      hasPDF,
      hasResumeContent,
    };
  } catch (error) {
    console.error("Classification failed:", error);
    return {
      intent: INTENT_TYPES.RELATED_TOPICS,
      confidence: 0.5,
      hasPDF,
      hasResumeContent,
    };
  }
}

/**
 * Resume Optimization Node
 *
 * Handles resume optimization requests with detailed feedback
 * and improvement suggestions.
 */
export async function resumeOptNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const { messages, selectedModel, hasPDF, hasResumeContent } = state;

  console.log(
    "[resumeOptNode] Starting, hasResumeContent:",
    hasResumeContent,
    "hasPDF:",
    hasPDF
  );

  const systemPrompt = `You are an expert resume optimization consultant for software developers, especially frontend developers.

Your expertise:
- Frontend tech stack: HTML, CSS, JavaScript, TypeScript, React, Vue, Node.js
- Resume optimization: Help optimize technical resumes, highlight project experience
- Project description: Guide using STAR method (Situation, Task, Action, Result)
- Skills presentation: Help organize and present tech stack

Key points for review:
1. Education background (985/211 universities, CS-related major)
2. Technical skills (depth and breadth matching experience)
3. Work experience (big company experience, value and growth)
4. Project experience (scale, role, highlights, quantified results)

Response format:
### Overall Score
Give a score (0-100) with reasoning

### Optimization Suggestions
1. Education Background - [suggestions]
2. Technical Skills - [suggestions]
3. Work Experience - [suggestions]
4. Project Experience - [suggestions]

### Optimization Examples
Provide before/after examples for 1-2 sections that need most improvement`;

  try {
    // Process PDF if present
    const processedMessages = await processMessagesWithPDF(messages);

    const llm = getLLM(hasPDF ? "deepseek/deepseek-reasoner" : selectedModel);

    // Convert messages to LangChain format
    const langchainMessages = [
      new SystemMessage(systemPrompt),
      ...processedMessages.map((msg) => {
        const content = msg.parts
          .filter((part) => part.type === "text")
          .map((part) => ("text" in part ? part.text : ""))
          .join(" ");

        return msg.role === "user"
          ? new HumanMessage(content)
          : new AIMessage(content);
      }),
    ];

    // If no resume content, prompt user
    if (!hasResumeContent) {
      return {
        response: `Hello! I'm a professional resume optimization consultant, happy to help you optimize your technical resume.

To provide targeted suggestions, please share your resume content. You can paste the resume text or upload a PDF file. I will help you:

1. Optimize project experience descriptions
2. Highlight technical highlights and core contributions
3. Use quantified data to showcase your achievements
4. Adjust tech stack presentation
5. Provide specific optimization suggestions

Please send your resume content!`,
      };
    }

    console.log("[resumeOptNode] Calling LLM...");
    const result = await llm.invoke(langchainMessages);
    console.log("[resumeOptNode] LLM response received");

    const responseContent =
      typeof result.content === "string"
        ? result.content
        : JSON.stringify(result.content);

    console.log("[resumeOptNode] Response length:", responseContent.length);
    return {
      response: responseContent,
    };
  } catch (error) {
    console.error("[resumeOptNode] Error:", error);
    return {
      response:
        "Sorry, an error occurred while processing your resume. Please try again.",
    };
  }
}

/**
 * Mock Interview Node
 *
 * Simulates a technical interview with progressive questions
 * and feedback.
 */
export async function mockInterviewNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const { messages, selectedModel } = state;

  const systemPrompt = `You are a senior frontend technical interviewer from a top tech company.

Your expertise:
- Frontend: HTML, CSS, JavaScript, TypeScript, React, Vue, Node.js
- Engineering and performance optimization
- System design and architecture
- Algorithms and data structures

Interview flow (8-10 questions):
1. Self-introduction and motivation (1-2 questions)
2. Programming fundamentals (1 question) - JavaScript basics
3. Algorithm question (1 question) - Medium difficulty
4. System design (1 question) - Technical solution design
5. Project experience deep dive (3-4 questions)
6. Reverse questions (when reaching 8 questions)

Principles:
- Give brief feedback (1-2 sentences) after each answer
- Ask one question at a time
- If user doesn't know, give hints but don't give answer directly
- Move to next question if still stuck

At the end, provide comprehensive evaluation:
1. Overall performance
2. Strengths
3. Areas for improvement
4. Suggestions`;

  try {
    const llm = getLLM(selectedModel);

    const userMessages = messages.filter((m) => m.role === "user");
    const isFirstMessage = userMessages.length <= 1;

    let langchainMessages;

    if (isFirstMessage) {
      langchainMessages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(
          "I want to do a frontend technical interview simulation"
        ),
        new AIMessage(`Hello! Welcome to today's frontend technical interview. I'm your interviewer, nice to meet you.

Before we start, I'd like to learn about you:

1. What's your main tech stack? (React, Vue, etc.)
2. How many years of frontend development experience do you have?
3. What level position are you targeting? (Junior/Mid/Senior)

Once I know this, I'll prepare targeted interview questions. Please relax and treat this as a real interview experience.`),
        new HumanMessage(
          userMessages[userMessages.length - 1]?.parts
            .filter((part) => part.type === "text")
            .map((part) => ("text" in part ? part.text : ""))
            .join(" ") || ""
        ),
      ];
    } else {
      langchainMessages = [
        new SystemMessage(systemPrompt),
        ...messages.map((msg) => {
          const content = msg.parts
            .filter((part) => part.type === "text")
            .map((part) => ("text" in part ? part.text : ""))
            .join(" ");

          return msg.role === "user"
            ? new HumanMessage(content)
            : new AIMessage(content);
        }),
      ];
    }

    const result = await llm.invoke(langchainMessages);
    const responseContent =
      typeof result.content === "string"
        ? result.content
        : JSON.stringify(result.content);

    return {
      response: responseContent,
    };
  } catch (error) {
    console.error("Mock interview failed:", error);
    return {
      response:
        "Sorry, an error occurred during the interview. Please try again.",
    };
  }
}

/**
 * General Chat Node
 *
 * Handles general programming and career-related questions.
 */
export async function chatNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const { messages, selectedModel } = state;

  const systemPrompt = `You are a helpful AI assistant for software developers, especially frontend developers.

You can help with:
- Programming questions and debugging
- Best practices and code review
- Career advice and interview preparation
- Technical concepts explanation

Be concise, helpful, and provide code examples when appropriate.`;

  try {
    const llm = getLLM(selectedModel);

    const langchainMessages = [
      new SystemMessage(systemPrompt),
      ...messages.map((msg) => {
        const content = msg.parts
          .filter((part) => part.type === "text")
          .map((part) => ("text" in part ? part.text : ""))
          .join(" ");

        return msg.role === "user"
          ? new HumanMessage(content)
          : new AIMessage(content);
      }),
    ];

    const result = await llm.invoke(langchainMessages);
    const responseContent =
      typeof result.content === "string"
        ? result.content
        : JSON.stringify(result.content);

    return {
      response: responseContent,
    };
  } catch (error) {
    console.error("Chat failed:", error);
    return {
      response: "Sorry, an error occurred. Please try again.",
    };
  }
}

/**
 * Route function for conditional edges
 *
 * Determines which node to route to based on classified intent.
 */
export function routeByIntent(state: AgentStateType): string {
  const { intent } = state;

  switch (intent) {
    case INTENT_TYPES.RESUME_OPT:
      return "resumeOpt";
    case INTENT_TYPES.MOCK_INTERVIEW:
      return "mockInterview";
    case INTENT_TYPES.RELATED_TOPICS:
    case INTENT_TYPES.OTHERS:
    default:
      return "chat";
  }
}
