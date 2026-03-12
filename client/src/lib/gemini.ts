import { apiRequest } from "./queryClient";

export async function analyzeQuestionImage(imageBase64: string): Promise<string> {
  const res = await apiRequest("POST", "/api/analyze", { imageBase64 });
  const data = await res.json();
  return JSON.stringify(data.analysis);
}

export async function generateKnowledgeSummary(knowledgePoints: string[]): Promise<{
  nodes: { name: string; category: number }[];
  links: { source: string; target: string }[];
  categories: { name: string }[];
  summary: string;
}> {
  const res = await apiRequest("POST", "/api/knowledge-graph", { knowledgePoints });
  return res.json();
}

export interface ChatHistoryItem {
  role: "user" | "model";
  text: string;
  imageBase64?: string;
}

export async function chatWithQuestion(
  history: ChatHistoryItem[],
  questionImageBase64: string,
  questionAnalysis: string
): Promise<string> {
  const res = await apiRequest("POST", "/api/chat", {
    history,
    questionImageBase64,
    questionAnalysis,
  });
  const data = await res.json();
  return data.reply;
}
