'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminGuard from '@/components/AdminGuard';
import AdminLayout from '@/components/AdminLayout';
import { getSpecies, getSpeciesCategories, type SpeciesRecord } from '@/lib/supabase';

const categoryBadgeStyles: Record<string, string> = {
  Bird: 'bg-sky-100 text-sky-800',
  Mammal: 'bg-amber-100 text-amber-800',
  'Reptile / Amphibian': 'bg-emerald-100 text-emerald-800',
  Fish: 'bg-blue-100 text-blue-800',
  Insect: 'bg-purple-100 text-purple-800',
};

function AdminSpeciesPageContent() {
  const [species, setSpecies] = useState<SpeciesRecord[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [rarityFilter, setRarityFilter] = useState<string>('All');
  const [syncOutput, setSyncOutput] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [speciesData, categoryData] = await Promise.all([
        getSpecies(),
        getSpeciesCategories(),
      ]);
      setSpecies(speciesData);
      setCategories(categoryData);
    } catch (err) {
      console.error(err);
      setError('Failed to load species. Please check your Supabase configuration.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setSyncOutput(null);
      const res = await fetch('/api/species/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncOutput(data.output);
        await fetchData();
      } else {
        setSyncOutput(`Error: ${data.error}`);
      }
    } catch (err) {
      setSyncOutput(`Error: ${(err as Error).message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const filtered = species.filter((s) => {
    const matchesSearch =
      !search.trim() ||
      s.display_name.toLowerCase().includes(search.toLowerCase()) ||
      s.sort_name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || s.category === categoryFilter;
    const matchesRarity = rarityFilter === 'All' || s.rarity === rarityFilter;
    return matchesSearch && matchesCategory && matchesRarity;
  });

  const missingImages = species.filter((s) => !s.thumbnail_url).length;
  const missingWikipedia = species.filter((s) => !s.wikipedia_url).length;

  return (
    <AdminLayout title="Species Management">

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: species.length, color: 'bg-nature-100 text-nature-800' },
            { label: 'Birds', value: species.filter((s) => s.category === 'Bird').length, color: 'bg-sky-100 text-sky-800' },
            { label: 'Mammals', value: species.filter((s) => s.category === 'Mammal').length, color: 'bg-amber-100 text-amber-800' },
            { label: 'Missing Images', value: missingImages, color: 'bg-red-100 text-red-800' },
            { label: 'Missing Wiki', value: missingWikipedia, color: 'bg-orange-100 text-orange-800' },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs font-medium opacity-80">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Sync controls */}
        <div className="rounded-xl bg-white border border-gray-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Sync from Markdown</p>
            <p className="text-xs text-gray-500">Re-import all species from /4_Species/ markdown files.</p>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="btn-primary py-2.5 px-4 text-base disabled:opacity-60"
          >
            {isSyncing ? 'Syncing...' : 'Run Sync'}
          </button>
        </div>

        {syncOutput && (
          <div className="rounded-xl bg-gray-900 p-4 overflow-x-auto">
            <pre className="text-xs text-green-400 whitespace-pre-wrap">{syncOutput}</pre>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search species..."
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
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value)}
            className="input-field sm:w-40"
          >
            <option value="All">All Rarities</option>
            <option value="Common">Common</option>
            <option value="Uncommon">Uncommon</option>
          </select>
        </div>

        {isLoading ? (
          <div className="rounded-xl bg-white border border-gray-200 p-8 text-center text-gray-500">
            <div className="w-8 h-8 border-2 border-nature-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p>Loading species...</p>
          </div>
        ) : (
          <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rarity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observations</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Links</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                        No species found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {s.thumbnail_url ? (
                            <img
                              src={s.thumbnail_url}
                              alt={s.display_name}
                              className="w-12 h-12 object-contain rounded bg-gray-100"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
                              <span className="text-[10px] text-gray-400 text-center leading-tight">No<br/>img</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/species/${s.slug}`}
                            className="text-sm font-medium text-nature-800 hover:text-nature-600"
                          >
                            {s.display_name}
                          </Link>
                          <p className="text-xs text-gray-400 mt-0.5">{s.sort_name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              categoryBadgeStyles[s.category] ?? 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {s.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.rarity}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.observation_count}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {s.wikipedia_url && (
                              <a
                                href={s.wikipedia_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-nature-600 hover:text-nature-800 underline"
                              >
                                Wiki
                              </a>
                            )}
                            {!s.wikipedia_url && (
                              <span className="text-xs text-red-400">No Wiki</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function AdminSpeciesPage() {
  return (
    <AdminGuard>
      <AdminSpeciesPageContent />
    </AdminGuard>
  );
}
