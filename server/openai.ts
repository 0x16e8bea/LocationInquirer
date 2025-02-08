import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface Place {
  name: string;
  rating?: number;
  types: string[];
  vicinity: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export async function generateLocationResponse(
  message: string,
  location: {
    lat: number;
    lng: number;
    address?: string;
    places?: Place[];
  }
) {
  try {
    const placesInfo = location.places
      ? `\nNearby places:\n${location.places
          .map(
            (p) =>
              `- ${p.name} (${p.vicinity})${
                p.rating ? ` - Rating: ${p.rating}/5` : ""
              } at coordinates ${p.geometry?.location.lat}, ${p.geometry?.location.lng}`
          )
          .join("\n")}`
      : "";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant for location-based queries. The user is looking at ${
            location.address || `coordinates (${location.lat}, ${location.lng})`
          }.${placesInfo}
          Provide relevant information about this location based on the user's query. Format your response as a JSON object with these fields:
          - description: A detailed response to the user's query about the location
          - points_of_interest: An array of objects containing information about notable nearby places, each with:
            - name: The place name
            - description: Brief description or highlight
            - coordinates: { lat: number, lng: number } (use the exact coordinates provided in the places info)
          - fun_fact: An interesting fact about the area (if available)

          Important: For points_of_interest, use ONLY the places and coordinates provided in the places info.`,
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to generate response: ${errorMessage}`);
  }
}