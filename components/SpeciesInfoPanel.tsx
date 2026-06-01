'use client';

import type { SpeciesRecord } from '@/lib/supabase';

interface SpeciesInfoPanelProps {
  species: SpeciesRecord | null | undefined;
}

const categoryBadgeStyles: Record<string, string> = {
  Bird: 'bg-sky-100 text-sky-800',
  Mammal: 'bg-amber-100 text-amber-800',
  'Reptile / Amphibian': 'bg-emerald-100 text-emerald-800',
  Fish: 'bg-blue-100 text-blue-800',
  Insect: 'bg-purple-100 text-purple-800',
};

export default function SpeciesInfoPanel({ species }: SpeciesInfoPanelProps) {
  if (!species) {
    return (
      <div className="rounded-xl border border-nature-200 bg-nature-50/60 p-4">
        <p className="text-sm text-nature-800">
          <span className="font-medium">Species not found in database.</span>
        </p>
      </div>
    );
  }

  const isNotSure = species.display_name === 'Not Sure / Other';

  if (isNotSure) {
    return (
      <div className="rounded-xl border border-nature-200 bg-nature-50/60 p-4">
        <p className="text-sm text-nature-800">
          <span className="font-medium">Not Sure / Other</span> — Accurate reporting is more important than guessing.
        </p>
      </div>
    );
  }

  const hasImage = !!species.thumbnail_url;

  return (
    <div className="rounded-xl border border-nature-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5">
        {/* Thumbnail container */}
        {hasImage && (
          <div className="shrink-0 flex items-center justify-center mx-auto sm:mx-0">
            <div
              className="flex items-center justify-center rounded-lg p-2"
              style={{ width: 180, height: 140, backgroundColor: '#f5f5f5' }}
            >
              <img
                src={species.thumbnail_url!}
                alt={species.display_name}
                className="max-w-full max-h-full object-contain rounded"
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <span
            className={`inline-block self-start rounded-full px-2.5 py-0.5 text-xs font-semibold mb-2 ${
              categoryBadgeStyles[species.category] ?? 'bg-gray-100 text-gray-800'
            }`}
          >
            {species.category}
          </span>

          <h3 className="text-lg font-bold text-nature-900 leading-tight">{species.display_name}</h3>

          <p className="text-sm text-nature-600 mt-1">
            {species.rarity} species
          </p>

          {species.wikipedia_url && (
            <a
              href={species.wikipedia_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-nature-700 hover:text-nature-900 font-medium mt-3 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              Learn More on Wikipedia
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
