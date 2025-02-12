import { useEffect, useRef, useState } from "react";
import * as ReactMapGL from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const Map = ReactMapGL.Map;
const Marker = ReactMapGL.Marker;
type MapRef = ReactMapGL.MapRef;
type ViewStateChangeEvent = ReactMapGL.ViewStateChangeEvent;

const MAPBOX_TOKEN = 'pk.eyJ1IjoiMHgxNmU4YmVhIiwiYSI6ImNtNGFhc3FvYjA2cHYycXNlNGNlaTZmMTMifQ.I6cJRlsfe9C718-URherGg';

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
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    latitude: defaultCenter.lat,
    longitude: defaultCenter.lng,
    zoom: 15,
    pitch: 45,
    bearing: 0
  });

  const getAddressForLocation = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].place_name;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const getNearbyPlaces = async (lat: number, lng: number): Promise<Place[]> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/poi.json?proximity=${lng},${lat}&limit=5&access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();
      return data.features.map((feature: any) => ({
        name: feature.text,
        types: [feature.properties?.category || 'point_of_interest'],
        vicinity: feature.place_name
      }));
    } catch (error) {
      console.error('Places search error:', error);
      return [];
    }
  };

  const handleMoveEnd = async () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      const lat = center.lat;
      const lng = center.lng;

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
  };

  // Focus on a marker when selectedMarkerId changes
  useEffect(() => {
    if (mapRef.current && selectedMarkerId) {
      const selectedMarker = markers.find((m, index) => index.toString() === selectedMarkerId);
      if (selectedMarker) {
        mapRef.current.flyTo({
          center: [selectedMarker.position.lng, selectedMarker.position.lat],
          zoom: 15
        });
      }
    }
  }, [selectedMarkerId, markers]);

  // Add terrain and 3D buildings when map loads
  const onMapLoad = () => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    // Add terrain
    map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

    // Add 3D buildings
    map.addLayer({
      'id': '3d-buildings',
      'source': 'composite',
      'source-layer': 'building',
      'filter': ['==', 'extrude', 'true'],
      'type': 'fill-extrusion',
      'minzoom': 14,
      'paint': {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          14,
          0,
          16,
          ['get', 'height']
        ],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 0.8
      }
    });
  };

  return (
    <Map
      {...viewState}
      ref={mapRef}
      style={mapStyle}
      mapStyle="mapbox://styles/mapbox/light-v11"
      mapboxAccessToken={MAPBOX_TOKEN}
      onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
      onMoveEnd={handleMoveEnd}
      onLoad={onMapLoad}
      terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
      fog={{
        range: [0.8, 8],
        color: '#ffffff',
        'horizon-blend': 0.5
      }}
    >
      <ReactMapGL.Source
        id="mapbox-dem"
        type="raster-dem"
        url="mapbox://mapbox.mapbox-terrain-dem-v1"
        tileSize={512}
        maxzoom={14}
      />
      {markers.map((marker, index) => (
        <Marker
          key={index}
          latitude={marker.position.lat}
          longitude={marker.position.lng}
          anchor="bottom"
        >
          <div
            style={{
              backgroundColor: '#FF0000',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              animation: index.toString() === selectedMarkerId ? 'bounce 0.5s infinite' : 'none'
            }}
            title={marker.title}
          >
            {marker.label}
          </div>
        </Marker>
      ))}
    </Map>
  );
}

// Add bounce animation
const style = document.createElement('style');
style.textContent = `
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}`;
document.head.appendChild(style);