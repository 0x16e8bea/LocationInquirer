import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertChatSchema, type Chat } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Loader2, Trash2 } from "lucide-react";
import React from "react";

interface ChatOverlayProps {
  currentLocation: { lat: number; lng: number };
  onPoiClick: (pois: any[], selectedIndex?: number) => void;
  onClearChat: () => void;
}

export function ChatOverlay({ currentLocation, onPoiClick, onClearChat }: ChatOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(insertChatSchema),
    defaultValues: {
      message: "",
      response: "",
      location: currentLocation,
    },
  });

  const { data: chats = [], isLoading } = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
  });

  const chatMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      try {
        const response = await apiRequest("POST", "/api/chat", {
          ...data,
          response: "",
          location: currentLocation,
        });
        return response.json();
      } catch (error) {
        console.error('Chat mutation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      form.reset();
    },
    onError: (error) => {
      console.error('Chat mutation error:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatResponse = (response: string, chatId: number) => {
    try {
      const parsed = JSON.parse(response);
      return Object.entries(parsed)
        .map(([key, value]) => {
          if (key === 'points_of_interest' && Array.isArray(value)) {
            return `Points of Interest:\n${value.map((poi: any, index: number) => 
              `- <button class="text-left text-blue-600 hover:underline" data-poi-index="${index}" data-chat-id="${chatId}">${index + 1}. ${poi.name}: ${poi.description}</button>`
            ).join('\n')}`;
          }
          return `${key}: ${value}`;
        })
        .join('\n\n');
    } catch (error) {
      console.error('Response parsing error:', error);
      return response;
    }
  };

  // Add click event listener for POI buttons
  useEffect(() => {
    const handlePOIClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest('button');
      if (!button || !button.hasAttribute('data-poi-index') || !button.hasAttribute('data-chat-id')) return;
      
      const index = parseInt(button.getAttribute('data-poi-index') || '0', 10);
      const chatId = parseInt(button.getAttribute('data-chat-id') || '0', 10);
      
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        try {
          const parsed = JSON.parse(chat.response);
          if (parsed.points_of_interest && Array.isArray(parsed.points_of_interest)) {
            const pois = parsed.points_of_interest.map((poi: any) => ({
              ...poi,
              coordinates: poi.coordinates || { 
                lat: poi.geometry?.location?.lat,
                lng: poi.geometry?.location?.lng
              }
            }));
            onPoiClick(pois, index);
          }
        } catch (error) {
          console.error('Error parsing chat response:', error);
        }
      }
    };

    document.addEventListener('click', handlePOIClick);
    return () => document.removeEventListener('click', handlePOIClick);
  }, [chats, onPoiClick]);

  const handleClearChat = async () => {
    try {
      await apiRequest("DELETE", "/api/chats");
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      onClearChat();
      toast({
        title: "Chat cleared",
        description: "Chat history has been cleared.",
      });
    } catch (error) {
      console.error('Clear chat error:', error);
      toast({
        title: "Error",
        description: "Failed to clear chat history. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 bg-white/90 backdrop-blur transition-all duration-200 shadow-lg">
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="font-semibold text-lg">Location Assistant</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearChat}
            title="Clear chat history"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <>
          <ScrollArea className="h-[400px] p-4">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              chats.map((chat: Chat) => (
                <div key={chat.id} className="mb-4">
                  <p className="bg-primary/10 rounded-lg p-2 mb-2">
                    {chat.message}
                  </p>
                  <div 
                    className="bg-secondary/10 rounded-lg p-2 whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: formatResponse(chat.response, chat.id) }}
                  />
                </div>
              ))
            )}
          </ScrollArea>

          <form
            onSubmit={form.handleSubmit((data) => chatMutation.mutate(data))}
            className="p-4 border-t flex gap-2"
          >
            <Input
              {...form.register("message")}
              placeholder="Ask about this location..."
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={chatMutation.isPending}
            >
              {chatMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Send"
              )}
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}