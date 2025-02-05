import { useState } from "react";
import { MapView } from "@/components/map-view";
import { ChatOverlay } from "@/components/chat-overlay";
import { LoadScript } from "@react-google-maps/api";

// Explicitly type the libraries array to match the expected type
const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export default function Home() {
  const [currentLocation, setCurrentLocation] = useState({
    lat: 40.7128,
    lng: -74.0060,
  });

  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      libraries={libraries}
    >
      <div className="relative h-screen">
        <MapView onLocationChange={setCurrentLocation} />
        <ChatOverlay currentLocation={currentLocation} />
      </div>
    </LoadScript>
  );
}