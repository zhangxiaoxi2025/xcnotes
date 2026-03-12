# 智能错题本 (Smart Error Book)

## Overview
A mobile-first web app for managing and analyzing exam errors. Users can upload question images, get AI-powered analysis via Gemini, organize questions into directories, and generate knowledge graphs.

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + wouter
- **Backend**: Express.js (proxy for Gemini API calls only)
- **Storage**: Dexie.js (IndexedDB) for all client-side data
- **AI**: Google Gemini via Replit AI Integrations (no API key needed)
- **Charts**: ECharts (echarts-for-react) for knowledge graphs
- **Export**: html-to-image for PNG export

## Key Files
- `client/src/lib/db.ts` - Dexie.js database schema (directories, questions, chatMessages)
- `client/src/lib/services.ts` - Data service layer (CRUD operations + chatService)
- `client/src/lib/gemini.ts` - Frontend API calls to backend Gemini proxy
- `server/routes.ts` - Backend Gemini API proxy endpoints (/api/analyze, /api/knowledge-graph, /api/chat)
- `client/src/components/BottomNav.tsx` - Mobile bottom navigation
- `client/src/components/ImageUploader.tsx` - Camera/gallery image upload
- `client/src/components/QuestionCard.tsx` - Question display card
- `client/src/components/ChatPanel.tsx` - AI chat panel (full-screen overlay from question detail)

## Features
- Dark mode toggle (Profile page → 外观模式)
- Image crop/preview before upload (single photo from camera)
- Batch upload: select multiple images from gallery (up to 10), preview grid with remove, sequential AI analysis with progress bar
- Search questions by keyword (题目文本, 知识点, 选项解析) with debounce
- Question marking: 已掌握 (mastered, green) / 需复习 (review, orange) status on each question
- Review page (/review) with filter tabs to view marked questions
- AI chat: per-question multi-turn discussion with Gemini, supports image attachments, persisted in IndexedDB

## Pages
- `/` - Home page with search bar, stats, upload, recent questions
- `/directories` - Directory management (create, rename, delete, 3-level hierarchy)
- `/directory/:id` - Directory detail with questions, multi-select, knowledge graph
- `/question/:id` - Question detail with AI analysis + status marking
- `/knowledge-graph` - Knowledge graph visualization with export
- `/review` - Review page with filter tabs (需复习 / 已掌握)
- `/profile` - Profile with data stats and clear all data

## Data Models
- **Directory**: id (UUID), name, parentId, createdAt
- **Question**: id (UUID), directoryId, imageBase64, analysisJson, createdAt, status? ("none" | "mastered" | "review")
- **ChatMessage**: id (UUID), questionId, role ("user" | "model"), text, imageBase64?, createdAt

## Dependencies Added
- dexie (IndexedDB wrapper)
- echarts + echarts-for-react (charting)
- html-to-image (PNG export)
- uuid + @types/uuid (UUID generation)
- @google/genai (Gemini SDK via Replit AI Integrations)
- react-image-crop (image cropping)

## Notes
- All UI text is in Simplified Chinese
- Data stored entirely in browser IndexedDB (Dexie v3 schema)
- Backend only serves as Gemini API proxy
- Image body limit set to 50mb in Express
- Bottom navigation has 4 tabs: 首页, 目录, 复习本, 我的
