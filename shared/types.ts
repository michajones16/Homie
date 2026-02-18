import { z } from "zod";

// ============================================
// CLIENT-SAFE TYPES & SCHEMAS
// No Drizzle or server-only imports allowed here.
// ============================================

// ---------- User ----------

export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// ---------- Goal ----------

export interface Goal {
  id: number;
  userId: string;
  category: string;
  title: string;
  description: string | null;
  isCompleted: boolean | null;
  targetDate: string | null;
  completedAt: string | null;
  targetValue: string | null;
  currentValue: string | null;
}

export const insertGoalSchema = z.object({
  userId: z.string(),
  category: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  isCompleted: z.boolean().optional(),
  targetDate: z.string().optional().nullable(),
  targetValue: z.string().optional().nullable(),
  currentValue: z.string().optional().nullable(),
});

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type CreateGoalRequest = InsertGoal;
export type UpdateGoalRequest = Partial<InsertGoal>;

// ---------- User Settings (maps to plan table) ----------

export interface UserSettings {
  id: number;
  userId: string;
  currentSavings: string;
  monthlySavingsTarget: string;
  targetPurchaseDate: string | null;
  targetPriceMin: string;
  targetPriceMax: string;
  onboardingCompleted: boolean;
}

export const insertUserSettingsSchema = z.object({
  userId: z.string(),
  currentSavings: z.string().optional().default("0"),
  targetPurchaseDate: z.string().optional().nullable(),
  targetPriceMin: z.string().optional().default("0"),
  targetPriceMax: z.string().optional().default("0"),
  monthlySavingsTarget: z.string().optional().default("0"),
  onboardingCompleted: z.boolean().optional().default(false),
});

export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UpdateUserSettingsRequest = Partial<InsertUserSettings>;

// ---------- Resource ----------

export interface Resource {
  id: number;
  title: string;
  description: string;
  content: string | null;
  category: string;
  imageUrl: string | null;
  readTimeMinutes: number | null;
}

// ---------- Response aliases ----------

export type GoalResponse = Goal;
export type UserSettingsResponse = UserSettings;
export type ResourceResponse = Resource;
