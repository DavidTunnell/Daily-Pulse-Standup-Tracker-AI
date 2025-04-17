import { users, type User, type InsertUser, standups, type Standup, type InsertStandup } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createStandup(standup: InsertStandup): Promise<Standup>;
  getAllStandups(): Promise<Standup[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private standups: Map<number, Standup>;
  currentUserId: number;
  currentStandupId: number;

  constructor() {
    this.users = new Map();
    this.standups = new Map();
    this.currentUserId = 1;
    this.currentStandupId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createStandup(insertStandup: InsertStandup): Promise<Standup> {
    const id = this.currentStandupId++;
    const createdAt = new Date();
    const standup: Standup = { 
      ...insertStandup, 
      id, 
      createdAt,
      highlights: insertStandup.highlights || null
    };
    this.standups.set(id, standup);
    return standup;
  }

  async getAllStandups(): Promise<Standup[]> {
    return Array.from(this.standups.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
}

export const storage = new MemStorage();
