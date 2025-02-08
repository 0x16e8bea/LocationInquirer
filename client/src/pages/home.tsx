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

  const handlePoiClick = (pois: any[]) => {
    if (!pois || !Array.isArray(pois)) return;

    console.log('Received POIs:', pois); // Debug log

    const newMarkers = pois.map((poi, index) => {
      console.log('Processing POI:', poi); // Debug log
      const coordinates = poi.geometry?.location || poi.coordinates;
      if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
        console.warn('Invalid coordinates for POI:', poi);
        return null;
      }

      return {
        position: {
          lat: coordinates.lat,
          lng: coordinates.lng
        },
        label: (index + 1).toString(),
        title: poi.name
      };
    }).filter(Boolean) as Marker[];

    console.log('Created markers:', newMarkers); // Debug log
    setMarkers(newMarkers);
  };

  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      libraries={libraries}
    >
      <div className="relative h-screen">
        <MapView onLocationChange={setCurrentLocation} markers={markers} />
        <ChatOverlay 
          currentLocation={currentLocation} 
          onPoiClick={handlePoiClick}
        />
      </div>
    </LoadScript>
  );
}