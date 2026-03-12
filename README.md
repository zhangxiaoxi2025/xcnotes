# xcnotes 智能错题本

拍照上传，AI 智能解析，轻松管理错题。

## 功能特点

- 📷 **拍照上传** - 支持单张/批量上传错题图片
- 🤖 **AI 智能解析** - 基于 Google Gemini 自动识别题目、选项、知识点
- 📁 **目录管理** - 按科目/章节分类管理错题
- 🔍 **智能搜索** - 快速搜索题目和知识点
- 📊 **数据统计** - 错题数量、本周新增等统计
- 💾 **本地存储** - 使用 Dexie 本地数据库，离线可用

## 技术栈

- **前端**: React + TypeScript + Tailwind CSS + shadcn/ui
- **后端**: Node.js + Express
- **数据库**: Drizzle ORM + PostgreSQL (服务端) / Dexie (客户端)
- **AI**: Google Gemini API

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/zhangxiaoxi2025/xcnotes.git
cd xcnotes
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，填入你的 Gemini API Key：

```
AI_INTEGRATIONS_GEMINI_API_KEY=your_gemini_api_key_here
```

获取 API Key: [Google AI Studio](https://aistudio.google.com/app/apikey)

### 4. 启动开发服务器

```bash
npm run dev
```

打开 http://localhost:5173 即可使用。

## 项目结构

```
xcnotes/
├── client/          # 前端 React 应用
├── server/          # 后端 Express API
├── shared/          # 共享类型和 Schema
├── script/          # 构建脚本
└── package.json     # 项目配置
```

## License

MIT
