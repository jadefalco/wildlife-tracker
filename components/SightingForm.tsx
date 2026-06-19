'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getSpeciesByCategory, filterSpeciesLocal, type SpeciesRecord } from '@/lib/species';
import { uploadPhoto, createObservation, type Observation } from '@/lib/supabase';
import { STRUCTURE_CATEGORIES, type StructureCategory, type StructureEntry } from '@/lib/structures';
import { validateImageFile, isValidCoordinates } from '@/lib/image-utils';
import exifr from 'exifr';
import dynamic from 'next/dynamic';
import SpeciesInfoPanel from '@/components/SpeciesInfoPanel';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

interface SightingFormProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: { lat: number; lng: number } | null;
  onSubmitSuccess: (obs: Observation) => void;
}

const CATEGORY_ORDER = ['Bird', 'Mammal', 'Reptile / Amphibian'] as const;
type Category = (typeof CATEGORY_ORDER)[number];

type ObservationType = 'wildlife' | 'structure';

type LocationSource = 'manual' | 'photo' | 'device';

interface Coordinates {
  lat: number;
  lng: number;
}

export default function SightingForm({
  isOpen,
  onClose,
  userLocation,
  onSubmitSuccess,
}: SightingFormProps) {
  const [observationType, setObservationType] = useState<ObservationType>('wildlife');
  const [category, setCategory] = useState<Category>('Bird');
  const [speciesName, setSpeciesName] = useState('');
  const [structureCategory, setStructureCategory] = useState<StructureCategory>(STRUCTURE_CATEGORIES[0]);
  const [structureEntry, setStructureEntry] = useState<StructureEntry | null>(null);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoCoordinates, setPhotoCoordinates] = useState<Coordinates | null>(null);
  const [manualCoordinates, setManualCoordinates] = useState<Coordinates | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [locationSource, setLocationSource] = useState<LocationSource | null>(null);
  const [timestamp, setTimestamp] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speciesList, setSpeciesList] = useState<SpeciesRecord[]>([]);
  const [isLoadingSpecies, setIsLoadingSpecies] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'locating' | 'saving'>('idle');
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredSpecies = searchQuery.trim()
    ? filterSpeciesLocal(speciesList, searchQuery)
    : speciesList;

  // Location priority hierarchy: manual pin > photo EXIF GPS > browser/device geolocation
  const resolvedLocation = useMemo(() => {
    if (manualCoordinates) return { coords: manualCoordinates, source: 'manual' as const };
    if (photoCoordinates) return { coords: photoCoordinates, source: 'photo' as const };
    if (userLocation) return { coords: userLocation, source: 'device' as const };
    return null;
  }, [manualCoordinates, photoCoordinates, userLocation]);

  useEffect(() => {
    setLocationSource(resolvedLocation?.source ?? null);
  }, [resolvedLocation]);

  const selectedSpecies = speciesList.find((s) => s.display_name === speciesName);

  const structureEntries = structureCategory.entries;

  useEffect(() => {
    if (isOpen) {
      console.log('[SightingForm] Form opened. userLocation prop:', userLocation);
      setTimestamp(toLocalDateTimeString(new Date()));
      setError(null);
    }
  }, [isOpen, userLocation]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsLoadingSpecies(true);
    getSpeciesByCategory(category)
      .then((data) => {
        if (!cancelled) {
          // Append "Not Sure / Other" at the end
          const notSure: SpeciesRecord = {
            id: 'not-sure',
            sort_name: 'Not Sure / Other',
            display_name: 'Not Sure / Other',
            category,
            rarity: 'Common',
            slug: 'not-sure',
            wikipedia_url: null,
            thumbnail_url: null,
            image_source: null,
            observation_count: 0,
            created_at: '',
            updated_at: '',
          };
          setSpeciesList([...data, notSure]);
        }
      })
      .catch((err) => {
        console.error('Failed to load species:', err);
        if (!cancelled) setError('Failed to load species list.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSpecies(false);
      });
    return () => { cancelled = true; };
  }, [category, isOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePhotoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error ?? 'Invalid photo');
      return;
    }

    setPhoto(file);
    setPhotoCoordinates(null);
    // Only reset location source if it was photo; manual takes precedence and persists.
    setLocationSource((prev) => (prev === 'photo' ? null : prev));

    // Generate preview from the original file (does not strip EXIF).
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Extract GPS from the ORIGINAL file before any compression or upload.
    try {
      const gps = await exifr.gps(file);
      if (gps && isValidCoordinates(gps.latitude, gps.longitude)) {
        setPhotoCoordinates({ lat: gps.latitude, lng: gps.longitude });
        if (process.env.NODE_ENV === 'development') {
          console.log('[SightingForm] Photo GPS found:', { lat: gps.latitude, lng: gps.longitude });
          console.log('[SightingForm] Using photo GPS');
        }
      } else if (gps) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SightingForm] Photo GPS invalid:', { lat: gps.latitude, lng: gps.longitude });
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SightingForm] No photo GPS present');
        }
      }
    } catch (exifErr) {
      // EXIF extraction failures must never block submission.
      if (process.env.NODE_ENV === 'development') {
        console.log('[SightingForm] EXIF extraction failed:', exifErr);
      }
    }

    setError(null);
  }, []);

  const pickerInitialLocation = useMemo(
    () => manualCoordinates ?? photoCoordinates ?? userLocation,
    [manualCoordinates, photoCoordinates, userLocation]
  );

  const handleManualLocationSelect = useCallback((coords: Coordinates) => {
    setManualCoordinates(coords);
    setShowMapPicker(false);
  }, []);

  const handleResetManualLocation = useCallback(() => {
    setManualCoordinates(null);
    setShowMapPicker(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log('[SightingForm] Save Observation clicked. userLocation prop:', userLocation);

    if (observationType === 'wildlife' && !speciesName.trim()) {
      setError('Please select a species.');
      return;
    }

    if (observationType === 'structure' && !structureEntry) {
      setError('Please select a structure.');
      return;
    }

    if (!timestamp) {
      setError('Please select a date and time.');
      return;
    }

    if (!privacyAcknowledged) {
      setError('Please confirm that you understand this observation may be displayed publicly.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('locating');

    try {
      // Location priority hierarchy: manual pin > photo EXIF GPS > browser/device geolocation
      if (!resolvedLocation) {
        setError(
          'Unable to determine your location. Please enable location services or upload a geotagged photo.'
        );
        setIsSubmitting(false);
        setSubmitStatus('idle');
        return;
      }

      let lat = resolvedLocation.coords.lat;
      let lng = resolvedLocation.coords.lng;
      const source = resolvedLocation.source;

      if (process.env.NODE_ENV === 'development') {
        console.log(`[SightingForm] Initial coordinates from ${source}:`, { lat, lng });
      }

      // Manual coordinates and photo GPS are authoritative; only refresh device GPS.
      if (source === 'device' && navigator.geolocation) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SightingForm] Using browser geolocation');
          console.log('[SightingForm] navigator.geolocation exists. Calling getCurrentPosition...');
        }
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
          if (process.env.NODE_ENV === 'development') {
            console.log('[SightingForm] getCurrentPosition SUCCESS:', { lat, lng, accuracy: position.coords.accuracy });
          }
        } catch (geoErr) {
          const err = geoErr as GeolocationPositionError;
          if (process.env.NODE_ENV === 'development') {
            console.log('[SightingForm] getCurrentPosition FAILED:', {
              code: err.code,
              message: err.message,
              PERMISSION_DENIED: err.code === 1,
              POSITION_UNAVAILABLE: err.code === 2,
              TIMEOUT: err.code === 3,
            });
          }
          // Fall back to the userLocation prop already captured in resolvedLocation.
        }
      } else if (process.env.NODE_ENV === 'development') {
        if (source === 'manual') {
          console.log('[SightingForm] Using manual coordinates');
        } else if (source === 'photo') {
          console.log('[SightingForm] Using photo GPS');
        } else {
          console.log('[SightingForm] navigator.geolocation does NOT exist');
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[SightingForm] Final coordinates being sent to API:', { lat, lng, source });
      }

      setSubmitStatus('saving');

      let photoUrl: string | null = null;
      if (photo) {
        photoUrl = await uploadPhoto(photo);
      }

      const requestBody: Record<string, unknown> = {
        observation_type: observationType,
        latitude: lat,
        longitude: lng,
        observation_timestamp: new Date(timestamp).toISOString(),
        notes: notes.trim() || null,
        photo_url: photoUrl,
        website: honeypot,
      };

      if (observationType === 'wildlife') {
        requestBody.species_category = category;
        requestBody.species_name = speciesName;
      } else {
        requestBody.structure_category = structureCategory.displayName;
        requestBody.structure_name = structureEntry?.displayName;
      }

      const response = await fetch('/api/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 429) {
        setError('Too many submissions. Please wait a minute and try again.');
        setIsSubmitting(false);
        setSubmitStatus('idle');
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save observation.');
      }

      const { observation } = await response.json();
      onSubmitSuccess(observation);
      setObservationType('wildlife');
      setCategory('Bird');
      setSpeciesName('');
      setStructureCategory(STRUCTURE_CATEGORIES[0]);
      setStructureEntry(null);
      setNotes('');
      setPhoto(null);
      setPhotoPreview(null);
      setPhotoCoordinates(null);
      setManualCoordinates(null);
      setShowMapPicker(false);
      setLocationSource(null);
      setSearchQuery('');
      setHoneypot('');
      setSubmitStatus('idle');
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to save observation. Please try again.');
    } finally {
      setIsSubmitting(false);
      setSubmitStatus('idle');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-xl font-bold text-nature-900">
            {observationType === 'wildlife' ? 'Log Wildlife Sighting' : 'Log Animal Home / Structure'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {/* Observation Type */}
          <div>
            <label className="label-text mb-1.5">What would you like to report?</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setObservationType('wildlife');
                  setStructureEntry(null);
                }}
                className={`rounded-lg py-2.5 px-2 text-sm font-medium transition-colors ${
                  observationType === 'wildlife'
                    ? 'bg-nature-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Wildlife Sighting
              </button>
              <button
                type="button"
                onClick={() => {
                  setObservationType('structure');
                  setSpeciesName('');
                  setSearchQuery('');
                }}
                className={`rounded-lg py-2.5 px-2 text-sm font-medium transition-colors ${
                  observationType === 'structure'
                    ? 'bg-nature-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Animal Home / Structure
              </button>
            </div>
          </div>

          {observationType === 'wildlife' && (
            <>
              {/* Species Category */}
              <div>
                <label className="label-text mb-1.5">Species Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORY_ORDER.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                        setSpeciesName('');
                        setSearchQuery('');
                      }}
                      className={`rounded-lg py-2.5 px-2 text-sm font-medium transition-colors ${
                        category === cat
                          ? 'bg-nature-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Species Search */}
              <div className="relative" ref={dropdownRef}>
                <label className="label-text mb-1.5">Species</label>
                <input
                  type="text"
                  value={searchQuery || speciesName}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSpeciesName('');
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder={isLoadingSpecies ? 'Loading species...' : 'Search species...'}
                  disabled={isLoadingSpecies}
                  className="input-field disabled:opacity-50"
                />
                {showDropdown && filteredSpecies.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 max-h-56 overflow-auto">
                    {filteredSpecies.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSpeciesName(s.display_name);
                          setSearchQuery('');
                          setShowDropdown(false);
                        }}
                        className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-nature-50 ${
                          speciesName === s.display_name ? 'bg-nature-50 font-medium text-nature-800' : 'text-gray-700'
                        }`}
                      >
                        {s.display_name}
                        {s.rarity === 'Uncommon' && (
                          <span className="ml-2 text-xs text-earth-600">(Uncommon)</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-1.5 text-xs text-gray-500">
                  If unsure, select &ldquo;Not Sure / Other&rdquo; — accuracy is more important than guessing.
                </p>

                {/* Species Information Panel */}
                {selectedSpecies && (
                  <div className="mt-3">
                    <SpeciesInfoPanel species={selectedSpecies} />
                  </div>
                )}
              </div>
            </>
          )}

          {observationType === 'structure' && (
            <>
              {/* Structure Category */}
              <div>
                <label className="label-text mb-1.5">Structure Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {STRUCTURE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setStructureCategory(cat);
                        setStructureEntry(null);
                      }}
                      className={`rounded-lg py-2.5 px-2 text-sm font-medium transition-colors ${
                        structureCategory.id === cat.id
                          ? 'bg-nature-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="mr-1">{cat.emoji}</span>
                      {cat.displayName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Structure Selection */}
              <div>
                <label className="label-text mb-1.5">Structure</label>
                <div className="grid grid-cols-2 gap-2">
                  {structureEntries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setStructureEntry(entry)}
                      className={`rounded-lg py-2.5 px-2 text-sm font-medium transition-colors text-left ${
                        structureEntry?.id === entry.id
                          ? 'bg-nature-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="mr-1">{entry.emoji}</span>
                      {entry.displayName}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  If unsure, select &ldquo;Animal Home (Unknown)&rdquo; or &ldquo;Other Structure&rdquo; — accuracy is more important than guessing.
                </p>
              </div>
            </>
          )}

          {/* Date & Time */}
          <div>
            <label className="label-text mb-1.5">Date & Time</label>
            <input
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {/* GPS */}
          <div>
            <label className="label-text mb-1.5">GPS Location</label>
            <div className="rounded-lg bg-nature-50 px-4 py-3 text-sm text-nature-800">
              {resolvedLocation ? (
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-nature-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5">
                      {locationSource === 'photo' && <span>📸</span>}
                      {locationSource === 'device' && <span>📍</span>}
                      {locationSource === 'manual' && <span>📌</span>}
                      <span>
                        {locationSource === 'photo' && 'Location extracted from photo'}
                        {locationSource === 'device' && 'Using current device location'}
                        {locationSource === 'manual' && 'Using selected map location'}
                      </span>
                    </span>
                    <span className="font-medium mt-0.5">
                      {resolvedLocation.coords.lat.toFixed(6)}, {resolvedLocation.coords.lng.toFixed(6)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-earth-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-red-700">
                      Location unavailable. Enable location services or upload a geotagged photo.
                    </span>
                  </div>

                  {photo && !photoCoordinates && !userLocation && (
                    <div className="rounded-md bg-earth-50 p-3 text-sm text-earth-800">
                      <p className="font-medium mb-2">⚠️ This photo does not contain GPS location data.</p>
                      <p className="mb-2">To record an accurate wildlife sighting, either:</p>
                      <ul className="list-disc list-inside space-y-1 mb-3">
                        <li>Allow location access and return to the location where you observed the animal, OR</li>
                        <li>Drop a pin on the map to choose the sighting location manually.</li>
                      </ul>
                      <button
                        type="button"
                        onClick={() => setShowMapPicker(true)}
                        className="btn-secondary text-sm py-2 px-3 w-full"
                      >
                        Choose Location on Map
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {resolvedLocation && (
              <button
                type="button"
                onClick={() => setShowMapPicker(true)}
                className="mt-2 text-sm font-medium text-nature-700 hover:text-nature-800"
              >
                Change Location on Map
              </button>
            )}

            {showMapPicker && (
              <div className="mt-3">
                <p className="text-xs text-gray-600 mb-1.5">Click the map to place the sighting location.</p>
                <div className="h-80 w-full rounded-lg border border-gray-200 overflow-hidden">
                  <MapPicker
                    initialLocation={pickerInitialLocation}
                    defaultZoom={pickerInitialLocation ? 15 : 13}
                    onSelect={handleManualLocationSelect}
                    onCancel={() => setShowMapPicker(false)}
                  />
                </div>
              </div>
            )}

            {manualCoordinates && (
              <button
                type="button"
                onClick={handleResetManualLocation}
                className="mt-2 text-sm text-red-600 hover:text-red-700"
              >
                {photoCoordinates
                  ? 'Reset to Photo Location'
                  : userLocation
                  ? 'Reset to Device Location'
                  : 'Clear manual location'}
              </button>
            )}
          </div>

          {/* Photo */}
          <div>
            <label className="label-text mb-1.5">Photo (optional)</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-base py-2.5 px-4"
              >
                {photo ? 'Change Photo' : 'Upload Photo'}
              </button>
              {photo && (
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    setPhotoPreview(null);
                    setPhotoCoordinates(null);
                    setLocationSource((prev) => (prev === 'photo' ? null : prev));
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            {photoPreview && (
              <img
                src={photoPreview}
                alt="Preview"
                className="mt-3 rounded-lg w-full h-48 object-cover"
              />
            )}

          </div>

          {/* Notes */}
          <div>
            <label className="label-text mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Behaviour, habitat, number of individuals..."
              className="input-field resize-none"
            />
          </div>

          {/* Honeypot — hidden from users, bots fill it */}
          <div className="absolute left-[-9999px]" aria-hidden="true">
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* Privacy Acknowledgement */}
          <div className="pt-1">
            <div className="flex items-start gap-3">
              <input
                id="privacy-ack"
                type="checkbox"
                checked={privacyAcknowledged}
                onChange={(e) => setPrivacyAcknowledged(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-nature-600 focus:ring-nature-600"
              />
              <label htmlFor="privacy-ack" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                I understand that the location, date, species information, notes, and any uploaded photo may be displayed publicly on the Wildlife Tracker map.
              </label>
            </div>
            <p className="mt-1.5 text-xs text-gray-500 pl-7">
              Personal information is not collected, but observation details and map locations are visible to other users.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-2 pb-4">
            <button
              type="submit"
              disabled={isSubmitting || !resolvedLocation || !privacyAcknowledged}
              className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {!resolvedLocation
                ? 'Location Required'
                : !privacyAcknowledged
                ? 'Confirm Privacy Notice'
                : submitStatus === 'locating'
                ? 'Getting location...'
                : submitStatus === 'saving'
                ? 'Saving...'
                : 'Save Observation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
