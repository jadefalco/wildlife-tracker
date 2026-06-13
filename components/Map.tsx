'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getThumbnailUrl } from '@/lib/image-utils';
import { createSpeciesMarkerIcon } from '@/lib/species-markers';
import MapLegend from '@/components/MapLegend';
import type { Observation } from '@/lib/supabase';



function MapController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  const prevCenterRef = useRef(center);
  const prevZoomRef = useRef(zoom);

  useEffect(() => {
    const [prevLat, prevLng] = prevCenterRef.current;
    const [lat, lng] = center;
    if (prevLat !== lat || prevLng !== lng || prevZoomRef.current !== zoom) {
      map.setView(center, zoom);
      prevCenterRef.current = center;
      prevZoomRef.current = zoom;
    }
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
        position={[Number(obs.latitude), Number(obs.longitude)]}
        icon={createSpeciesMarkerIcon(obs.species_name, obs.species_category)}
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
              // Load a tiny 120×120 thumbnail instead of the full-resolution
              // original. This keeps map popups fast and saves bandwidth,
              // especially on mobile. Supabase Image Transformations handle
              // the resize on-the-fly at no extra storage cost.
              <img
                src={getThumbnailUrl(obs.photo_url, 120, 120)}
                alt={obs.species_name}
                loading="lazy"
                width={120}
                height={120}
                className="mt-2 rounded-md w-[120px] h-[120px] object-cover mx-auto"
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
    <div className="relative w-full h-full">
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
        {markers}
      </MapContainer>
      <MapLegend />
    </div>
  );
}
