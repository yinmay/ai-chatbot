import { createUIMessageStream, smoothStream, streamText } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { getLanguageModel } from "@/lib/ai/providers";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { handleFinishedMessages, processMessagesWithPDF } from "./common";

/**
 * System prompt for resume optimization
 */
const RESUME_OPT_PROMPT = `你是一位互联网大厂的资深程序员和简历优化专家，拥有多年的技术面试和简历评审经验，最擅长程序员简历的评审和优化。

你的专业领域：
- 前端技术栈：HTML、CSS、JavaScript、TypeScript、React、Vue、Node.js、微信小程序等
- 简历优化：帮助求职者优化技术简历，突出项目经验和技术亮点
- 项目经历描述：指导如何用 STAR 法则（Situation、Task、Action、Result）描述项目经验
- 技术技能展示：帮助求职者合理组织和呈现技术栈

## 如果当前没有简历内容

提示用户把简历文本内容粘贴输入到这里，并说明要求：
- 内容要完整（包括教育背景、专业技能、工作经历、项目经验等）
- 可以隐藏个人敏感信息（姓名、电话、邮箱、身份证等）

## 评审简历时需要关注的要点

1. **教育背景**
   - 毕业学校是否有优势（985/211/双一流等）
   - 专业是否是计算机相关专业
   - 毕业时间越短，学校的影响越大

2. **专业技能**
   - 技能的深度和广度是否和毕业时间、工作经验相匹配
   - 是否列出了核心技术栈
   - 是否体现出技术优势和同龄人的差异

3. **工作经历**
   - 是否有大公司（BAT、字节、美团等）工作经历
   - 工作内容是否体现出价值和成长
   - 职责描述是否具体明确

4. **项目经验**
   - 是否有大规模项目经验
   - 是否担当过项目负责人或核心开发
   - 是否体现出自己在项目中的价值、亮点、成绩
   - 项目描述是否有量化数据支撑

5. **整体评估**
   - 简历是否突出了个人技术优势
   - 和同龄人相比是否有竞争力

## 优化简历时的具体建议

### 教育背景优化
- 如果是专科学校或非计算机专业，可以考虑暂时隐藏或弱化教育经历
- 专升本的可只写"本科"，不必详细说明专升本经历
- 如果学校有优势（985/211/双一流），要放在显眼位置

### 专业技能优化
- **避免使用"了解xx技术"**，要么写"熟悉xx技术"，要么不写
- 技能要分层次：精通、熟练、熟悉
- 核心技术栈要放在最前面
- 避免列举过时或不重要的技术

### 工作经历优化
- 要写出自己在这家公司的**具体工作成果**
- 不要记录流水账、无用的废话
- 用量化数据体现价值（如：优化性能提升30%、负责日活10万+的项目等）
- 突出技术难点的攻克和创新点

### 项目经验优化（重点）

**项目数量**：
- 建议在 3-5 个之间
- 根据毕业时间和工作经验来定（应届生可 2-3 个，3年经验可 4-5 个）

**项目排序**：
- **第一个项目一定要是最重要的、最具代表性的项目**
- 第一个项目的内容要丰富，要能体现出亮点和成绩
- 其他项目按重要性和相关性递减排列

**项目描述要点**：
- 项目背景：简要说明项目规模和业务价值
- 技术栈：列出使用的核心技术
- 个人职责：明确自己在项目中的角色和具体工作
- 技术亮点：解决的技术难点、创新点、优化点
- 量化成果：用数据说话（性能提升、用户增长、开发效率等）

**项目职责描述模板**：
用 **[技术名称]** 技术，实现 **[功能/解决方案]**，达成 **[量化效果]**

示例：
- ❌ 差："负责前端开发"
- ✅ 好："使用 React + TypeScript，开发了用户管理系统的前端页面，通过虚拟列表优化，将大数据渲染性能提升 60%，页面加载时间从 3s 降至 1.2s"

## 可用工具

你可以使用以下工具来辅助评审：

### evaluateSkills - 技能评分工具
**功能**：评估简历中的技能列表，根据毕业时间和工作经验给出评分和建议。

**使用时机**：
- 当用户提供了包含教育背景和技能列表的简历后
- **必须调用此工具**对专业技能部分进行评分

**参数**：
- graduationYear: 毕业年份（数字，如 2020）
- skills: 技能列表（字符串数组），从简历中提取所有技能

**返回结果示例**：
{
  score: 7.5,                    // 技能评分（5-10分）
  yearsOfExperience: 3,          // 工作年限
  skillCount: 12,                // 当前技能数量
  expectedSkillCount: 11,        // 期望技能数量
  summary: "技能列表良好，稍作优化会更好。",
  suggestions: [
    "作为有 3 年经验的开发者，建议将核心技能标注为'精通'或'熟练'",
    "建议增加现代前端技术栈（如 React、Vue、TypeScript 等）"
  ]
}

**如何使用评分结果**：
1. 在"专业技能"部分首先展示 tool 返回的评分（如：技能评分：7.5/10）
2. 展示 summary 总结
3. 列出 suggestions 中的所有建议
4. 基于评分结果补充你的专业建议

## 回复用户的格式

当收到用户的简历后，按以下格式回复：

### 📊 整体评分
给出综合评分（0-100分），并说明评分理由

### 💡 优化建议

**1. 教育背景**
- [具体建议]

**2. 专业技能**
- 技能评分：[使用 evaluateSkills 工具得到的分数]/10
- 评估总结：[tool 返回的 summary]
- 优化建议：
  - [tool 返回的 suggestions，逐条列出]
  - [基于评分结果补充的其他建议]

**3. 工作经历**
- [具体建议]

**4. 项目经验**
- [具体建议，包括每个项目的优化方向]

### ✨ 优化示例
选择 1-2 个最需要优化的部分，给出优化前后的对比示例

沟通风格：
- 专业且友好，像一位经验丰富的前辈
- 提供具体可操作的建议
- 给出优化前后的对比示例
- 解释为什么这样优化更好
- 鼓励求职者，给予信心

When asked to write, create, or help with something, just do it directly. Don't ask clarifying questions unless absolutely necessary - make reasonable assumptions and proceed with the task.`;

