import { streamText } from "ai";
import type { Session } from "next-auth";
import { getLanguageModel } from "@/lib/ai/providers";
import type { ChatMessage } from "@/lib/types";

/**
 * System prompt for mock interview
 */
const MOCK_INTERVIEW_PROMPT = `你是一位互联网大厂的资深技术面试官，专注于前端技术面试。

你的角色：
- 模拟真实的技术面试场景
- 提出有针对性的技术问题
- 评估候选人的技术能力和思维方式
- 给出专业的面试建议和反馈

面试领域：
- 前端基础：HTML、CSS、JavaScript、TypeScript
- 框架应用：React、Vue、Node.js
- 工程化：Webpack、Vite、构建优化
- 性能优化：渲染优化、网络优化、代码优化
- 计算机基础：数据结构、算法、网络、浏览器原理

面试风格：
1. 从浅入深，循序渐进地提问
2. 根据候选人回答追问细节
3. 考察实际项目经验和问题解决能力
4. 保持专业和严谨，但不失友好
5. 在合适的时候给予鼓励和建设性反馈

面试流程：
1. 开场介绍，让候选人放轻松
2. 从简单问题开始，了解基础能力
3. 根据回答深入追问，考察深度
4. 结束时给予综合评价和改进建议

评估标准：
- 技术深度和广度
- 问题分析和解决能力
- 代码质量和工程思维
- 沟通表达能力
- 学习能力和潜力

When asked to write, create, or help with something, just do it directly. Don't ask clarifying questions unless absolutely necessary - make reasonable assumptions and proceed with the task.`;

/**
 * Mock interview AI agent
 *
 * This agent simulates a technical interview for programmers.
 * - Acts as a professional technical interviewer
 * - Asks progressive technical questions
 * - Provides feedback and evaluation
 */
export async function mockInterviewAgent(
  messages: ChatMessage[],
  selectedChatModel: string,
  session: Session
) {
  const userMessages = messages.filter((m) => m.role === "user");
  const isFirstMessage = userMessages.length <= 1;

  // If first message, start the interview with a greeting
  if (isFirstMessage) {
    return streamText({
      model: getLanguageModel(selectedChatModel) as any,
      system: MOCK_INTERVIEW_PROMPT,
      messages: [
        {
          role: "user",
          content: "我想进行前端技术面试模拟",
        },
        {
          role: "assistant",
          content:
            "你好！欢迎参加今天的前端技术面试。我是你的面试官，很高兴见到你。\n\n在开始之前，我想先了解一下你的情况：\n\n1. 你目前的技术栈主要是什么？（如 React、Vue 等）\n2. 你有多久的前端开发经验？\n3. 你期望面试什么级别的岗位？（初级/中级/高级）\n\n了解这些信息后，我会针对性地准备面试问题。请放轻松，把这当作一次真实的面试体验。😊",
        },
        {
          role: "user",
          content: messages[messages.length - 1]?.parts
            .filter((part) => part.type === "text")
            .map((part) => ("text" in part ? part.text : ""))
            .join(" ") || "",
        },
      ],
    });
  }

  // Continue the interview conversation
  return streamText({
    model: getLanguageModel(selectedChatModel) as any,
    system: MOCK_INTERVIEW_PROMPT,
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.parts
        .filter((part) => part.type === "text")
        .map((part) => ("text" in part ? part.text : ""))
        .join(" "),
    })),
  });
}
