'use client';

import { useState } from 'react';
import type { Observation } from '@/lib/supabase';

interface AdminTableProps {
  observations: Observation[];
  onDelete?: (id: string, photoUrl: string | null) => Promise<void>;
}

export default function AdminTable({ observations, onDelete }: AdminTableProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = observations.filter((obs) => {
    const matchesSearch =
      obs.species_name.toLowerCase().includes(search.toLowerCase()) ||
      (obs.notes?.toLowerCase() ?? '').includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || obs.species_category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (obs: Observation) => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete this observation?'
    );
    if (!confirmed) return;

    setDeletingId(obs.id);
    try {
      await onDelete?.(obs.id, obs.photo_url);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/observations/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kelowna-wildlife-observations-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export CSV. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-semibold text-nature-800">{observations.length}</span>
          <span>total observations</span>
        </div>
        <button onClick={handleExport} className="btn-secondary py-2.5 px-4 text-base">
          Export to CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search species or notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-field sm:w-48"
        >
          <option value="All">All Categories</option>
          <option value="Bird">Bird</option>
          <option value="Mammal">Mammal</option>
          <option value="Reptile / Amphibian">Reptile / Amphibian</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Species
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Photo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  No observations found.
                </td>
              </tr>
            ) : (
              filtered.map((obs) => (
                <tr key={obs.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{obs.species_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{obs.species_category}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(obs.observation_timestamp).toLocaleString('en-CA', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {obs.notes || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {obs.photo_url ? (
                      <a
                        href={obs.photo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-nature-600 hover:text-nature-800 underline"
                      >
                        Yes
                      </a>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono truncate max-w-[120px]">
                    {obs.id}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => handleDelete(obs)}
                      disabled={deletingId === obs.id}
                      className="inline-flex items-center rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === obs.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
