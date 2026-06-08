'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSpeciesByCategory, filterSpeciesLocal, type SpeciesRecord } from '@/lib/species';
import { uploadPhoto, createObservation, type Observation } from '@/lib/supabase';
import { validateImageFile } from '@/lib/image-utils';
import SpeciesInfoPanel from '@/components/SpeciesInfoPanel';

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

export default function SightingForm({
  isOpen,
  onClose,
  userLocation,
  onSubmitSuccess,
}: SightingFormProps) {
  const [category, setCategory] = useState<Category>('Bird');
  const [speciesName, setSpeciesName] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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

  const selectedSpecies = speciesList.find((s) => s.display_name === speciesName);

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

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error ?? 'Invalid photo');
        return;
      }
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
      setError(null);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log('[SightingForm] Save Observation clicked. userLocation prop:', userLocation);

    if (!speciesName.trim()) {
      setError('Please select a species.');
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
      // Capture fresh GPS at the exact moment of submission
      // Require a valid location before allowing submission
if (!userLocation) {
  setError(
    'Unable to determine your location. Please enable location services and try again.'
  );
  setIsSubmitting(false);
  setSubmitStatus('idle');
  return;
}

let lat = userLocation.lat;
let lng = userLocation.lng;

console.log('[SightingForm] Initial coordinates from userLocation:', {
  lat,
  lng,
});
      if (navigator.geolocation) {
        console.log('[SightingForm] navigator.geolocation exists. Calling getCurrentPosition...');
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
          console.log('[SightingForm] getCurrentPosition SUCCESS:', { lat, lng, accuracy: position.coords.accuracy });
        } catch (geoErr) {
          const err = geoErr as GeolocationPositionError;
          console.log('[SightingForm] getCurrentPosition FAILED:', {
            code: err.code,
            message: err.message,
            PERMISSION_DENIED: err.code === 1,
            POSITION_UNAVAILABLE: err.code === 2,
            TIMEOUT: err.code === 3,
          });
        }
      } else {
        console.log('[SightingForm] navigator.geolocation does NOT exist');
      }

      console.log('[SightingForm] Final coordinates being sent to API:', { lat, lng });

      setSubmitStatus('saving');

      let photoUrl: string | null = null;
      if (photo) {
        photoUrl = await uploadPhoto(photo);
      }

      const response = await fetch('/api/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          species_category: category,
          species_name: speciesName,
          latitude: lat,
          longitude: lng,
          observation_timestamp: new Date(timestamp).toISOString(),
          notes: notes.trim() || null,
          photo_url: photoUrl,
          website: honeypot,
        }),
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
      setSpeciesName('');
      setNotes('');
      setPhoto(null);
      setPhotoPreview(null);
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
          <h2 className="text-xl font-bold text-nature-900">Log Wildlife Sighting</h2>
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
              {userLocation ? (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-nature-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>
                    {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-earth-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                 <span className="text-red-700">
  Location unavailable. Enable location services to submit a sighting.
</span>
                </div>
              )}
            </div>
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
              disabled={isSubmitting || !userLocation || !privacyAcknowledged}
              className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {!userLocation
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
