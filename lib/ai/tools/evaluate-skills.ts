import { z } from "zod";

/**
 * Tool: Evaluate skills based on graduation year
 *
 * This tool evaluates the technical skills listed in a resume based on
 * the candidate's graduation year and work experience.
 */
export const evaluateSkillsTool = {
  description:
    "评估简历中的技能列表，根据毕业时间和工作经验给出评分和建议。当用户提供了简历内容后，可以使用此工具评估技能部分。",
  inputSchema: z.object({
    graduationYear: z.number().describe("毕业年份（如：2020）"),
    skills: z
      .array(z.string())
      .describe(
        "技能列表，例如：['JavaScript', 'React', 'TypeScript', 'Node.js']"
      ),
  }),
  execute: async ({
    graduationYear,
    skills,
  }: {
    graduationYear: number;
    skills: string[];
  }) => {
    const currentYear = new Date().getFullYear();
    const yearsOfExperience = Math.max(0, currentYear - graduationYear);

    // 计算评分
    let score = 5; // 基础分
    const suggestions: string[] = [];

    // 根据工作年限设定期望技能数量
    const expectedSkillCount = Math.min(15, 5 + yearsOfExperience * 2);
    const skillCount = skills.length;

    // 1. 评估技能数量
    if (skillCount >= expectedSkillCount) {
      score += 2;
    } else if (skillCount >= expectedSkillCount * 0.7) {
      score += 1;
      suggestions.push(
        `建议增加技能数量至 ${expectedSkillCount} 个左右，体现技术广度`
      );
    } else {
      suggestions.push(
        `技能数量偏少，建议增加到 ${expectedSkillCount} 个左右`
      );
    }

    // 2. 评估技能深度（基于工作年限）
    if (yearsOfExperience >= 3) {
      score += 2;
      suggestions.push(
        "作为有 " +
          yearsOfExperience +
          " 年经验的开发者，建议将核心技能标注为'精通'或'熟练'"
      );
    } else if (yearsOfExperience >= 1) {
      score += 1.5;
      suggestions.push("建议将常用技能标注为'熟练'，突出实战经验");
    } else {
      score += 1;
      suggestions.push("应届生可适当标注'熟悉'，避免使用'了解'");
    }

    // 3. 检查技能描述（避免"了解"）
    const hasWeakTerms = skills.some(
      (skill) =>
        skill.includes("了解") || skill.toLowerCase().includes("understand")
    );

    if (!hasWeakTerms) {
      score += 0.5;
    } else {
      suggestions.push(
        "避免使用'了解xx技术'，改为'熟悉xx技术'或直接删除"
      );
    }

    // 4. 评估技术栈的现代性
    const modernTech = [
      "React",
      "Vue",
      "TypeScript",
      "Next.js",
      "Tailwind",
      "Node.js",
      "GraphQL",
    ];
    const hasModernTech = skills.some((skill) =>
      modernTech.some((tech) => skill.includes(tech))
    );

    if (hasModernTech) {
      score += 0.5;
    } else {
      suggestions.push(
        "建议增加现代前端技术栈（如 React、Vue、TypeScript 等）"
      );
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
