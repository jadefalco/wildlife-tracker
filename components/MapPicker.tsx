'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { createMarkerIcon, type MarkerType } from '@/lib/map-markers';

const pickerIcon = createMarkerIcon('default');

interface Coordinates {
  lat: number;
  lng: number;
}

interface MapPickerProps {
  initialLocation?: Coordinates | null;
  defaultZoom?: number;
  markerType?: MarkerType;
  onSelect: (coords: Coordinates) => void;
  onCancel?: () => void;
}

function LocationMarker({
  onSelect,
  selectedLocation,
  markerType = 'default',
}: {
  onSelect: (coords: Coordinates) => void;
  selectedLocation?: Coordinates | null;
  markerType?: MarkerType;
}) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  if (!selectedLocation) return null;

  // Re-create the icon whenever the marker type changes so future variants apply immediately.
  const icon = createMarkerIcon(markerType);

  return <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={icon} />;
}

export default function MapPicker({
  initialLocation = null,
  defaultZoom = 13,
  markerType = 'default',
  onSelect,
  onCancel,
}: MapPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<Coordinates | null>(initialLocation);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setPendingLocation(initialLocation);
  }, [initialLocation]);

  const fallbackCenter: Coordinates = { lat: 49.8801, lng: -119.4436 };
  const center = initialLocation ?? fallbackCenter;

  if (!mounted) {
    return (
      <div className="w-full h-full bg-nature-100 animate-pulse flex items-center justify-center">
        <span className="text-nature-600 text-sm">Loading map...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative min-h-0">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={defaultZoom}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
          className="z-0 rounded-t-lg map-picker"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            onSelect={setPendingLocation}
            selectedLocation={pendingLocation}
            markerType={markerType}
          />
        </MapContainer>
      </div>

      <div className="shrink-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-end gap-3 rounded-b-lg">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => pendingLocation && onSelect(pendingLocation)}
          disabled={!pendingLocation}
          className="btn-primary text-sm py-2 px-4 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Use This Location
        </button>
      </div>
    </div>
  );
}
