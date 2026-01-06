import { tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import type { ChatMessage } from "@/lib/types";

type ResumeTemplateProps = {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

/**
 * Resume template tool
 *
 * Generates a professional resume template for frontend developers
 * with best practices and structured sections.
 */
export const resumeTemplate = ({ session, dataStream }: ResumeTemplateProps) =>
  tool({
    description:
      "生成一个专业的程序员简历模板，包含最佳实践和结构化的各个部分。支持不同的工作年限和技术栈定制。",
    inputSchema: z.object({
      name: z.string().describe("姓名（可选，默认为'张三'）").optional(),
      yearsOfExperience: z
        .number()
        .min(0)
        .max(20)
        .describe("工作年限（0表示应届生）"),
      techStack: z
        .enum(["react", "vue", "fullstack", "nodejs"])
        .describe("主要技术栈：react, vue, fullstack（全栈）, nodejs"),
      level: z
        .enum(["junior", "mid", "senior"])
        .describe("目标职级：junior（初级）, mid（中级）, senior（高级）"),
    }),
    execute: async ({ name = "张三", yearsOfExperience, techStack, level }) => {
      // 根据工作年限和职级定制模板
      const template = generateResumeTemplate({
        name,
        yearsOfExperience,
        techStack,
        level,
      });

      // 返回生成的简历模板
      return {
        success: true,
        message: "简历模板已生成",
        template,
      };
    },
  });

/**
 * Generate resume template based on user preferences
 */
function generateResumeTemplate({
  name,
  yearsOfExperience,
  techStack,
  level,
}: {
  name: string;
  yearsOfExperience: number;
  techStack: "react" | "vue" | "fullstack" | "nodejs";
  level: "junior" | "mid" | "senior";
}): string {
  const isJunior = yearsOfExperience === 0;
  const levelMap = {
    junior: "初级",
    mid: "中级",
    senior: "高级",
  };

  const techStackMap = {
    react: "React",
    vue: "Vue.js",
    fullstack: "全栈",
    nodejs: "Node.js",
  };

  // 技能列表根据技术栈定制
  const getSkills = () => {
    const baseSkills = [
      "熟练掌握 HTML5、CSS3、JavaScript(ES6+)",
      "熟练掌握 TypeScript，具备类型编程能力",
    ];

    const techSpecificSkills: Record<string, string[]> = {
      react: [
        "精通 React 18+ 及其生态（Hooks、Context、Redux）",
        "熟练使用 Next.js 进行 SSR/SSG 开发",
        "熟悉 React Query、Zustand 等状态管理方案",
      ],
      vue: [
        "精通 Vue 3 及其生态（Composition API、Pinia）",
        "熟练使用 Nuxt.js 进行 SSR/SSG 开发",
        "熟悉 Vue Router、Vuex/Pinia 状态管理",
      ],
      fullstack: [
        "精通 React/Vue 前端框架及其生态",
        "熟练掌握 Node.js、Express/Koa 后端开发",
        "熟悉 MongoDB、PostgreSQL 等数据库",
        "了解微服务架构和容器化部署（Docker、K8s）",
      ],
      nodejs: [
        "精通 Node.js 及其核心模块",
        "熟练使用 Express、Koa、NestJS 等框架",
        "熟悉 RESTful API 和 GraphQL 设计",
        "掌握数据库设计和 ORM（Prisma、TypeORM）",
      ],
    };

    const advancedSkills = [
      "熟悉前端工程化（Webpack、Vite、Rollup）",
      "掌握前端性能优化和监控",
      "了解微前端架构（qiankun、Module Federation）",
      "熟悉 Git 工作流和 CI/CD",
    ];

    return [
      ...baseSkills,
      ...techSpecificSkills[techStack],
      ...advancedSkills,
    ].slice(
      0,
      yearsOfExperience === 0 ? 6 : 8 + Math.min(yearsOfExperience, 4)
    );
  };

  // 项目经验模板
  const getProjectTemplate = () => {
    const projectCount = isJunior
      ? 2
      : Math.min(3 + Math.floor(yearsOfExperience / 2), 5);

    return `## 项目经验

### 项目一：[项目名称]（重点项目，内容要丰富）
**项目时间**：YYYY.MM - YYYY.MM
**项目简介**：[简要描述项目背景、规模、业务价值，让人快速理解项目是做什么的]
**技术栈**：${techStackMap[techStack]}、TypeScript、[其他核心技术]
**个人职责**：
- 使用 **[技术名称]** 技术，实现 **[功能/解决方案]**，达成 **[量化效果]**
  例：使用 React + TypeScript，开发了用户管理系统的前端页面，通过虚拟列表优化，将大数据渲染性能提升 60%，页面加载时间从 3s 降至 1.2s
- [第二个核心职责，同样用"技术-功能-效果"模式描述]
- [第三个核心职责]
**技术亮点**：
- 解决的技术难点：[具体描述遇到的技术挑战和解决方案]
- 创新点/优化点：[说明有什么创新或优化，最好有量化数据]
**项目成果**：[量化成果，如：性能提升XX%、用户增长XX、开发效率提升XX等]

${
  projectCount > 1
    ? `### 项目二：[项目名称]
**项目时间**：YYYY.MM - YYYY.MM
**项目简介**：[项目描述]
**技术栈**：[技术栈]
**个人职责**：
- [职责描述1]
- [职责描述2]
**项目成果**：[成果]
`
    : ""
}
${
  projectCount > 2
    ? `### 项目三：[项目名称]
**项目时间**：YYYY.MM - YYYY.MM
**项目简介**：[项目描述]
**技术栈**：[技术栈]
**个人职责**：
- [职责描述1]
- [职责描述2]
`
    : ""
}
（建议项目数量：${projectCount} 个，按重要性递减排列）`;
  };

  // 工作经历模板
  const getWorkExperience = () => {
    if (isJunior) {
      return `## 工作经历

### [公司名称] - ${levelMap[level]}${techStackMap[techStack]}工程师
**工作时间**：YYYY.MM - 至今
**工作内容**：
- 参与 [项目名称] 的前端开发，负责 [具体模块]
- 使用 ${techStackMap[techStack]} 技术栈，完成 [功能描述] 的开发
- 协助团队进行代码 Review 和技术分享

（应届生可删除此部分，或改为实习经历）`;
    }

    const jobCount = Math.min(1 + Math.floor(yearsOfExperience / 3), 3);

    return `## 工作经历

### [公司名称] - ${levelMap[level]}${techStackMap[techStack]}工程师
**工作时间**：YYYY.MM - 至今
**工作内容**：
- 负责 [业务线/产品] 的前端架构设计和核心功能开发
- 使用 ${techStackMap[techStack]} 技术栈，主导 [重要功能] 的技术方案设计和实施
- 通过性能优化，将页面加载时间从 Xs 降至 Ys，提升用户体验
- 参与团队技术选型和代码规范制定，推动工程化建设
${level === "senior" ? "- 指导初中级工程师，进行技术评审和代码 Review" : ""}

${
  jobCount > 1
    ? `### [公司名称] - ${techStackMap[techStack]}工程师
**工作时间**：YYYY.MM - YYYY.MM
**工作内容**：
- 负责 [项目/产品] 的前端开发工作
- 实现 [核心功能描述]，支持日活 XX 万+ 的业务
`
    : ""
}`;
  };

  // 完整简历模板
  return `# ${name}

**求职意向**：${levelMap[level]}${techStackMap[techStack]}工程师
**工作年限**：${isJunior ? "应届毕业生" : `${yearsOfExperience} 年`}
**联系方式**：
- 手机：138****8888
- 邮箱：example@email.com
- GitHub：github.com/username

---

## 个人简介

${
  level === "senior"
    ? `${yearsOfExperience}年前端开发经验，精通 ${techStackMap[techStack]} 技术栈，具备大型项目架构设计和性能优化经验。擅长解决复杂技术问题，有良好的团队协作和技术分享能力。`
    : level === "mid"
      ? `${yearsOfExperience}年前端开发经验，熟练掌握 ${techStackMap[techStack]} 及相关生态，有多个完整项目经验。注重代码质量和性能优化，具备良好的学习能力和问题解决能力。`
      : `热爱前端开发，熟悉 ${techStackMap[techStack]} 技术栈，有扎实的编程基础和快速学习能力。通过实习/项目积累了一定的开发经验，渴望在实际工作中继续成长。`
}

---

## 教育背景

### [学校名称] - [专业名称] - [学历]
**毕业时间**：YYYY.MM
${level !== "junior" ? "**备注**：如果是 985/211/双一流，要突出显示；如果学校一般，可以弱化这部分" : ""}

---

## 专业技能

${getSkills()
  .map((skill) => `- ${skill}`)
  .join("\n")}

**注意**：
- 避免使用"了解xx技术"，改为"熟悉xx技术"或直接删除
- 技能要分层次：精通 > 熟练 > 熟悉
- 核心技术栈放在最前面

---

${getWorkExperience()}

---

${getProjectTemplate()}

---

## 其他信息

- **GitHub**：[放置个人开源项目或技术博客链接，如有的话]
- **技术博客**：[如有技术博客，可以放置链接]
- **获奖经历**：[如有相关奖项，可列出]

---

## 💡 简历优化建议

1. **项目描述**要用 STAR 法则：Situation（背景）、Task（任务）、Action（行动）、Result（结果）
2. **量化数据**：尽可能用数据说话（如：性能提升30%、日活10万+等）
3. **突出亮点**：第一个项目一定要最重要、最有代表性
4. **避免流水账**：只写有价值的工作内容，不要记录无意义的细节
5. **技术栈匹配**：根据目标岗位要求，调整技能列表的顺序和内容

---

**模板说明**：
- 本模板适用于 ${levelMap[level]}${techStackMap[techStack]}工程师（${isJunior ? "应届" : `${yearsOfExperience}年经验`}）
- 请根据实际情况填写 [方括号] 中的内容
- 删除不需要的部分（如应届生可删除工作经历部分）
- 保持简历在 2-3 页为宜，重点突出核心项目和技术能力
`;
}
