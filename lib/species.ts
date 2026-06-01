import { getSpecies, getSpeciesByCategory, searchSpecies, type SpeciesRecord } from './supabase';

export type { SpeciesRecord };

export { getSpecies, getSpeciesByCategory, searchSpecies };

/**
 * Client-side normalized search for species.
 * Ignores case, punctuation, apostrophes, and supports partial matches.
 */
export function filterSpeciesLocal(species: SpeciesRecord[], query: string): SpeciesRecord[] {
  if (!query.trim()) return species;

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[\s\-'.]/g, '') // remove spaces, hyphens, apostrophes, periods
      .trim();

  const normalizedQuery = normalize(query);
  return species.filter((s) => normalize(s.display_name).includes(normalizedQuery));
}

/**
 * Placeholder image for species without a thumbnail.
 */
export function getPlaceholderImage(category: string): string {
  // Return a data URI SVG placeholder colored by category
  const colors: Record<string, string> = {
    Bird: '#e0f2fe',
    Mammal: '#fef3c7',
    'Reptile / Amphibian': '#d1fae5',
    Fish: '#dbeafe',
    Insect: '#f3e8ff',
  };
  const bg = colors[category] ?? '#f3f4f6';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="${bg}"/>
    <text x="200" y="200" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, sans-serif" font-size="18" fill="#6b7280">${category}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
