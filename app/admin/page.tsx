'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminGuard from '@/components/AdminGuard';
import AdminLayout from '@/components/AdminLayout';
import AdminTable from '@/components/AdminTable';
import { getObservations, type Observation } from '@/lib/supabase';
import { getAdminPassword } from '@/lib/admin-session';

function AdminPageContent() {
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

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const handleDelete = useCallback(async (id: string, photoUrl: string | null) => {
    setDeleteError(null);
    setDeleteSuccess(null);
    try {
      const adminPassword = getAdminPassword();
      if (!adminPassword) {
        throw new Error('Admin session expired. Please log in again.');
      }

      const res = await fetch(`/api/observations/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify({ photo_url: photoUrl }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete observation.');
      }

      setDeleteSuccess(data.message || 'Observation deleted successfully.');
      await fetchData();
    } catch (err) {
      console.error('Delete failed:', err);
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete observation.');
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: observations.length, color: 'bg-nature-100 text-nature-800' },
            {
              label: 'Wildlife',
              value: observations.filter((o) => o.observation_type === 'wildlife').length,
              color: 'bg-sky-100 text-sky-800',
            },
            {
              label: 'Structures',
              value: observations.filter((o) => o.observation_type === 'structure').length,
              color: 'bg-amber-100 text-amber-800',
            },
            {
              label: 'Birds',
              value: observations.filter((o) => o.observation_type === 'wildlife' && o.species_category === 'Bird').length,
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

        {deleteError && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <p className="font-medium">Delete Error</p>
            <p>{deleteError}</p>
          </div>
        )}

        {deleteSuccess && (
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
            <p className="font-medium">Success</p>
            <p>{deleteSuccess}</p>
          </div>
        )}

        {isLoading ? (
          <div className="rounded-xl bg-white border border-gray-200 p-8 text-center text-gray-500">
            <div className="w-8 h-8 border-2 border-nature-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p>Loading observations...</p>
          </div>
        ) : (
          <div className="rounded-xl bg-white border border-gray-200 p-4 sm:p-6">
            <AdminTable observations={observations} onDelete={handleDelete} />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminPageContent />
    </AdminGuard>
  );
}
