'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import SightingForm from '@/components/SightingForm';
import SplashScreen from '@/components/SplashScreen';
import { createSession } from '@/lib/admin-session';
import { getObservations, type Observation } from '@/lib/supabase';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function HomePage() {
  const router = useRouter();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied'>('loading');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

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
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <main className="h-[100dvh] flex flex-col relative">
      {/* Header */}
      <header className="bg-nature-800 text-white px-4 py-3 flex items-center justify-between shrink-0 z-10">
        <div>
          <h1 className="text-lg font-bold leading-tight">Kelowna Wildlife Tracker</h1>
          <p className="text-xs text-nature-200">Record &middot; Map &middot; Protect</p>
        </div>
        <button
          onClick={() => setIsAdminModalOpen(true)}
          className="text-sm text-nature-200 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-nature-700"
        >
          Admin
        </button>
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
      </div>

      {/* Modals */}
      <SightingForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        userLocation={userLocation}
        onSubmitSuccess={handleSubmitSuccess}
      />

      {/* Admin Password Modal */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-nature-900">Admin Access</h2>
              <button
                onClick={() => {
                  setIsAdminModalOpen(false);
                  setAdminPassword('');
                  setAdminError(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setAdminError(null);
                setAdminLoading(true);
                try {
                  const res = await fetch('/api/admin/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: adminPassword }),
                  });
                  const data = await res.json();
                  if (res.ok && data.success) {
                    createSession();
                    router.push('/admin');
                  } else {
                    setAdminError(data.error || 'Incorrect password.');
                  }
                } catch {
                  setAdminError('Incorrect password.');
                } finally {
                  setAdminLoading(false);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label htmlFor="admin-password" className="label-text mb-1.5">
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter admin password"
                  autoFocus
                />
              </div>

              {adminError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {adminError}
                </div>
              )}

              <button
                type="submit"
                disabled={adminLoading || !adminPassword}
                className="btn-primary w-full disabled:opacity-60"
              >
                {adminLoading ? 'Verifying...' : 'Enter Admin'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
    </>
  );
}
