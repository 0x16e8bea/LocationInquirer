import OpenAI from "openai";
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
const envPath = '/Users/mikkelmogensen/Desktop/Project/LocationInquirer/.env';
console.log('Loading OpenAI env from:', envPath);
dotenv.config({ path: envPath });

if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is missing. Please check your .env file.');
}

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
            - coordinates: { lat: number, lng: number } If there's a geometry.location in the places info, use those exact coordinates
           - fun_fact: An interesting fact about the area (if available)

          Important: For points_of_interest, use ONLY the places from the places info, and ensure you include their exact coordinates from the geometry.location field.`,
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
      const parsed = JSON.parse(content);
      console.log('OpenAI Response:', parsed); // Debug log
      return parsed;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      throw new Error("Invalid response format from OpenAI");
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to generate response: ${errorMessage}`);
  }
}