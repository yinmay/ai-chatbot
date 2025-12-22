import { streamText } from "ai";
import type { Session } from "next-auth";
import { getLanguageModel } from "@/lib/ai/providers";
import type { ChatMessage } from "@/lib/types";

/**
 * System prompt for resume optimization
 */
const RESUME_OPT_PROMPT = `你是一位互联网大厂的资深程序员和技术面试官，专注于帮助求职者优化技术简历。

你的专业领域：
- 前端技术栈：HTML、CSS、JavaScript、TypeScript、React、Vue、Node.js、微信小程序等
- 简历优化：帮助求职者优化技术简历，突出项目经验和技术亮点
- 项目经历描述：指导如何用 STAR 法则（Situation、Task、Action、Result）描述项目经验
- 技术技能展示：帮助求职者合理组织和呈现技术栈

优化原则：
1. 突出技术亮点和核心贡献
2. 使用量化数据展示成果（如性能提升、用户增长等）
3. 强调解决的技术难点和创新点
4. 保持简洁专业，避免冗余信息
5. 针对目标岗位调整技术栈的呈现顺序

沟通风格：
- 专业且友好，像一位经验丰富的前辈
- 提供具体可操作的建议
- 给出优化前后的对比示例
- 解释为什么这样优化更好

When asked to write, create, or help with something, just do it directly. Don't ask clarifying questions unless absolutely necessary - make reasonable assumptions and proceed with the task.`;

/**
 * Check if messages contain resume content
 */
function hasResumeContent(messages: ChatMessage[]): boolean {
  const userMessages = messages.filter((m) => m.role === "user");

  for (const message of userMessages) {
    const text = message.parts
      .filter((part) => part.type === "text")
      .map((part) => ("text" in part ? part.text : ""))
      .join(" ");

    // Simple heuristic: if message is longer than 50 characters, consider it as resume content
    if (text.length > 50) {
      return true;
    }
  }

  return false;
}

/**
 * Resume optimization AI agent
 *
 * This agent helps users optimize their technical resumes.
 * - If no resume content detected, prompts user to provide resume text
 * - If resume content exists, provides professional optimization suggestions
 */
export async function resumeOptimizationAgent(
  messages: ChatMessage[],
  selectedChatModel: string,
  session: Session
) {
  const hasResume = hasResumeContent(messages);

  // If no resume content, prompt user to provide it
  if (!hasResume) {
    return streamText({
      model: getLanguageModel(selectedChatModel) as any,
      system: RESUME_OPT_PROMPT,
      messages: [
        {
          role: "user",
          content: "我想优化简历",
        },
        {
          role: "assistant",
          content:
            "你好！我是专业的简历优化顾问，很高兴帮你优化技术简历。\n\n为了给你提供最有针对性的建议，请把你的简历内容发给我。你可以直接粘贴简历文本，我会帮你：\n\n1. 优化项目经历的描述方式\n2. 突出技术亮点和核心贡献\n3. 用量化数据展示你的成果\n4. 调整技术栈的呈现方式\n5. 提供具体的优化建议\n\n请发送你的简历内容吧！",
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

  // If has resume content, provide optimization
  return streamText({
    model: getLanguageModel(selectedChatModel) as any,
    system: RESUME_OPT_PROMPT,
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.parts
        .filter((part) => part.type === "text")
        .map((part) => ("text" in part ? part.text : ""))
        .join(" "),
    })),
  });
}
