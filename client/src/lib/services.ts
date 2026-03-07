import { db, generateId, type Directory, type Question } from "./db";

export const directoryService = {
  async getAll(): Promise<Directory[]> {
    return db.directories.orderBy("createdAt").toArray();
  },

  async getById(id: string): Promise<Directory | undefined> {
    return db.directories.get(id);
  },

  async getChildren(parentId: string | null): Promise<Directory[]> {
    if (!parentId) return this.getRootDirectories();
    return db.directories.where("parentId").equals(parentId).toArray();
  },

  async getRootDirectories(): Promise<Directory[]> {
    return db.directories.where("parentId").equals("__root__").toArray();
  },

  async getDirectoryPath(id: string): Promise<Directory[]> {
    const path: Directory[] = [];
    let current = await db.directories.get(id);
    while (current) {
      path.unshift(current);
      if (current.parentId && current.parentId !== "__root__") {
        current = await db.directories.get(current.parentId);
      } else {
        break;
      }
    }
    return path;
  },

  async getDepth(parentId: string | null): Promise<number> {
    if (!parentId) return 0;
    let depth = 0;
    let currentId: string | null = parentId;
    while (currentId && currentId !== "__root__") {
      depth++;
      const dir = await db.directories.get(currentId);
      currentId = dir?.parentId || null;
    }
    return depth;
  },

  async create(name: string, parentId: string | null): Promise<Directory> {
    const dir: Directory = {
      id: generateId(),
      name,
      parentId: parentId || "__root__",
      createdAt: Date.now(),
    };
    await db.directories.add(dir);
    return dir;
  },

  async rename(id: string, name: string): Promise<void> {
    await db.directories.update(id, { name });
  },

  async delete(id: string): Promise<void> {
    const children = await db.directories.where("parentId").equals(id).toArray();
    for (const child of children) {
      await this.delete(child.id);
    }
    await db.questions.where("directoryId").equals(id).delete();
    await db.directories.delete(id);
  },

  async getQuestionCount(id: string): Promise<number> {
    let count = await db.questions.where("directoryId").equals(id).count();
    const children = await db.directories.where("parentId").equals(id).toArray();
    for (const child of children) {
      count += await this.getQuestionCount(child.id);
    }
    return count;
  },
};

export const questionService = {
  async getByDirectory(directoryId: string): Promise<Question[]> {
    return db.questions.where("directoryId").equals(directoryId).toArray()
      .then(arr => arr.sort((a, b) => b.createdAt - a.createdAt));
  },

  async getById(id: string): Promise<Question | undefined> {
    return db.questions.get(id);
  },

  async create(directoryId: string, imageBase64: string, analysisJson: string): Promise<Question> {
    const question: Question = {
      id: generateId(),
      directoryId,
      imageBase64,
      analysisJson,
      createdAt: Date.now(),
    };
    await db.questions.add(question);
    return question;
  },

  async delete(id: string): Promise<void> {
    await db.questions.delete(id);
  },

  async deleteMultiple(ids: string[]): Promise<void> {
    await db.questions.bulkDelete(ids);
  },

  async getAll(): Promise<Question[]> {
    return db.questions.toArray().then(arr => arr.sort((a, b) => b.createdAt - a.createdAt));
  },

  async getCount(): Promise<number> {
    return db.questions.count();
  },

  async getRecentQuestions(limit: number): Promise<Question[]> {
    const all = await db.questions.toArray();
    return all.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  },
};
