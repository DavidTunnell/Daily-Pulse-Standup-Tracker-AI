import { pgTable, text, serial, integer, boolean, timestamp, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  jiraProfileId: text("jira_profile_id"),
  avatar: text("avatar"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  jiraProfileId: true,
  avatar: true,
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
export type StandupWithUsername = Standup & { 
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
};

// Weekend Stories schema
export const weekendStories = pgTable("weekend_stories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  description: text("story").notNull(), // Using the 'story' column from database
  images: text("image_urls").array(), // Using the 'image_urls' column which is a text ARRAY
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWeekendStorySchema = createInsertSchema(weekendStories).pick({
  userId: true,
  description: true,
  images: true,
});

export type InsertWeekendStory = z.infer<typeof insertWeekendStorySchema>;
export type WeekendStory = typeof weekendStories.$inferSelect;
export type WeekendStoryWithUsername = WeekendStory & { 
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
};

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

export const weekendStoriesRelations = relations(weekendStories, ({ one }) => ({
  user: one(users, {
    fields: [weekendStories.userId],
    references: [users.id],
  }),
}));
