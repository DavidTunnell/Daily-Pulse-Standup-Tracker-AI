import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStandupSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import { analyzeStandup, generatePromptSuggestions } from "./openai";
import { analyzeStandupWithBedrock, generatePromptSuggestionsWithBedrock } from "./bedrock";

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

  // Analyze standups with AWS Bedrock (Claude)
  app.post("/api/analyze", ensureAuthenticated, async (req, res) => {
    try {
      // Check AWS credentials
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        return res.status(500).json({ message: "AWS credentials are not configured" });
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

      const analysis = await analyzeStandupWithBedrock(standups, prompt);
      res.json({ analysis });
    } catch (error) {
      console.error("Error analyzing standups:", error);
      
      // Pass more specific error messages to the client
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze standups";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Generate prompt suggestions based on existing standups using AWS Bedrock
  app.get("/api/prompt-suggestions", ensureAuthenticated, async (req, res) => {
    try {
      // Check AWS credentials
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        return res.status(500).json({ message: "AWS credentials are not configured" });
      }

      // Get standups data for generating suggestions
      const standups = await storage.getAllStandups();
      if (!standups.length) {
        return res.json({ suggestions: [] });
      }

      const suggestions = await generatePromptSuggestionsWithBedrock(standups);
      res.json({ suggestions });
    } catch (error) {
      console.error("Error generating prompt suggestions:", error);
      
      // Fall back to default suggestions if there's an error
      const defaultSuggestions = [
        "What are the recurring blockers in my team's standups?",
        "What trends do you see in our daily work?",
        "Summarize the main achievements from the past week",
        "What areas should our team focus on based on recent standups?",
        "Identify any potential risks or issues from our recent standups"
      ];
      
      res.json({ suggestions: defaultSuggestions });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
