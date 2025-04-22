import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  jiraProfileId: text("jira_profile_id"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  jiraProfileId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Standup schema
export const standups = pgTable("standups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  yesterday: text("yesterday").notNull(),
  today: text("today").notNull(),
  blockers: text("blockers"),
  highlights: text("highlights"),
  standupDate: date("standup_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStandupSchema = createInsertSchema(standups).pick({
  userId: true,
  yesterday: true,
  today: true,
  blockers: true,
  highlights: true,
  standupDate: true,
});

export type InsertStandup = z.infer<typeof insertStandupSchema>;
export type Standup = typeof standups.$inferSelect;
export type StandupWithUsername = Standup & { username: string };

// Weekend Stories schema
export const weekendStories = pgTable("weekend_stories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  story: text("story").notNull(),
  imageUrls: text("image_urls").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWeekendStorySchema = createInsertSchema(weekendStories).pick({
  userId: true,
  story: true,
  imageUrls: true,
});

export type InsertWeekendStory = z.infer<typeof insertWeekendStorySchema>;
export type WeekendStory = typeof weekendStories.$inferSelect;
export type WeekendStoryWithUsername = WeekendStory & { username: string };

// Define relations after tables are defined to avoid circular references
export const usersRelations = relations(users, ({ many }) => ({
  standups: many(standups),
  weekendStories: many(weekendStories),
}));

export const standupsRelations = relations(standups, ({ one }) => ({
  user: one(users, {
    fields: [standups.userId],
    references: [users.id],
  }),
}));

// Add relations for weekend stories
export const weekendStoriesRelations = relations(weekendStories, ({ one }) => ({
  user: one(users, {
    fields: [weekendStories.userId],
    references: [users.id],
  }),
}));
