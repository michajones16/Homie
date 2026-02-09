import { pgTable, text, serial, integer, boolean, timestamp, date, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth"; // Import users to reference in relations if needed, though we mainly use userId string

export * from "./models/auth";

// === TABLE DEFINITIONS ===

// Goals / Checklist Items
// Combined because the screenshots show goals acting as checklist items (e.g., "Get a credit card" is a goal and a checkbox)
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // References users.id from auth
  category: text("category").notNull(), // 'Credit', 'Savings', 'Govt Assistance', 'Location Research', 'Tour Homes'
  title: text("title").notNull(),
  description: text("description"),
  isCompleted: boolean("is_completed").default(false),
  targetDate: date("target_date"), // YYYY-MM-DD
  completedAt: timestamp("completed_at"),
  
  // Specific fields for certain goal types
  targetValue: numeric("target_value"), // e.g. 700 for credit score, 15000 for savings
  currentValue: numeric("current_value"), // Tracking progress
});

// User Profile Extensions (things not in the base auth user table)
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(), // One-to-one with users table
  
  // Financial Profile
  currentSavings: numeric("current_savings").default('0'),
  targetPurchaseDate: date("target_purchase_date"),
  targetPriceMin: numeric("target_price_min").default('0'),
  targetPriceMax: numeric("target_price_max").default('0'),
  monthlySavingsTarget: numeric("monthly_savings_target").default('0'),
  
  // App State
  onboardingCompleted: boolean("onboarding_completed").default(false),
});

// Resources / Educational Content
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content"), // Markdown content
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  readTimeMinutes: integer("read_time_minutes"),
});


// === BASE SCHEMAS ===
export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, completedAt: true });
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true });
export const insertResourceSchema = createInsertSchema(resources).omit({ id: true });


// === EXPLICIT API CONTRACT TYPES ===

// Goals
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type CreateGoalRequest = InsertGoal;
export type UpdateGoalRequest = Partial<InsertGoal>;

// User Settings
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UpdateUserSettingsRequest = Partial<InsertUserSettings>;

// Resources
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

// Responses
export type GoalResponse = Goal;
export type UserSettingsResponse = UserSettings;
export type ResourceResponse = Resource;
