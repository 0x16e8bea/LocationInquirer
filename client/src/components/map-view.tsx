import { useEffect, useRef, useState } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

const mapStyle = {
  width: "100%",
  height: "100vh",
};

interface Place {
  name: string;
  rating?: number;
  types: string[];
  vicinity: string;
}

interface MapViewProps {
  onLocationChange: (location: { lat: number; lng: number; address?: string; places?: Place[] }) => void;
  markers: Array<{
    position: { lat: number; lng: number };
    label: string;
    title: string;
  }>;
  selectedMarkerId?: string;
}

export function MapView({ onLocationChange, markers, selectedMarkerId }: MapViewProps) {
  const mapRef = useRef<google.maps.Map>();
  const geocoderRef = useRef<google.maps.Geocoder>();
  const placesServiceRef = useRef<google.maps.places.PlacesService>();

  const onLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
    placesServiceRef.current = new google.maps.places.PlacesService(map);
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

  const getNearbyPlaces = async (lat: number, lng: number): Promise<Place[]> => {
    if (!placesServiceRef.current) return [];

    return new Promise((resolve) => {
      const request: google.maps.places.PlaceSearchRequest = {
        location: { lat, lng },
        radius: 500,
        type: 'point_of_interest'
      };

      placesServiceRef.current.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const places = results.slice(0, 5).map(place => ({
            name: place.name || '',
            rating: place.rating,
            types: place.types || [],
            vicinity: place.vicinity || ''
          }));
          resolve(places);
        } else {
          resolve([]);
        }
      });
    });
  };

  useEffect(() => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      if (center) {
        const lat = center.lat();
        const lng = center.lng();

        Promise.all([
          getAddressForLocation(lat, lng),
          getNearbyPlaces(lat, lng)
        ]).then(([address, places]) => {
          onLocationChange({
            lat,
            lng,
            address,
            places
          });
        });
      }
    }
  }, [onLocationChange]);

  // Focus on a marker when selectedMarkerId changes
  useEffect(() => {
    if (mapRef.current && selectedMarkerId) {
      const selectedMarker = markers.find((m, index) => index.toString() === selectedMarkerId);
      if (selectedMarker) {
        mapRef.current.panTo(selectedMarker.position);
        mapRef.current.setZoom(15);
      }
    }
  }, [selectedMarkerId, markers]);

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

            Promise.all([
              getAddressForLocation(lat, lng),
              getNearbyPlaces(lat, lng)
            ]).then(([address, places]) => {
              onLocationChange({
                lat,
                lng,
                address,
                places
              });
            });
          }
        }
      }}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
      }}
    >
      {markers.map((marker, index) => (
        <Marker
          key={index}
          position={marker.position}
          label={{
            text: marker.label,
            color: "white",
            fontSize: "14px",
            fontWeight: "bold",
            className: "marker-label"
          }}
          title={marker.title}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#FF0000",
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 12,
          }}
          animation={index.toString() === selectedMarkerId ? google.maps.Animation.BOUNCE : undefined}
        />
      ))}
    </GoogleMap>
  );
}