import Dexie, { type Table } from "dexie";
import { v4 as uuidv4 } from "uuid";

export interface Directory {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
}

export interface OptionAnalysis {
  option: string;
  is_correct: boolean;
  related_knowledge: string;
  why_wrong: string;
}

export interface AnalysisJson {
  question_text: string;
  knowledge_points: string[];
  humorous_explanation: string;
  options_analysis: OptionAnalysis[];
}

export type QuestionStatus = "none" | "mastered" | "review";

export interface Question {
  id: string;
  directoryId: string;
  imageBase64: string;
  analysisJson: string;
  createdAt: number;
  status?: QuestionStatus;
}

class ErrorBookDB extends Dexie {
  directories!: Table<Directory, string>;
  questions!: Table<Question, string>;

  constructor() {
    super("SmartErrorBook");
    this.version(1).stores({
      directories: "id, name, parentId, createdAt",
      questions: "id, directoryId, createdAt",
    });
    this.version(2).stores({
      directories: "id, name, parentId, createdAt",
      questions: "id, directoryId, createdAt, status",
    }).upgrade((tx) => {
      return tx.table("questions").toCollection().modify((q) => {
        if (!q.status) q.status = "none";
      });
    });
  }
}

export const db = new ErrorBookDB();

export function generateId(): string {
  return uuidv4();
}
