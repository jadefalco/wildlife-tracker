'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminTable from '@/components/AdminTable';
import { getObservations, type Observation } from '@/lib/supabase';

export default function AdminPage() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getObservations();
      setObservations(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load observations. Please check your Supabase configuration.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <main className="min-h-screen bg-nature-50">
      <header className="bg-nature-800 text-white px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Admin Dashboard</h1>
          <p className="text-xs text-nature-200">Kelowna Wildlife Tracker</p>
        </div>
        <Link
          href="/"
          className="text-sm text-nature-200 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-nature-700"
        >
          Back to Map
        </Link>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: observations.length, color: 'bg-nature-100 text-nature-800' },
            {
              label: 'Birds',
              value: observations.filter((o) => o.species_category === 'Bird').length,
              color: 'bg-sky-100 text-sky-800',
            },
            {
              label: 'Mammals',
              value: observations.filter((o) => o.species_category === 'Mammal').length,
              color: 'bg-amber-100 text-amber-800',
            },
            {
              label: 'Reptiles / Amphibians',
              value: observations.filter((o) => o.species_category === 'Reptile / Amphibian').length,
              color: 'bg-emerald-100 text-emerald-800',
            },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs font-medium opacity-80">{stat.label}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="rounded-xl bg-white border border-gray-200 p-8 text-center text-gray-500">
            <div className="w-8 h-8 border-2 border-nature-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p>Loading observations...</p>
          </div>
        ) : (
          <div className="rounded-xl bg-white border border-gray-200 p-4 sm:p-6">
            <AdminTable observations={observations} />
          </div>
        )}
      </div>
    </main>
  );
}
