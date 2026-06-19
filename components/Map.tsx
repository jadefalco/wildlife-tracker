'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { getThumbnailUrl } from '@/lib/image-utils';
import { createSpeciesMarkerIcon } from '@/lib/species-markers';
import { createStructureMarkerIcon } from '@/lib/structure-markers';
import MapLegend from '@/components/MapLegend';
import type { Observation } from '@/lib/supabase';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';



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
  isFormOpen?: boolean;
}

export default function Map({ observations, userLocation, onMarkerClick, isFormOpen }: MapProps) {
  const [mounted, setMounted] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const openLightbox = useCallback((src: string) => {
    setLightboxSrc(src);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
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
        icon={
          obs.observation_type === 'structure'
            ? createStructureMarkerIcon(obs.structure_category, obs.structure_name)
            : createSpeciesMarkerIcon(obs.species_name ?? '', obs.species_category)
        }
        eventHandlers={{
          click: () => onMarkerClick?.(obs),
        }}
      >
        <Popup>
          <div className="min-w-[200px]">
            <p className="font-semibold text-nature-800">
              {obs.observation_type === 'structure' ? obs.structure_name : obs.species_name}
            </p>
            <p className="text-sm text-gray-500">
              {obs.observation_type === 'structure' ? obs.structure_category : obs.species_category}
            </p>
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
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox(obs.photo_url!);
                }}
                className="block p-0 border-0 bg-transparent mt-2 mx-auto rounded-md cursor-zoom-in"
                aria-label="Enlarge photo"
              >
                <img
                  src={getThumbnailUrl(obs.photo_url, 120, 120)}
                  alt={obs.observation_type === 'structure' ? (obs.structure_name ?? '') : (obs.species_name ?? '')}
                  loading="lazy"
                  width={120}
                  height={120}
                  className="rounded-md w-[120px] h-[120px] object-cover"
                />
              </button>
            )}
          </div>
        </Popup>
      </Marker>
    ));
  }, [observations, onMarkerClick, openLightbox]);

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
        <MarkerClusterGroup
          spiderfyOnMaxZoom
          spiderfyOnEveryZoom
          zoomToBoundsOnClick={false}
          showCoverageOnHover={false}
          maxClusterRadius={1}
          removeOutsideVisibleBounds
          animate
        >
          {markers}
        </MarkerClusterGroup>
      </MapContainer>
      <MapLegend isFormOpen={isFormOpen} />
      {lightboxSrc && (
        <Lightbox
          open={lightboxOpen}
          close={closeLightbox}
          slides={[{ src: lightboxSrc, alt: 'Observation photo' }]}
          plugins={[Zoom]}
          render={{
            buttonPrev: () => null,
            buttonNext: () => null,
          }}
          carousel={{ finite: true }}
          controller={{ closeOnBackdropClick: true }}
          animation={{ fade: 200 }}
        />
      )}
    </div>
  );
}
