<a href="https://chat.vercel.ai/">
  <img alt="Next.js 14 and App Router-ready AI chatbot." src="app/(chat)/opengraph-image.png">
  <h1 align="center">AI Career Assistant</h1>
</a>

<p align="center">
    An intelligent AI assistant specialized in resume optimization and technical interview preparation for frontend developers.
</p>

<p align="center">
  <a href="https://chat-sdk.dev"><strong>Read Docs</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

### 🎯 Specialized AI Agents

- **Resume Optimization Agent**
  - Professional resume evaluation and optimization
  - AI-powered skills assessment tool (5-10 scoring system)
  - STAR method guidance for project descriptions
  - Quantified improvement suggestions
  - Resume template generator with customization options

- **Mock Interview Agent**
  - Realistic frontend technical interview simulation
  - 8-10 questions covering: self-intro, coding, algorithms, system design, and project experience
  - Real-time feedback with specific evaluation criteria
  - Comprehensive interview performance report
  - STAR method coaching for answering behavioral questions

- **Intelligent Intent Classification**
  - Automatic routing to appropriate agent based on user intent
  - Support for resume optimization, mock interviews, and general technical Q&A

### 🛠️ AI Tools

- **evaluateSkills**: Automated skills evaluation based on graduation year and experience
- **resumeTemplate**: Generate customized resume templates for different tech stacks (React, Vue, Full-stack, Node.js) and experience levels

### 💻 Technical Stack

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://ai-sdk.dev/docs/introduction)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Support for multiple AI providers (Anthropic, OpenAI, Google, DeepSeek)
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Neon Serverless Postgres](https://vercel.com/marketplace/neon) for saving chat history and user data
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage
- [Auth.js](https://authjs.dev)
  - Simple and secure authentication

## Use Cases

### Resume Optimization
1. Paste your resume content into the chat
2. Get instant professional evaluation with scoring
3. Receive specific optimization suggestions
4. Generate customized resume templates
5. Learn STAR method for project descriptions

### Mock Interview Preparation
1. Start a mock interview session
2. Answer questions about your background, coding skills, algorithms, and projects
3. Get real-time feedback on your answers
4. Receive comprehensive interview performance report
5. Improve your interview skills with professional coaching

### Technical Q&A
- Ask questions about frontend technologies (HTML, CSS, JavaScript, TypeScript, React, Vue, Node.js)
- Get guidance on career development
- Learn best practices for project development
- Prepare for technical interviews

## Model Providers

This application supports multiple AI model providers:

- **Anthropic**: Claude Haiku 4.5, Claude Sonnet 4.5, Claude Opus 4.5
- **OpenAI**: GPT-4.1 Mini, GPT-5.2
- **Google**: Gemini 2.5 Flash Lite, Gemini 3 Pro
- **DeepSeek**: DeepSeek Chat, DeepSeek Reasoner
- **Reasoning Models**: Claude 3.7 Sonnet (with extended thinking)

Configure your preferred model providers through environment variables. See `.env.example` for details.

## Deploy Your Own

You can deploy your own version of the Next.js AI Chatbot to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/templates/next.js/nextjs-ai-chatbot)

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run the AI Career Assistant. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various AI and authentication provider accounts.

### Setup Steps

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm db:migrate # Setup database or apply latest database changes
pnpm dev
```

Your app should now be running on [localhost:3000](http://localhost:3000).

### Project Structure

```
lib/ai/
├── agent/
│   ├── classify.ts          # Intent classification
│   ├── resume-opt.ts        # Resume optimization agent
│   ├── mock-interview.ts    # Mock interview agent
│   ├── common.ts            # Shared agent utilities
│   └── index.ts             # Agent routing
└── tools/
    ├── resume-template.ts   # Resume template generator
    ├── create-document.ts   # Document creation tool
    ├── update-document.ts   # Document update tool
    ├── get-weather.ts       # Weather information tool
    └── request-suggestions.ts # Suggestions tool
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
