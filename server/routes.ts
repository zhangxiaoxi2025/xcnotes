import type { Express } from "express";
import { createServer, type Server } from "http";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const ANALYSIS_PROMPT = `你是一个风趣幽默、喜欢用通俗易懂的段子解释复杂概念的金牌教师。请识别用户上传的题目图片，并按以下 JSON 格式输出解析结果。请务必只返回纯JSON，不要包含任何markdown标记或其他文字：
{
  "question_text": "识别出的原题题干",
  "knowledge_points": ["考察知识点1", "考察知识点2"],
  "humorous_explanation": "用风趣幽默、深入浅出的语言为你讲解这道题的核心陷阱和解题思路",
  "options_analysis": [
    {"option": "A", "is_correct": false, "related_knowledge": "相关知识点", "why_wrong": "错在哪里（如果是错误选项）/ 为什么对（如果是正确选项）"}
  ]
}`;

const KNOWLEDGE_GRAPH_PROMPT = `你是一个教育专家。请根据以下知识点列表，分析它们之间的关联关系，并生成一个知识图谱数据和总结。

请务必只返回纯JSON，不要包含任何markdown标记或其他文字。格式如下：
{
  "nodes": [{"name": "知识点名称", "category": 0}],
  "links": [{"source": "知识点A", "target": "知识点B"}],
  "categories": [{"name": "类别名称"}],
  "summary": "用通俗易懂、风趣幽默的语言总结这些知识点之间的关系和学习建议，300字以内"
}

注意：
1. category 用数字表示类别索引，相关的知识点分为同一类别
2. 类别数量控制在3-5个
3. links 表示知识点之间的关联关系
4. 每个知识点都应该至少有一个关联`;

const CHAT_SYSTEM_PROMPT = `你是一个专业的学科辅导老师，正在帮助学生分析一道题目。以下是题目的背景信息：

【原题图片已提供】
【AI原始解析】：
{ANALYSIS}

你的职责：
1. 当学生指出AI解析有错误时，虚心接受并根据学生提供的正确信息重新解释
2. 当学生上传教材截图或指南内容时，仔细阅读图片内容并结合题目进行分析
3. 用通俗易懂的语言回答学生的疑问
4. 回答要准确、有条理，必要时引用相关知识点
5. 保持友好、耐心的态度

请直接用文字回答，不需要返回JSON格式。`;

function extractBase64(dataUrl: string): { data: string; mimeType: string } {
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  const mimeMatch = dataUrl.match(/^data:(image\/\w+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
  return { data: base64Data, mimeType };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/analyze", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "缺少图片数据" });
      }

      const { data: base64Data, mimeType } = extractBase64(imageBase64);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: ANALYSIS_PROMPT },
              {
                inlineData: {
                  data: base64Data,
                  mimeType,
                },
              },
            ],
          },
        ],
        config: { maxOutputTokens: 8192 },
      });

      const text = response.text || "";
      let analysis;
      try {
        const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        analysis = JSON.parse(cleaned);
      } catch {
        analysis = {
          question_text: text,
          knowledge_points: [],
          humorous_explanation: "AI解析结果格式异常，请重试",
          options_analysis: [],
        };
      }

      res.json({ analysis });
    } catch (error: any) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: "AI解析失败，请稍后重试" });
    }
  });

  app.post("/api/knowledge-graph", async (req, res) => {
    try {
      const { knowledgePoints } = req.body;
      if (!knowledgePoints || !knowledgePoints.length) {
        return res.status(400).json({ error: "缺少知识点数据" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${KNOWLEDGE_GRAPH_PROMPT}\n\n知识点列表：\n${knowledgePoints.join("\n")}`,
              },
            ],
          },
        ],
        config: { maxOutputTokens: 8192 },
      });

      const text = response.text || "";
      let graphData;
      try {
        const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        graphData = JSON.parse(cleaned);
      } catch {
        graphData = {
          nodes: knowledgePoints.map((kp: string, i: number) => ({
            name: kp,
            category: i % 3,
          })),
          links: [],
          categories: [{ name: "基础" }, { name: "进阶" }, { name: "综合" }],
          summary: "知识点关联分析生成失败，请重试。",
        };
      }

      res.json(graphData);
    } catch (error: any) {
      console.error("Knowledge graph error:", error);
      res.status(500).json({ error: "知识图谱生成失败，请稍后重试" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { history, questionImageBase64, questionAnalysis } = req.body;
      if (!history || !Array.isArray(history) || history.length === 0) {
        return res.status(400).json({ error: "缺少对话历史" });
      }

      const systemPrompt = CHAT_SYSTEM_PROMPT.replace("{ANALYSIS}", questionAnalysis || "暂无解析");

      const maxHistory = 20;
      const trimmedHistory = history.slice(-maxHistory);

      const contents: any[] = [];

      const contextParts: any[] = [{ text: systemPrompt }];
      if (questionImageBase64) {
        const { data, mimeType } = extractBase64(questionImageBase64);
        contextParts.push({ inlineData: { data, mimeType } });
      }

      let contextInjected = false;
      for (let i = 0; i < trimmedHistory.length; i++) {
        const msg = trimmedHistory[i];
        const parts: any[] = [];

        if (!contextInjected && msg.role === "user") {
          parts.push(...contextParts);
          contextInjected = true;
        }

        if (msg.text) {
          parts.push({ text: msg.text });
        }

        if (msg.imageBase64) {
          const { data, mimeType } = extractBase64(msg.imageBase64);
          parts.push({ inlineData: { data, mimeType } });
        }

        if (parts.length > 0) {
          contents.push({ role: msg.role, parts });
        }
      }

      if (!contextInjected) {
        contents.unshift({ role: "user", parts: [...contextParts, { text: "请分析这道题目" }] });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: { maxOutputTokens: 4096 },
      });

      const reply = response.text || "抱歉，我暂时无法回答这个问题，请稍后重试。";
      res.json({ reply });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "AI回复失败，请稍后重试" });
    }
  });

  return httpServer;
}
