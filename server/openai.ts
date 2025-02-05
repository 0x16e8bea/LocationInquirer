import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateLocationResponse(message: string, location: { lat: number; lng: number; address?: string }) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant for location-based queries. The user is looking at ${location.address || `coordinates (${location.lat}, ${location.lng})`}. 
          Provide relevant information about this location based on the user's query. Format your response as a JSON object with these fields:
          - description: A detailed response to the user's query about the location
          - points_of_interest: Notable places or features nearby (if relevant)
          - fun_fact: An interesting fact about the area (if available)`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      throw new Error("Invalid response format from OpenAI");
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to generate response: ${errorMessage}`);
  }
}