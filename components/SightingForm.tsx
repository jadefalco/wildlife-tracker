'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSpeciesByCategory, type SpeciesOption } from '@/lib/species';
import { uploadPhoto, createObservation, type Observation } from '@/lib/supabase';

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

export default function SightingForm({
  isOpen,
  onClose,
  userLocation,
  onSubmitSuccess,
}: SightingFormProps) {
  const [category, setCategory] = useState<SpeciesOption['category']>('Bird');
  const [speciesName, setSpeciesName] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const speciesOptions = getSpeciesByCategory(category);
  const filteredSpecies = searchQuery.trim()
    ? speciesOptions.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : speciesOptions;

  useEffect(() => {
    if (isOpen) {
      setTimestamp(toLocalDateTimeString(new Date()));
      setError(null);
    }
  }, [isOpen]);

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
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo must be smaller than 5MB');
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

    if (!speciesName.trim()) {
      setError('Please select a species.');
      return;
    }

    if (!timestamp) {
      setError('Please select a date and time.');
      return;
    }

    setIsSubmitting(true);

    try {
      let photoUrl: string | undefined;
      if (photo) {
        photoUrl = await uploadPhoto(photo);
      }

      const lat = userLocation?.lat ?? 49.8801;
      const lng = userLocation?.lng ?? -119.4436;

      const observation = await createObservation({
        species_category: category,
        species_name: speciesName,
        latitude: lat,
        longitude: lng,
        observation_timestamp: new Date(timestamp).toISOString(),
        notes: notes.trim() || null,
        photo_url: photoUrl ?? null,
      });

      onSubmitSuccess(observation);
      // Reset form
      setSpeciesName('');
      setNotes('');
      setPhoto(null);
      setPhotoPreview(null);
      setSearchQuery('');
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save observation. Please try again.');
    } finally {
      setIsSubmitting(false);
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
              {(['Bird', 'Mammal', 'Reptile / Amphibian'] as const).map((cat) => (
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
              placeholder="Search species..."
              className="input-field"
            />
            {showDropdown && filteredSpecies.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 max-h-56 overflow-auto">
                {filteredSpecies.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => {
                      setSpeciesName(s.name);
                      setSearchQuery('');
                      setShowDropdown(false);
                    }}
                    className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-nature-50 ${
                      speciesName === s.name ? 'bg-nature-50 font-medium text-nature-800' : 'text-gray-700'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
            <p className="mt-1.5 text-xs text-gray-500">
              If unsure, select &ldquo;Not Sure / Other&rdquo; — accuracy is more important than guessing.
            </p>
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
                  <span>Location captured automatically using device GPS</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-earth-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Using default location (Kelowna, BC)</span>
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

          {/* Submit */}
          <div className="pt-2 pb-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Observation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
