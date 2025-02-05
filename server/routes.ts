import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateLocationResponse } from "./openai";
import { insertChatSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  app.get("/api/chats", async (_req, res) => {
    const chats = await storage.getChats();
    res.json(chats);
  });

  app.post("/api/chat", async (req, res) => {
    const result = insertChatSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    try {
      const aiResponse = await generateLocationResponse(
        result.data.message,
        {
          lat: result.data.location.lat,
          lng: result.data.location.lng,
          address: result.data.location.address,
        }
      );

      const chat = await storage.createChat({
        ...result.data,
        response: JSON.stringify(aiResponse),
      });

      res.json(chat);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  });

  return createServer(app);
}