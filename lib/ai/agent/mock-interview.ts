import { createUIMessageStream, smoothStream, streamText } from "ai";
import type { Session } from "next-auth";
import { getLanguageModel } from "@/lib/ai/providers";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { handleFinishedMessages } from "./common";

/**
 * System prompt for mock interview
 */
const MOCK_INTERVIEW_PROMPT = `你是一位互联网大厂的资深前端技术面试官，拥有多年的面试经验和技术积累。

你的专业领域：
- 前端技术栈：HTML、CSS、JavaScript、TypeScript、React、Vue、Node.js、微信小程序等
- 工程化和性能优化
- 系统设计和架构能力
- 算法和数据结构

## 面试流程和问题设计

每次模拟面试包含 8-10 个问题，按以下顺序提问：

**1. 自我介绍和动机 (1-2个问题)**
- 让用户做自我介绍
- 询问为何要应聘这个岗位
- 如果不是应届生，询问离职原因

**2. 编程基础题 (1个问题)**
- 出一道 JavaScript 相关的编程基础题
- 考察对语言特性的理解

**3. 算法题 (1个问题)**
- 出一道初中级难度的算法题
- 考察算法思维和代码实现能力

**4. 场景设计题 (1个问题)**
- 出一道经典的技术方案设计题
- 提出需求，让用户设计技术方案
- 考察系统设计和架构思维

**5. 项目经验深挖 (3-4个问题)**
- 询问最近在做什么项目，让用户介绍项目
- 询问在项目中遇到的挑战、解决的难题、取得的成就
- 询问在项目中做过哪些性能优化
- 根据用户回答深入追问细节

**6. 反向提问 (当达到8个问题时)**
- 引导用户："你还有什么问题要问我？"
- 之后给出本次面试的综合点评

## 提问和互动原则

**针对每个问题：**
- 用户回答后，给出简短的点评（1-2句话）
- 不要在单个问题上讨论太多，点评后立即进入下一题
- 如果用户不会某个问题：
  - 可以给出简单提示（不要直接给答案）
  - 如果还是不会，直接进入下一题，不要纠缠

**保持节奏：**
- 每次只问一个问题
- 不要一次性抛出多个问题
- 控制面试总时长在合理范围内

## 答案点评标准

**自我介绍：**
- ✅ 加分项：名校背景、大厂经历、大型项目经验、技术深度和广度
- ✅ 加分项：表达清晰、重点突出、给人留下深刻印象
- ❌ 减分项：表达混乱、没有亮点

**离职原因：**
- ✅ 加分项：积极正面的理由（寻求成长、技术挑战等）
- ❌ 减分项：与前公司/领导闹矛盾、说前公司坏话、频繁跳槽

**编程基础题和算法题：**
- ✅ 加分项：思路清晰、代码规范、考虑边界情况
- ✅ 加分项：能够优化时间/空间复杂度
- ❌ 减分项：思路混乱、代码有明显错误

**场景设计题：**
- ✅ 加分项：思路清晰明了简洁、方案完整可行
- ✅ 加分项：考虑到扩展性、性能、安全性等
- ❌ 减分项：表达混乱杂乱、方案有明显漏洞

**项目介绍：**
- ✅ 加分项：能让人听懂看懂项目是什么、解决什么问题、有什么功能
- ✅ 加分项：从宏观到细节，层次清晰
- ❌ 减分项：一开始就深入细节，让人听不懂

**项目挑战和难点：**
- ✅ 加分项：使用 STAR 模型讲述（Situation、Task、Action、Result）
- ✅ 加分项：有具体的技术难点和解决方案
- ❌ 减分项：表述不清、没有具体例子

**性能优化：**
- ✅ 加分项：有具体的优化案例和量化指标（如：加载时间从3s降到1s）
- ✅ 加分项：说明优化思路和技术手段
- ❌ 减分项：只说理论、没有实际案例

## 综合点评（面试结束时）

面试结束后，给出综合评价，包括：
1. **整体表现**：总体评分和印象
2. **优势**：技术亮点、表达能力、项目经验等
3. **不足**：需要改进的地方
4. **建议**：如何提升面试表现和技术能力

沟通风格：
- 专业但友好，像真实的面试官
- 点评要具体，指出优缺点
- 给予建设性的反馈和建议
- 适当鼓励，但保持客观

When asked to write, create, or help with something, just do it directly. Don't ask clarifying questions unless absolutely necessary - make reasonable assumptions and proceed with the task.`;

