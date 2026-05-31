'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import SightingForm from '@/components/SightingForm';
import SubmissionModal from '@/components/SubmissionModal';
import { getObservations, type Observation } from '@/lib/supabase';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function HomePage() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied'>('loading');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchObservations = useCallback(async () => {
    try {
      const data = await getObservations();
      setObservations(data);
    } catch (err) {
      console.error('Failed to load observations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchObservations();
  }, [fetchObservations]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus('granted');
      },
      () => {
        setLocationStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const handleSubmitSuccess = useCallback(
    (obs: Observation) => {
      setObservations((prev) => [obs, ...prev]);
    },
    []
  );

  return (
    <main className="h-[100dvh] flex flex-col relative">
      {/* Header */}
      <header className="bg-nature-800 text-white px-4 py-3 flex items-center justify-between shrink-0 z-10">
        <div>
          <h1 className="text-lg font-bold leading-tight">Kelowna Wildlife Tracker</h1>
          <p className="text-xs text-nature-200">Record &middot; Map &middot; Protect</p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-nature-200 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-nature-700"
        >
          Admin
        </Link>
      </header>

      {/* Location Status Bar */}
      <div
        className={`shrink-0 px-4 py-2 text-xs flex items-center gap-2 z-10 ${
          locationStatus === 'granted'
            ? 'bg-nature-100 text-nature-800'
            : locationStatus === 'denied'
            ? 'bg-earth-100 text-earth-800'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {locationStatus === 'loading' && (
          <>
            <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span>Requesting location access...</span>
          </>
        )}
        {locationStatus === 'granted' && (
          <>
            <svg className="w-3.5 h-3.5 text-nature-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Location captured automatically using device GPS</span>
          </>
        )}
        {locationStatus === 'denied' && (
          <>
            <svg className="w-3.5 h-3.5 text-earth-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Using default location (Kelowna, BC)</span>
          </>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-0">
        {isLoading ? (
          <div className="w-full h-full bg-nature-100 animate-pulse flex items-center justify-center">
            <span className="text-nature-600 text-sm">Loading map...</span>
          </div>
        ) : (
          <Map observations={observations} userLocation={userLocation} />
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="shrink-0 bg-white border-t border-gray-200 px-4 py-4 space-y-3 z-10">
        <button onClick={() => setIsFormOpen(true)} className="btn-primary w-full">
          <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Log Wildlife Sighting
        </button>
        <button onClick={() => setIsSubmissionOpen(true)} className="btn-secondary w-full text-base py-3">
          Prepare Submission for Province
        </button>
      </div>

      {/* Modals */}
      <SightingForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        userLocation={userLocation}
        onSubmitSuccess={handleSubmitSuccess}
      />
      <SubmissionModal isOpen={isSubmissionOpen} onClose={() => setIsSubmissionOpen(false)} />
    </main>
  );
}
