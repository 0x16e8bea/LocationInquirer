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
import { MessageSquare, Loader2, Trash2, ChevronLeft, ChevronRight, User } from "lucide-react";
import React from "react";

interface Personality {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
}

const personalities: Personality[] = [
  {
    id: 'adventurous',
    name: 'Adventure Seeker',
    description: 'Choose me for thrilling activities and off-the-beaten-path experiences',
    systemPrompt: `You are an adventurous and energetic travel guide who specializes in unique, thrilling experiences. 
    Your recommendations focus on:
    - Off-the-beaten-path locations and hidden gems
    - Outdoor activities and adventure sports
    - Unique and challenging experiences
    - Natural wonders and scenic viewpoints
    - Local adventure spots that tourists might miss
    
    Your personality is enthusiastic and encouraging, always pushing travelers to step out of their comfort zone while ensuring safety. You get excited about sharing adrenaline-pumping activities and unique adventures.`,
  },
  {
    id: 'foodie',
    name: 'Food Explorer',
    description: 'Let me guide you to the best local cuisine and hidden food gems',
    systemPrompt: `You are a passionate food expert and culinary guide with deep knowledge of local cuisines and food culture. 
    Your recommendations focus on:
    - Local delicacies and signature dishes
    - Hidden gem restaurants and food stalls
    - Food markets and culinary experiences
    - Traditional cooking methods and ingredients
    - Food history and cultural significance
    
    Your personality is warm and enthusiastic about food, speaking knowledgeably about ingredients, preparation methods, and the cultural context of dishes. You love sharing insider tips about where locals eat and special menu items to try.`,
  },
  {
    id: 'history',
    name: 'History Buff',
    description: 'Discover the rich history and cultural heritage of places',
    systemPrompt: `You are a knowledgeable historian and cultural expert who brings the past to life through storytelling. 
    Your recommendations focus on:
    - Historical landmarks and architecture
    - Archaeological sites and museums
    - Significant historical events and their locations
    - Cultural heritage sites
    - Hidden historical gems and local legends
    
    Your personality is scholarly but engaging, able to weave fascinating historical narratives that connect the past with the present. You excel at sharing lesser-known historical facts and helping visitors understand the historical context of locations.`,
  },
  {
    id: 'spontaneous',
    name: 'Free Spirit',
    description: 'Go with the flow and discover unexpected delights',
    systemPrompt: `You are a free-spirited and flexible guide who believes in the joy of spontaneous discovery. 
    Your recommendations focus on:
    - Unique and unexpected experiences
    - Pop-up events and temporary exhibitions
    - Local hangout spots and community spaces
    - Quirky and unconventional attractions
    - Opportunities for chance encounters and discoveries
    
    Your personality is laid-back and adaptable, encouraging travelers to embrace serendipity and go where the day takes them. You excel at suggesting flexible itineraries that allow for spontaneous exploration.`,
  },
  {
    id: 'culture',
    name: 'Culture Enthusiast',
    description: 'Experience local traditions, arts, and authentic cultural experiences',
    systemPrompt: `You are a culturally aware guide with deep appreciation for local traditions, arts, and customs. 
    Your recommendations focus on:
    - Traditional ceremonies and festivals
    - Local art galleries and performances
    - Authentic cultural experiences
    - Community gatherings and events
    - Workshops and classes in traditional crafts
    
    Your personality is respectful and insightful, helping visitors understand and appreciate local customs and traditions. You emphasize authentic experiences that provide genuine cultural exchange and understanding.`,
  },
];

interface ChatOverlayProps {
  currentLocation: { lat: number; lng: number };
  onPoiClick: (pois: any[], selectedIndex?: number) => void;
  onClearChat: () => void;
}

export function ChatOverlay({ currentLocation, onPoiClick, onClearChat }: ChatOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedPersonalityIndex, setSelectedPersonalityIndex] = useState(0);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentPersonality = personalities[selectedPersonalityIndex];

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

  const silentClearChat = async () => {
    try {
      await apiRequest("DELETE", "/api/chats");
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      onClearChat();
    } catch (error) {
      console.error('Clear chat error:', error);
    }
  };

  const handlePrevPersonality = () => {
    setSelectedPersonalityIndex((prev) => 
      prev === 0 ? personalities.length - 1 : prev - 1
    );
    silentClearChat();
    setHasStartedChat(false);
  };

  const handleNextPersonality = () => {
    setSelectedPersonalityIndex((prev) => 
      prev === personalities.length - 1 ? 0 : prev + 1
    );
    silentClearChat();
    setHasStartedChat(false);
  };

  const handleReturnToSelection = () => {
    silentClearChat();
    setHasStartedChat(false);
  };

  const form = useForm({
    resolver: zodResolver(insertChatSchema),
    defaultValues: {
      message: "",
      response: "",
      systemPrompt: currentPersonality.systemPrompt,
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
          message: data.message,
          response: "",
          systemPrompt: currentPersonality.systemPrompt,
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
      form.reset({
        message: "",
        response: "",
        systemPrompt: currentPersonality.systemPrompt,
        location: currentLocation,
      });
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

  // Update form defaults when personality or location changes
  useEffect(() => {
    form.reset({
      message: form.getValues("message"),
      response: "",
      systemPrompt: currentPersonality.systemPrompt,
      location: currentLocation,
    });
  }, [currentPersonality, currentLocation, form]);

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

  return (
    <Card className="fixed bottom-4 left-4 w-96 bg-white/90 backdrop-blur transition-all duration-200 shadow-lg">
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
          {!hasStartedChat && chats.length === 0 ? (
            <div className="p-6 flex flex-col items-center gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevPersonality}
                  title="Previous personality"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold">{currentPersonality.name}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextPersonality}
                  title="Next personality"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {currentPersonality.description}
              </p>
              <p className="text-center text-xs text-muted-foreground mt-2">
                Use the arrows to choose your travel guide personality
              </p>
              <Button 
                className="mt-4"
                onClick={() => setHasStartedChat(true)}
              >
                Start Chat
              </Button>
            </div>
          ) : (
            <>
              <div className="p-2 flex items-center justify-between border-b bg-primary/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{currentPersonality.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReturnToSelection}
                  className="text-xs"
                >
                  Change Guide
                </Button>
              </div>
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
            </>
          )}

          {hasStartedChat && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit((data) => chatMutation.mutate(data))(e);
              }}
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
          )}
        </>
      )}
    </Card>
  );
}