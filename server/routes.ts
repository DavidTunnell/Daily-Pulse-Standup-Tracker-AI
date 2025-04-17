import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStandupSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

// Create Bedrock client
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

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

  // Amazon Bedrock Claude 3.5 AI Endpoint
  app.post("/api/analyze-standups", ensureAuthenticated, async (req, res) => {
    try {
      const { prompt, standups } = req.body;
      
      if (!prompt || !standups || !Array.isArray(standups)) {
        return res.status(400).json({ message: "Invalid request. Prompt and standups array are required." });
      }
      
      // Format standups data for Claude
      const standupsData = standups.map(standup => {
        const date = standup.standupDate ? new Date(standup.standupDate).toLocaleDateString() : "No date";
        return `
Date: ${date}
Yesterday: ${standup.yesterday}
Today: ${standup.today}
Blockers: ${standup.blockers}
Highlights: ${standup.highlights || "None"}
        `.trim();
      }).join("\n\n---\n\n");
      
      // Prepare the message for Claude
      const message = `
You are analyzing daily standup data for a software development team. 
I'll provide you with standup entries, each with information about:
- What was completed yesterday
- What is planned for today
- Any blockers
- Any highlights or wins

Here's the standup data:

${standupsData}

User's question/request: ${prompt}

Please provide a detailed and insightful analysis based on the user's request.
`.trim();

      // Call Claude 3.5 Sonnet via Amazon Bedrock
      const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: message
              }
            ]
          }
        ],
        temperature: 0.7
      };

      const command = new InvokeModelCommand({
        modelId: "anthropic.claude-3-sonnet", // Standard model ID format for AWS Bedrock
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(payload)
      });

      const response = await bedrockClient.send(command);
      const responseBody = new TextDecoder().decode(response.body);
      const parsedResponse = JSON.parse(responseBody);

      res.json({ 
        analysis: parsedResponse.content[0].text 
      });
    } catch (error) {
      console.error("Error analyzing standups with Claude:", error);
      res.status(500).json({ 
        message: "Error analyzing standups", 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
