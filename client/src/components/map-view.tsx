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
  onLocationChange: (location: { lat: number; lng: number; address?: string }) => void;
}

export function MapView({ onLocationChange }: MapViewProps) {
  const mapRef = useRef<google.maps.Map>();
  const geocoderRef = useRef<google.maps.Geocoder>();

  const onLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
  };

  const getAddressForLocation = async (lat: number, lng: number) => {
    if (!geocoderRef.current) return;

    try {
      const response = await geocoderRef.current.geocode({
        location: { lat, lng }
      });

      if (response.results[0]) {
        return response.results[0].formatted_address;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  useEffect(() => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      if (center) {
        const lat = center.lat();
        const lng = center.lng();

        // Get address for initial location
        getAddressForLocation(lat, lng).then(address => {
          onLocationChange({
            lat,
            lng,
            address
          });
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
            const lat = center.lat();
            const lng = center.lng();

            getAddressForLocation(lat, lng).then(address => {
              onLocationChange({
                lat,
                lng,
                address
              });
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