import { users, type User, type InsertUser, AppAnalysis, InsertAppAnalysis } from "@shared/schema";

// Storage interface with CRUD methods
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // App analysis methods
  createAppAnalysis(data: InsertAppAnalysis): Promise<AppAnalysis>;
  getAppAnalysis(id: number): Promise<AppAnalysis | undefined>;
  getAppAnalysisHistory(): Promise<AppAnalysis[]>;
  clearAppAnalysisHistory(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private appAnalyses: Map<number, AppAnalysis>;
  private userCurrentId: number;
  private analysisCurrentId: number;

  constructor() {
    this.users = new Map();
    this.appAnalyses = new Map();
    this.userCurrentId = 1;
    this.analysisCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // App analysis methods
  async createAppAnalysis(data: InsertAppAnalysis): Promise<AppAnalysis> {
    const id = this.analysisCurrentId++;
    const now = new Date();
    
    const analysis: AppAnalysis = {
      ...data,
      id,
      createdAt: now
    };
    
    this.appAnalyses.set(id, analysis);
    return analysis;
  }

  async getAppAnalysis(id: number): Promise<AppAnalysis | undefined> {
    return this.appAnalyses.get(id);
  }

  async getAppAnalysisHistory(): Promise<AppAnalysis[]> {
    return Array.from(this.appAnalyses.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async clearAppAnalysisHistory(): Promise<void> {
    this.appAnalyses.clear();
  }
}

export const storage = new MemStorage();
