import { useEffect, useRef } from "react";
import { GoogleMap } from "@react-google-maps/api";

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

const mapStyle = {
  width: "100%",
  height: "100vh",
};

interface MapViewProps {
  onLocationChange: (location: { lat: number; lng: number }) => void;
}

export function MapView({ onLocationChange }: MapViewProps) {
  const mapRef = useRef<google.maps.Map>();

  const onLoad = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  useEffect(() => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      if (center) {
        onLocationChange({
          lat: center.lat(),
          lng: center.lng(),
        });
      }
    }
  }, [onLocationChange]);

  return (
    <GoogleMap
      mapContainerStyle={mapStyle}
      center={defaultCenter}
      zoom={12}
      onLoad={onLoad}
      onCenterChanged={() => {
        if (mapRef.current) {
          const center = mapRef.current.getCenter();
          if (center) {
            onLocationChange({
              lat: center.lat(),
              lng: center.lng(),
            });
          }
        }
      }}
      options={{
        styles: [
          {
            featureType: "all",
            elementType: "all",
            stylers: [{ saturation: -100 }]
          }
        ],
        disableDefaultUI: true,
        zoomControl: true,
      }}
    />
  );
}
