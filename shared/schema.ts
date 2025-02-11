import { pgTable, text, serial, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  response: text("response").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  location: json("location").$type<{
    lat: number;
    lng: number;
    address?: string;
  }>().notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Create a more specific schema with proper validation
const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  address: z.string().optional(),
});

export const insertChatSchema = z.object({
  message: z.string().min(1),
  response: z.string(),
  systemPrompt: z.string(),
  location: locationSchema,
});

export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chats.$inferSelect;
