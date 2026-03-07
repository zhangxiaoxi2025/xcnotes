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
- `client/src/lib/db.ts` - Dexie.js database schema (directories, questions)
- `client/src/lib/services.ts` - Data service layer (CRUD operations)
- `client/src/lib/gemini.ts` - Frontend API calls to backend Gemini proxy
- `server/routes.ts` - Backend Gemini API proxy endpoints (/api/analyze, /api/knowledge-graph)
- `client/src/components/BottomNav.tsx` - Mobile bottom navigation
- `client/src/components/ImageUploader.tsx` - Camera/gallery image upload
- `client/src/components/QuestionCard.tsx` - Question display card

## Pages
- `/` - Home page with stats, upload, recent questions
- `/directories` - Directory management (create, rename, delete, 3-level hierarchy)
- `/directory/:id` - Directory detail with questions, multi-select, knowledge graph
- `/question/:id` - Question detail with AI analysis
- `/knowledge-graph` - Knowledge graph visualization with export
- `/profile` - Profile with data stats and clear all data

## Data Models
- **Directory**: id (UUID), name, parentId, createdAt
- **Question**: id (UUID), directoryId, imageBase64, analysisJson, createdAt

## Dependencies Added
- dexie (IndexedDB wrapper)
- echarts + echarts-for-react (charting)
- html-to-image (PNG export)
- uuid + @types/uuid (UUID generation)
- @google/genai (Gemini SDK via Replit AI Integrations)

## Notes
- All UI text is in Simplified Chinese
- Data stored entirely in browser IndexedDB
- Backend only serves as Gemini API proxy
- Image body limit set to 50mb in Express
