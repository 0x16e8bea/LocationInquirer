import { chats, type Chat, type InsertChat } from "@shared/schema";

export interface IStorage {
  getChats(): Promise<Chat[]>;
  createChat(chat: InsertChat): Promise<Chat>;
  clearChats(): Promise<void>;
}

export class MemStorage implements IStorage {
  private chats: Map<number, Chat>;
  private currentId: number;

  constructor() {
    this.chats = new Map();
    this.currentId = 1;
  }

  async getChats(): Promise<Chat[]> {
    return Array.from(this.chats.values());
  }

  async createChat(insertChat: InsertChat): Promise<Chat> {
    const id = this.currentId++;
    const chat: Chat = {
      ...insertChat,
      id,
      timestamp: new Date(),
      location: {
        lat: insertChat.location.lat,
        lng: insertChat.location.lng,
        address: insertChat.location.address,
      },
    };
    this.chats.set(id, chat);
    return chat;
  }

  async clearChats(): Promise<void> {
    this.chats.clear();
    this.currentId = 1;
  }
}

export const storage = new MemStorage();