/**
 * Tool: Evaluate skills based on graduation year
 *
 * This tool evaluates the technical skills listed in a resume based on
 * the candidate's graduation year and work experience.
 */
const evaluateSkillsTool = {
  description: "评估简历中的技能列表，根据毕业时间和工作经验给出评分和建议。当用户提供了简历内容后，可以使用此工具评估技能部分。",
  inputSchema: z.object({
    graduationYear: z
      .number()
      .describe("毕业年份（如：2020）"),
    skills: z
      .array(z.string())
      .describe("技能列表，例如：['JavaScript', 'React', 'TypeScript', 'Node.js']"),
  }),
  execute: async ({ graduationYear, skills }: { graduationYear: number; skills: string[] }) => {
    const currentYear = new Date().getFullYear();
    const yearsOfExperience = Math.max(0, currentYear - graduationYear);

    // 计算评分
    let score = 5; // 基础分
    let suggestions: string[] = [];

    // 根据工作年限设定期望技能数量
    const expectedSkillCount = Math.min(15, 5 + yearsOfExperience * 2);
    const skillCount = skills.length;

    // 1. 评估技能数量
    if (skillCount >= expectedSkillCount) {
      score += 2;
    } else if (skillCount >= expectedSkillCount * 0.7) {
      score += 1;
      suggestions.push(`建议增加技能数量至 ${expectedSkillCount} 个左右，体现技术广度`);
    } else {
      suggestions.push(`技能数量偏少，建议增加到 ${expectedSkillCount} 个左右`);
    }

    // 2. 评估技能深度（基于工作年限）
    if (yearsOfExperience >= 3) {
      score += 2;
      suggestions.push("作为有 " + yearsOfExperience + " 年经验的开发者，建议将核心技能标注为'精通'或'熟练'");
    } else if (yearsOfExperience >= 1) {
      score += 1.5;
      suggestions.push("建议将常用技能标注为'熟练'，突出实战经验");
    } else {
      score += 1;
      suggestions.push("应届生可适当标注'熟悉'，避免使用'了解'");
    }

    // 3. 检查技能描述（避免"了解"）
    const hasWeakTerms = skills.some(skill =>
      skill.includes("了解") || skill.toLowerCase().includes("understand")
    );

    if (!hasWeakTerms) {
      score += 0.5;
    } else {
      suggestions.push("避免使用'了解xx技术'，改为'熟悉xx技术'或直接删除");
    }

    // 4. 评估技术栈的现代性
    const modernTech = ['React', 'Vue', 'TypeScript', 'Next.js', 'Tailwind', 'Node.js', 'GraphQL'];
    const hasModernTech = skills.some(skill =>
      modernTech.some(tech => skill.includes(tech))
    );

    if (hasModernTech) {
      score += 0.5;
    } else {
      suggestions.push("建议增加现代前端技术栈（如 React、Vue、TypeScript 等）");
    }

    // 确保分数在 5-10 范围内
    score = Math.min(10, Math.max(5, score));

    // 生成总结建议
    let summary = "";
    if (score >= 9) {
      summary = "技能列表优秀！";
    } else if (score >= 7.5) {
      summary = "技能列表良好，稍作优化会更好。";
    } else if (score >= 6) {
      summary = "技能列表合格，但有较大优化空间。";
    } else {
      summary = "技能列表需要较大幅度优化。";
    }

    return {
      score: Math.round(score * 10) / 10, // 保留一位小数
      yearsOfExperience,
      skillCount,
      expectedSkillCount,
      summary,
      suggestions,
    };
  },
};