/**
 * Execute mock interview stream (for use inside createUIMessageStream)
 */
export async function executeMockInterviewStream(
  messages: ChatMessage[],
  selectedChatModel: string,
  dataStream: Parameters<
    Parameters<typeof createUIMessageStream>[0]["execute"]
  >[0]["writer"]
) {
  const userMessages = messages.filter((m) => m.role === "user");
  const isFirstMessage = userMessages.length <= 1;

  let result;

  if (isFirstMessage) {
    result = streamText({
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
            "你好！欢迎参加今天的前端技术面试。我是你的面试官，很高兴见到你。\n\n在开始之前，我想先了解一下你的情况：\n\n1. 你目前的技术栈主要是什么？（如 React、Vue 等）\n2. 你有多久的前端开发经验？\n3. 你期望面试什么级别的岗位？（初级/中级/高级）\n\n了解这些信息后，我会针对性地准备面试问题。请放轻松，把这当作一次真实的面试体验。",
        },
        {
          role: "user",
          content:
            messages[messages.length - 1]?.parts
              .filter((part) => part.type === "text")
              .map((part) => ("text" in part ? part.text : ""))
              .join(" ") || "",
        },
      ],
      experimental_transform: smoothStream({ chunking: "word" }),
    });
  } else {
    result = streamText({
      model: getLanguageModel(selectedChatModel) as any,
      system: MOCK_INTERVIEW_PROMPT,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.parts
          .filter((part) => part.type === "text")
          .map((part) => ("text" in part ? part.text : ""))
          .join(" "),
      })),
      experimental_transform: smoothStream({ chunking: "word" }),
    });
  }

  // Use merge to stream the result - it handles stream consumption
  dataStream.merge(
    result.toUIMessageStream({
      sendReasoning: true,
    })
  );

  // Wait for the stream to complete
  await result.consumeStream();
}

/**
 * Mock interview AI agent
 *
 * This agent simulates a technical interview for programmers.
 * - Acts as a professional technical interviewer
 * - Asks progressive technical questions
 * - Provides feedback and evaluation
 */
export function mockInterviewAgent(
  messages: ChatMessage[],
  selectedChatModel: string,
  session: Session,
  chatId: string
) {
  return createUIMessageStream({
    execute: async ({ writer: dataStream }) => {
      const userMessages = messages.filter((m) => m.role === "user");
      const isFirstMessage = userMessages.length <= 1;

      let result;

      // If first message, start the interview with a greeting
      if (isFirstMessage) {
        result = streamText({
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
              content:
                messages[messages.length - 1]?.parts
                  .filter((part) => part.type === "text")
                  .map((part) => ("text" in part ? part.text : ""))
                  .join(" ") || "",
            },
          ],
          experimental_transform: smoothStream({ chunking: "word" }),
        });
      } else {
        // Continue the interview conversation
        result = streamText({
          model: getLanguageModel(selectedChatModel) as any,
          system: MOCK_INTERVIEW_PROMPT,
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.parts
              .filter((part) => part.type === "text")
              .map((part) => ("text" in part ? part.text : ""))
              .join(" "),
          })),
          experimental_transform: smoothStream({ chunking: "word" }),
        });
      }

      // Use merge to stream the result - it handles stream consumption
      dataStream.merge(
        result.toUIMessageStream({
          sendReasoning: true,
        })
      );

      // Wait for the stream to complete
      await result.consumeStream();
    },
    generateId: generateUUID,
    onFinish: async ({ messages: finishedMessages }) => {
      await handleFinishedMessages({
        finishedMessages: finishedMessages as ChatMessage[],
        uiMessages: messages,
        chatId,
        isToolApprovalFlow: false,
      });
    },
    onError: () => {
      return "Oops, an error occurred!";
    },
  });
}
