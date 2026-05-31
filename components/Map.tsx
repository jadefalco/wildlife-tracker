'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Observation } from '@/lib/supabase';

// Fix Leaflet default icon issue in Next.js
const defaultIcon = L.icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div style="
    width: 16px;
    height: 16px;
    background: #3b82f6;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function MapController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface MapProps {
  observations: Observation[];
  userLocation: { lat: number; lng: number } | null;
  onMarkerClick?: (obs: Observation) => void;
}

export default function Map({ observations, userLocation, onMarkerClick }: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const defaultCenter: [number, number] = [49.8801, -119.4436]; // Kelowna, BC
  const mapCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : defaultCenter;

  const markers = useMemo(() => {
    return observations.map((obs) => (
      <Marker
        key={obs.id}
        position={[obs.latitude, obs.longitude]}
        icon={defaultIcon}
        eventHandlers={{
          click: () => onMarkerClick?.(obs),
        }}
      >
        <Popup>
          <div className="min-w-[200px]">
            <p className="font-semibold text-nature-800">{obs.species_name}</p>
            <p className="text-sm text-gray-500">{obs.species_category}</p>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(obs.observation_timestamp).toLocaleString('en-CA', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
            {obs.notes && (
              <p className="text-sm text-gray-700 mt-2 italic">&ldquo;{obs.notes}&rdquo;</p>
            )}
            {obs.photo_url && (
              <img
                src={obs.photo_url}
                alt={obs.species_name}
                className="mt-2 rounded-md w-full h-32 object-cover"
              />
            )}
          </div>
        </Popup>
      </Marker>
    ));
  }, [observations, onMarkerClick]);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-nature-100 animate-pulse flex items-center justify-center">
        <span className="text-nature-600 text-sm">Loading map...</span>
      </div>
    );
  }

  return (
    <MapContainer
      center={mapCenter}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <MapController center={mapCenter} zoom={userLocation ? 15 : 13} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>
            <span className="text-sm font-medium text-gray-700">Your location</span>
          </Popup>
        </Marker>
      )}
      {markers}
    </MapContainer>
  );
}
