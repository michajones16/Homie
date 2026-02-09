import { db } from "./db";
import {
  goals, userSettings, resources,
  type Goal, type InsertGoal, type UpdateGoalRequest,
  type UserSettings, type InsertUserSettings, type UpdateUserSettingsRequest,
  type Resource, type InsertResource
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Goals
  getGoals(userId: string): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, updates: UpdateGoalRequest): Promise<Goal>;
  deleteGoal(id: number): Promise<void>;
  
  // User Settings
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  updateUserSettings(userId: string, settings: UpdateUserSettingsRequest): Promise<UserSettings>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;

  // Resources
  getResources(): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
}

export class DatabaseStorage implements IStorage {
  // Goals
  async getGoals(userId: string): Promise<Goal[]> {
    return await db.select().from(goals).where(eq(goals.userId, userId));
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal;
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }

  async updateGoal(id: number, updates: UpdateGoalRequest): Promise<Goal> {
    const [updated] = await db.update(goals)
      .set(updates)
      .where(eq(goals.id, id))
      .returning();
    return updated;
  }

  async deleteGoal(id: number): Promise<void> {
    await db.delete(goals).where(eq(goals.id, id));
  }

  // User Settings
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }

  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const [newSettings] = await db.insert(userSettings).values(settings).returning();
    return newSettings;
  }

  async updateUserSettings(userId: string, updates: UpdateUserSettingsRequest): Promise<UserSettings> {
    // Check if settings exist, if not create them
    const existing = await this.getUserSettings(userId);
    if (!existing) {
      return this.createUserSettings({ ...updates, userId } as InsertUserSettings);
    }
    
    const [updated] = await db.update(userSettings)
      .set(updates)
      .where(eq(userSettings.userId, userId))
      .returning();
    return updated;
  }

  // Resources
  async getResources(): Promise<Resource[]> {
    return await db.select().from(resources);
  }

  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db.insert(resources).values(resource).returning();
    return newResource;
  }
}

export const storage = new DatabaseStorage();
