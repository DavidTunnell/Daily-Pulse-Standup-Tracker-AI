import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStandupSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import { analyzeStandup, generatePromptSuggestions } from "./openai";

// Middleware to check if user is authenticated
const ensureAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Register API routes
  app.post("/api/standups", ensureAuthenticated, async (req, res) => {
    try {
      // Include the userId from the authenticated user
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const standup = {
        ...req.body,
        userId: req.user.id
      };
      
      const validatedData = insertStandupSchema.parse(standup);
      const createdStandup = await storage.createStandup(validatedData);
      res.status(201).json(createdStandup);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error("Error creating standup:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Get all standups
  app.get("/api/standups", ensureAuthenticated, async (req, res) => {
    try {
      const standups = await storage.getAllStandups();
      res.json(standups);
    } catch (error) {
      console.error("Error retrieving standups:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update a standup
  app.put("/api/standups/:id", ensureAuthenticated, async (req, res) => {
    try {
      const standupId = parseInt(req.params.id);
      if (isNaN(standupId)) {
        return res.status(400).json({ message: "Invalid standup ID" });
      }
      
      // Get the standup to verify ownership
      const existingStandup = await storage.getStandupById(standupId);
      if (!existingStandup) {
        return res.status(404).json({ message: "Standup not found" });
      }
      
      // Check if the user is the owner of the standup
      if (existingStandup.userId !== req.user!.id) {
        return res.status(403).json({ message: "You can only edit your own standups" });
      }
      
      const standup = {
        ...req.body,
        id: standupId,
        userId: req.user!.id // Ensure the userId remains the same
      };
      
      const validatedData = insertStandupSchema.parse(standup);
      const updatedStandup = await storage.updateStandup(standupId, validatedData);
      res.json(updatedStandup);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error("Error updating standup:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  // Delete a standup
  app.delete("/api/standups/:id", ensureAuthenticated, async (req, res) => {
    try {
      const standupId = parseInt(req.params.id);
      if (isNaN(standupId)) {
        return res.status(400).json({ message: "Invalid standup ID" });
      }
      
      // Get the standup to verify ownership
      const existingStandup = await storage.getStandupById(standupId);
      if (!existingStandup) {
        return res.status(404).json({ message: "Standup not found" });
      }
      
      // Check if the user is the owner of the standup
      if (existingStandup.userId !== req.user!.id) {
        return res.status(403).json({ message: "You can only delete your own standups" });
      }
      
      await storage.deleteStandup(standupId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting standup:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Analyze standups with OpenAI
  app.post("/api/analyze", ensureAuthenticated, async (req, res) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key is not configured" });
      }

      const { prompt } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Get standups data for analysis
      const standups = await storage.getAllStandups();
      if (!standups.length) {
        return res.status(400).json({ message: "No standup data available for analysis" });
      }

      const analysis = await analyzeStandup(standups, prompt);
      res.json({ analysis });
    } catch (error) {
      console.error("Error analyzing standups:", error);
      res.status(500).json({ message: "Failed to analyze standups" });
    }
  });

  // Generate prompt suggestions based on existing standups
  app.get("/api/prompt-suggestions", ensureAuthenticated, async (req, res) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key is not configured" });
      }

      // Get standups data for generating suggestions
      const standups = await storage.getAllStandups();
      if (!standups.length) {
        return res.json({ suggestions: [] });
      }

      const suggestions = await generatePromptSuggestions(standups);
      res.json({ suggestions });
    } catch (error) {
      console.error("Error generating prompt suggestions:", error);
      res.status(500).json({ message: "Failed to generate prompt suggestions" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
