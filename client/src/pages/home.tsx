import { useState } from "react";
import { MapView } from "@/components/map-view";
import { ChatOverlay } from "@/components/chat-overlay";
import { LoadScript } from "@react-google-maps/api";

// Explicitly type the libraries array to match the expected type
const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

interface Marker {
  position: { lat: number; lng: number };
  label: string;
  title: string;
}

export default function Home() {
  const [currentLocation, setCurrentLocation] = useState({
    lat: 40.7128,
    lng: -74.0060,
  });
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string>();

  const handlePoiClick = (pois: any[], selectedIndex?: number) => {
    if (!pois || !Array.isArray(pois)) return;

    // Clear previous markers and selected marker
    setMarkers([]);
    setSelectedMarkerId(undefined);

    const newMarkers = pois.map((poi, index) => {
      if (!poi.coordinates || typeof poi.coordinates.lat !== 'number' || typeof poi.coordinates.lng !== 'number') {
        console.warn('Invalid coordinates for POI:', poi);
        return null;
      }

      return {
        position: {
          lat: poi.coordinates.lat,
          lng: poi.coordinates.lng
        },
        label: (index + 1).toString(),
        title: poi.name
      };
    }).filter(Boolean) as Marker[];

    // Set new markers and selected marker
    setMarkers(newMarkers);
    if (typeof selectedIndex === 'number') {
      setSelectedMarkerId(selectedIndex.toString());
    }
  };

  const handleClearChat = () => {
    // Clear markers and selected marker
    setMarkers([]);
    setSelectedMarkerId(undefined);
  };

  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      libraries={libraries}
    >
      <div className="relative h-screen">
        <MapView 
          onLocationChange={setCurrentLocation} 
          markers={markers}
          selectedMarkerId={selectedMarkerId}
        />
        <ChatOverlay 
          currentLocation={currentLocation} 
          onPoiClick={handlePoiClick}
          onClearChat={handleClearChat}
        />
      </div>
    </LoadScript>
  );
}