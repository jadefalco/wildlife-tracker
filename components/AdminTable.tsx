'use client';

import { useState, useMemo } from 'react';
import type { Observation } from '@/lib/supabase';
import { STRUCTURE_CATEGORIES } from '@/lib/structures';

interface AdminTableProps {
  observations: Observation[];
  onDelete?: (id: string, photoUrl: string | null) => Promise<void>;
}

const WILDLIFE_CATEGORIES = ['Bird', 'Mammal', 'Reptile / Amphibian'];

export default function AdminTable({ observations, onDelete }: AdminTableProps) {
  const [search, setSearch] = useState('');
  const [observationTypeFilter, setObservationTypeFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return observations.filter((obs) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        (obs.species_name?.toLowerCase().includes(searchLower) ?? false) ||
        (obs.structure_name?.toLowerCase().includes(searchLower) ?? false) ||
        (obs.notes?.toLowerCase().includes(searchLower) ?? false);
      const matchesType =
        observationTypeFilter === 'All' || obs.observation_type === observationTypeFilter;
      const matchesCategory =
        categoryFilter === 'All' ||
        obs.species_category === categoryFilter ||
        obs.structure_category === categoryFilter;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [observations, search, observationTypeFilter, categoryFilter]);

  const availableCategories = useMemo(() => {
    if (observationTypeFilter === 'wildlife') return WILDLIFE_CATEGORIES;
    if (observationTypeFilter === 'structure') return STRUCTURE_CATEGORIES.map((c) => c.displayName);
    return [...WILDLIFE_CATEGORIES, ...STRUCTURE_CATEGORIES.map((c) => c.displayName)];
  }, [observationTypeFilter]);

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

  const displayLabel = (obs: Observation) =>
    obs.observation_type === 'structure' ? obs.structure_name : obs.species_name;

  const displayCategory = (obs: Observation) =>
    obs.observation_type === 'structure' ? obs.structure_category : obs.species_category;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-semibold text-nature-800">{observations.length}</span>
          <span>total observations</span>
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-nature-800">{filtered.length}</span>
          <span>shown</span>
        </div>
        <button onClick={handleExport} className="btn-secondary py-2.5 px-4 text-base">
          Export to CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search species, structure, or notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1"
        />
        <select
          value={observationTypeFilter}
          onChange={(e) => {
            setObservationTypeFilter(e.target.value);
            setCategoryFilter('All');
          }}
          className="input-field sm:w-44"
        >
          <option value="All">All Types</option>
          <option value="wildlife">Wildlife</option>
          <option value="structure">Structure</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-field sm:w-52"
        >
          <option value="All">All Categories</option>
          {availableCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
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
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                  No observations found.
                </td>
              </tr>
            ) : (
              filtered.map((obs) => (
                <tr key={obs.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        obs.observation_type === 'structure'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {obs.observation_type === 'structure' ? 'Structure' : 'Wildlife'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {displayLabel(obs) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{displayCategory(obs) ?? '—'}</td>
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
