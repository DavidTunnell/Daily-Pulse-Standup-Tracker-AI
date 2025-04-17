import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Standup schema
export const standups = pgTable("standups", {
  id: serial("id").primaryKey(),
  yesterday: text("yesterday").notNull(),
  today: text("today").notNull(),
  blockers: text("blockers").notNull(),
  highlights: text("highlights"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStandupSchema = createInsertSchema(standups).pick({
  yesterday: true,
  today: true,
  blockers: true,
  highlights: true,
});

export type InsertStandup = z.infer<typeof insertStandupSchema>;
export type Standup = typeof standups.$inferSelect;
