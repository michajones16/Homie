import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth FIRST
  await setupAuth(app);
  registerAuthRoutes(app);

  // === Goals Routes ===
  app.get(api.goals.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const goals = await storage.getGoals(userId);
    res.json(goals);
  });

  app.post(api.goals.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.goals.create.input.parse(req.body);
      const userId = req.user.claims.sub;
      const goal = await storage.createGoal({ ...input, userId });
      res.status(201).json(goal);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
        return;
      }
      throw err;
    }
  });

  app.patch(api.goals.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.goals.update.input.parse(req.body);
      
      // Verify ownership
      const goal = await storage.getGoal(id);
      if (!goal || goal.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Goal not found" });
      }

      const updated = await storage.updateGoal(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
        return;
      }
      throw err;
    }
  });

  app.delete(api.goals.delete.path, isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const goal = await storage.getGoal(id);
    if (!goal || goal.userId !== req.user.claims.sub) {
      return res.status(404).json({ message: "Goal not found" });
    }
    await storage.deleteGoal(id);
    res.status(204).send();
  });

  app.post(api.goals.generateDefaults.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const existingGoals = await storage.getGoals(userId);
    
    if (existingGoals.length > 0) {
      return res.status(200).json({ message: "Goals already exist", count: existingGoals.length });
    }

    const defaultGoals = [
      { category: "Credit", title: "Get a credit card", targetValue: "1" },
      { category: "Credit", title: "Increase credit score to 700", targetValue: "700" },
      { category: "Savings", title: "Save $15,000 for down payment", targetValue: "15000" },
      { category: "Govt Assistance", title: "Apply for first-time homebuyer grant" },
      { category: "Location Research", title: "Choose top 3 target neighborhoods" },
      { category: "Tour Homes", title: "Schedule first tour" }
    ];

    for (const goal of defaultGoals) {
      await storage.createGoal({
        userId,
        category: goal.category,
        title: goal.title,
        targetValue: goal.targetValue || null,
        isCompleted: false,
        currentValue: "0"
      });
    }

    res.status(201).json({ message: "Default goals generated", count: defaultGoals.length });
  });

  // === User Settings Routes ===
  app.get(api.userSettings.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const settings = await storage.getUserSettings(userId);
    if (!settings) {
      // Create default if not exists
      const newSettings = await storage.createUserSettings({ userId });
      return res.json(newSettings);
    }
    res.json(settings);
  });

  app.patch(api.userSettings.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.userSettings.update.input.parse(req.body);
      const userId = req.user.claims.sub;
      const updated = await storage.updateUserSettings(userId, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
        return;
      }
      throw err;
    }
  });

  // === Resources Routes ===
  app.get(api.resources.list.path, async (_req, res) => {
    const resources = await storage.getResources();
    res.json(resources);
  });

  app.get(api.resources.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const resource = await storage.getResource(id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    res.json(resource);
  });

  // Seed Resources (can be called on server start if empty)
  await seedResources();

  return httpServer;
}

async function seedResources() {
  const existing = await storage.getResources();
  if (existing.length === 0) {
    const defaultResources = [
      {
        title: "Getting Started",
        description: "When you don't even know what questions to ask yet.",
        category: "Basics",
        content: "Buying a home is a big step. Start by assessing your financial health, understanding the market, and knowing your needs vs. wants.",
        imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Loans, Mortgages & Assistance Programs",
        description: "Find the right support for your situation.",
        category: "Finance",
        content: "Explore FHA loans, VA loans, and conventional mortgages. Check if you qualify for down payment assistance programs in your state.",
        imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Credit Score Basics",
        description: "How to improve your score before applying.",
        category: "Credit",
        content: "Pay down debt, avoid new credit inquiries, and check your credit report for errors. A higher score can save you thousands in interest.",
        imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      }
    ];

    for (const res of defaultResources) {
      await storage.createResource(res);
    }
    console.log("Seeded default resources");
  }
}
