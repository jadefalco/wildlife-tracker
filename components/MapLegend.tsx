'use client';

import { useState, useEffect } from 'react';
import { SPECIES_MARKER_TYPES, getSpeciesLegendSvg } from '@/lib/species-markers';
import {
  STRUCTURE_MARKER_TYPES,
  getStructureLegendSvg,
  STRUCTURE_MARKER_LABELS,
} from '@/lib/structure-markers';

export default function MapLegend({ isFormOpen }: { isFormOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || isFormOpen) return null;

  return (
    <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 w-44">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-nature-800 hover:bg-nature-50 rounded-xl transition-colors"
        aria-expanded={isOpen}
      >
        <span>Map Legend</span>
        <svg
          className={`w-4 h-4 text-nature-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 pt-1 max-h-80 overflow-y-auto">
          <div className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Wildlife</div>
          <div className="grid grid-cols-1 gap-2 mb-4">
            {SPECIES_MARKER_TYPES.map((type) => (
              <div key={type} className="flex items-center gap-2">
                <div
                  className="w-5 h-6 flex-shrink-0"
                  dangerouslySetInnerHTML={{ __html: getSpeciesLegendSvg(type) }}
                />
                <span className="text-xs text-gray-700 capitalize">{type}</span>
              </div>
            ))}
          </div>
          <div className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Structures</div>
          <div className="grid grid-cols-1 gap-2">
            {STRUCTURE_MARKER_TYPES.map((type) => (
              <div key={type} className="flex items-center gap-2">
                <div
                  className="w-5 h-6 flex-shrink-0"
                  dangerouslySetInnerHTML={{ __html: getStructureLegendSvg(type) }}
                />
                <span className="text-xs text-gray-700">{STRUCTURE_MARKER_LABELS[type]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