/**
 * Execute resume optimization stream (for use inside createUIMessageStream)
 */
export async function executeResumeOptStream(
  messages: ChatMessage[],
  selectedChatModel: string,
  dataStream: Parameters<Parameters<typeof createUIMessageStream>[0]["execute"]>[0]["writer"]
) {
  // Process PDF attachments (important for resume PDFs)
  const processedMessages = await processMessagesWithPDF(messages);
  const hasResume = hasResumeContent(processedMessages);

  let result;

  if (!hasResume) {
    result = streamText({
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
            "你好！我是专业的简历优化顾问，很高兴帮你优化技术简历。\n\n为了给你提供最有针对性的建议，请把你的简历内容发给我。你可以直接粘贴简历文本，或者上传PDF格式的简历，我会帮你：\n\n1. 优化项目经历的描述方式\n2. 突出技术亮点和核心贡献\n3. 用量化数据展示你的成果\n4. 调整技术栈的呈现方式\n5. 提供具体的优化建议\n\n请发送你的简历内容吧！",
        },
        {
          role: "user",
          content: processedMessages[processedMessages.length - 1]?.parts
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
      system: RESUME_OPT_PROMPT,
      messages: processedMessages.map((msg) => ({
        role: msg.role,
        content: msg.parts
          .filter((part) => part.type === "text")
          .map((part) => ("text" in part ? part.text : ""))
          .join(" "),
      })),
      tools: {
        evaluateSkills: evaluateSkillsTool,
      },
      experimental_transform: smoothStream({ chunking: "word" }),
    });
  }

  result.consumeStream();

  dataStream.merge(
    result.toUIMessageStream({
      sendReasoning: true,
    })
  );
}

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
export function resumeOptimizationAgent(
  messages: ChatMessage[],
  selectedChatModel: string,
  session: Session,
  chatId: string
) {
  return createUIMessageStream({
    execute: async ({ writer: dataStream }) => {
      const hasResume = hasResumeContent(messages);

      let result;

      // If no resume content, prompt user to provide it
      if (!hasResume) {
        result = streamText({
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
          experimental_transform: smoothStream({ chunking: "word" }),
        });
      } else {
        // If has resume content, provide optimization with tools
        result = streamText({
          model: getLanguageModel(selectedChatModel) as any,
          system: RESUME_OPT_PROMPT,
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.parts
              .filter((part) => part.type === "text")
              .map((part) => ("text" in part ? part.text : ""))
              .join(" "),
          })),
          tools: {
            evaluateSkills: evaluateSkillsTool,
          },
          experimental_transform: smoothStream({ chunking: "word" }),
        });
      }

      result.consumeStream();

      dataStream.merge(
        result.toUIMessageStream({
          sendReasoning: true,
        })
      );
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
