import { 
  users, type User, type InsertUser, 
  standups, type Standup, type InsertStandup, type StandupWithUsername,
  weekendStories, type WeekendStory, type InsertWeekendStory, type WeekendStoryWithUsername 
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

// Interface with CRUD methods
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User>;
  
  // Standup operations
  createStandup(standup: InsertStandup): Promise<Standup>;
  getStandupById(id: number): Promise<Standup | undefined>;
  updateStandup(id: number, standup: InsertStandup): Promise<Standup>;
  deleteStandup(id: number): Promise<void>;
  getAllStandups(): Promise<StandupWithUsername[]>;
  
  // Weekend Stories operations
  createWeekendStory(story: InsertWeekendStory): Promise<WeekendStory>;
  getWeekendStoryById(id: number): Promise<WeekendStory | undefined>;
  updateWeekendStory(id: number, story: InsertWeekendStory): Promise<WeekendStory>;
  deleteWeekendStory(id: number): Promise<void>;
  getAllWeekendStories(): Promise<WeekendStoryWithUsername[]>;
  
  // Session store
  sessionStore: session.Store;
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createStandup(insertStandup: InsertStandup): Promise<Standup> {
    // Ensure highlights is null if not provided
    const dataToInsert = {
      ...insertStandup,
      highlights: insertStandup.highlights || null
    };
    
    const [standup] = await db.insert(standups).values(dataToInsert).returning();
    return standup;
  }

  async getAllStandups(): Promise<StandupWithUsername[]> {
    const result = await db
      .select({
        id: standups.id,
        userId: standups.userId,
        yesterday: standups.yesterday,
        today: standups.today,
        blockers: standups.blockers,
        highlights: standups.highlights,
        standupDate: standups.standupDate,
        createdAt: standups.createdAt,
        username: users.username
      })
      .from(standups)
      .leftJoin(users, eq(standups.userId, users.id))
      .orderBy(desc(standups.createdAt));
      
    // Ensure username is never null (fallback to "Unknown User")
    return result.map(item => ({
      ...item,
      username: item.username || "Unknown User"
    }));
  }
  
  async getStandupById(id: number): Promise<Standup | undefined> {
    const [standup] = await db.select().from(standups).where(eq(standups.id, id));
    return standup;
  }
  
  async updateStandup(id: number, insertStandup: InsertStandup): Promise<Standup> {
    // Ensure highlights is null if not provided
    const dataToUpdate = {
      ...insertStandup,
      highlights: insertStandup.highlights || null
    };
    
    const [standup] = await db
      .update(standups)
      .set(dataToUpdate)
      .where(eq(standups.id, id))
      .returning();
    
    return standup;
  }
  
  async deleteStandup(id: number): Promise<void> {
    await db.delete(standups).where(eq(standups.id, id));
  }

  // Weekend Stories methods
  async createWeekendStory(insertStory: InsertWeekendStory): Promise<WeekendStory> {
    // Ensure images is properly handled
    const dataToInsert = {
      ...insertStory,
      // Convert to proper string[] if needed
      images: Array.isArray(insertStory.images) ? insertStory.images : null
    };
    
    const [story] = await db.insert(weekendStories).values(dataToInsert).returning();
    return story;
  }

  async getAllWeekendStories(): Promise<WeekendStoryWithUsername[]> {
    const result = await db
      .select({
        id: weekendStories.id,
        userId: weekendStories.userId,
        description: weekendStories.description,
        images: weekendStories.images,
        createdAt: weekendStories.createdAt,
        username: users.username
      })
      .from(weekendStories)
      .leftJoin(users, eq(weekendStories.userId, users.id))
      .orderBy(desc(weekendStories.createdAt));
      
    // Ensure username is never null (fallback to "Unknown User")
    return result.map(item => ({
      ...item,
      username: item.username || "Unknown User"
    }));
  }
  
  async getWeekendStoryById(id: number): Promise<WeekendStory | undefined> {
    const [story] = await db.select().from(weekendStories).where(eq(weekendStories.id, id));
    return story;
  }
  
  async updateWeekendStory(id: number, insertStory: InsertWeekendStory): Promise<WeekendStory> {
    // Ensure images is properly handled
    const dataToUpdate = {
      ...insertStory,
      // Convert to proper string[] if needed
      images: Array.isArray(insertStory.images) ? insertStory.images : null
    };
    
    const [story] = await db
      .update(weekendStories)
      .set(dataToUpdate)
      .where(eq(weekendStories.id, id))
      .returning();
    
    return story;
  }
  
  async deleteWeekendStory(id: number): Promise<void> {
    await db.delete(weekendStories).where(eq(weekendStories.id, id));
  }
}

export const storage = new DatabaseStorage();
