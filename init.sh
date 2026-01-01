#!/bin/bash

# RenderMe - 开发环境初始化脚本
# ================================

echo "🚀 RenderMe 开发环境初始化"
echo "=========================="

# 检查 Node.js 版本
echo ""
echo "1. 检查 Node.js 环境..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "   ✅ Node.js 版本: $NODE_VERSION"
else
    echo "   ❌ 未找到 Node.js，请先安装 Node.js (推荐 v20+)"
    echo "   安装方式: https://nodejs.org/ 或使用 nvm"
    exit 1
fi

# 检查 pnpm
echo ""
echo "2. 检查 pnpm..."
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm -v)
    echo "   ✅ pnpm 版本: $PNPM_VERSION"
else
    echo "   ⚠️  未找到 pnpm，正在安装..."
    npm install -g pnpm
    echo "   ✅ pnpm 已安装"
fi

# 安装依赖
echo ""
echo "3. 安装项目依赖..."
pnpm install

# 检查环境变量
echo ""
echo "4. 检查环境配置..."
if [ -f ".env.local" ]; then
    echo "   ✅ .env.local 文件已存在"
else
    echo "   ⚠️  未找到 .env.local 文件"
    echo "   请创建 .env.local 并配置以下环境变量:"
    echo ""
    echo "   # 必需的环境变量"
    echo "   AUTH_SECRET=your-auth-secret-here"
    echo ""
    echo "   # AI 模型 API Keys (至少配置一个)"
    echo "   OPENAI_API_KEY=your-openai-key"
    echo "   ANTHROPIC_API_KEY=your-anthropic-key"
    echo "   DEEPSEEK_API_KEY=your-deepseek-key"
    echo ""
    echo "   # 数据库 (使用 PostgreSQL)"
    echo "   POSTGRES_URL=postgresql://user:password@localhost:5432/renderme"
    echo ""
    echo "   # 可选: Vercel Blob 存储 (用于生产环境文件上传)"
    echo "   # BLOB_READ_WRITE_TOKEN=your-blob-token"
    echo ""
fi

# 数据库迁移
echo ""
echo "5. 数据库设置..."
echo "   运行以下命令推送数据库 schema:"
echo "   pnpm run db:push"

# 启动说明
echo ""
echo "=================================="
echo "✨ 初始化完成!"
echo "=================================="
echo ""
echo "启动开发服务器:"
echo "  pnpm run dev"
echo ""
echo "服务器将在以下地址运行:"
echo "  http://localhost:3000"
echo ""
echo "其他常用命令:"
echo "  pnpm run build     # 构建生产版本"
echo "  pnpm run db:push   # 推送数据库 schema"
echo "  pnpm run db:studio # 打开数据库管理界面"
echo ""
