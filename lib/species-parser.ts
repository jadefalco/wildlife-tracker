import fs from 'fs';
import path from 'path';

export interface ParsedSpecies {
  sortName: string;
  displayName: string;
  category: string;
  rarity: 'Common' | 'Uncommon';
  slug: string;
  wikipediaUrl: string;
}

export interface ParseResult {
  species: ParsedSpecies[];
  category: string;
  fileName: string;
  logs: string[];
}

/**
 * Convert a sortable name like "Crow, American" to a display name like "American Crow".
 * Handles edge cases like "Finch, American Goldfinch" where the second part already contains the full name.
 */
export function toDisplayName(sortName: string): string {
  const commaIndex = sortName.indexOf(',');
  if (commaIndex === -1) return sortName.trim();

  const part1 = sortName.slice(0, commaIndex).trim();
  const part2 = sortName.slice(commaIndex + 1).trim();

  const p1Lower = part1.toLowerCase();
  const p2Lower = part2.toLowerCase();

  // If part2 already ends with part1 (e.g. "Finch, American Goldfinch"), just use part2
  if (p2Lower.endsWith(p1Lower)) {
    return part2;
  }

  // Standard reversal: "Crow, American" → "American Crow"
  return `${part2} ${part1}`;
}

export function toSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars except spaces and hyphens
    .trim()
    .replace(/\s+/g, '-');       // spaces to hyphens
}

export function toWikipediaUrl(displayName: string): string {
  const encoded = displayName.replace(/\s+/g, '_');
  return `https://en.wikipedia.org/wiki/${encoded}`;
}

function fileNameToCategory(fileName: string): string {
  // Bird_List.md → Bird
  // Mammal_List.md → Mammal
  // Reptile_Amphibian_List.md → Reptile / Amphibian
  const base = path.basename(fileName, '.md');
  const categoryPart = base.replace(/_List$/i, '');
  return categoryPart.replace(/_/g, ' / ');
}

function headingToRarity(heading: string): 'Common' | 'Uncommon' | null {
  const lower = heading.toLowerCase();
  if (lower.includes('common') && !lower.includes('uncommon')) {
    return 'Common';
  }
  if (lower.includes('uncommon') || lower.includes('occasional')) {
    return 'Uncommon';
  }
  return null;
}

export function parseSpeciesFile(filePath: string): ParseResult {
  const logs: string[] = [];
  const fileName = path.basename(filePath);
  const category = fileNameToCategory(fileName);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const species: ParsedSpecies[] = [];
  let currentRarity: 'Common' | 'Uncommon' = 'Common';

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Detect rarity sections
    if (line.startsWith('## ')) {
      const heading = line.slice(3).trim();
      const rarity = headingToRarity(heading);
      if (rarity) {
        currentRarity = rarity;
      }
      continue;
    }

    // Skip sub-headings, non-bullet lines, empty lines
    if (!line.startsWith('* ')) continue;

    const sortName = line.slice(2).trim();
    if (!sortName) {
      logs.push(`WARN: Empty species name in ${fileName}`);
      continue;
    }

    // Skip documentation-only entries
    if (sortName.toLowerCase().includes('purpose') ||
        sortName.toLowerCase().includes('data quality') ||
        sortName.toLowerCase().includes('future expansion') ||
        sortName.toLowerCase().includes('species at risk')) {
      continue;
    }

    // Skip "Not Sure / Other" from being a species record
    if (sortName.toLowerCase() === 'not sure / other') {
      continue;
    }

    const displayName = toDisplayName(sortName);
    const slug = toSlug(displayName);
    const wikipediaUrl = toWikipediaUrl(displayName);

    // Detect duplicates within this file
    if (species.some((s) => s.slug === slug)) {
      logs.push(`WARN: Duplicate species skipped: ${displayName} in ${fileName}`);
      continue;
    }

    species.push({
      sortName,
      displayName,
      category,
      rarity: currentRarity,
      slug,
      wikipediaUrl,
    });
  }

  logs.push(`INFO: Parsed ${species.length} species from ${fileName}`);
  return { species, category, fileName, logs };
}

const EXCLUDED_SPECIES_FILES = new Set(['Animal_Homes_Structures_List.md']);

export function parseAllSpeciesFiles(speciesDir: string): { allSpecies: ParsedSpecies[]; allLogs: string[] } {
  const allSpecies: ParsedSpecies[] = [];
  const allLogs: string[] = [];

  const files = fs.readdirSync(speciesDir)
    .filter((f) => f.endsWith('.md') && !EXCLUDED_SPECIES_FILES.has(f))
    .sort();

  for (const file of files) {
    const filePath = path.join(speciesDir, file);
    const result = parseSpeciesFile(filePath);
    allSpecies.push(...result.species);
    allLogs.push(...result.logs);
  }

  // Cross-file duplicate detection
  const slugMap = new Map<string, ParsedSpecies>();
  const deduped: ParsedSpecies[] = [];
  for (const s of allSpecies) {
    if (slugMap.has(s.slug)) {
      allLogs.push(`WARN: Cross-file duplicate skipped: ${s.displayName} (${s.slug})`);
      continue;
    }
    slugMap.set(s.slug, s);
    deduped.push(s);
  }

  allLogs.push(`INFO: Total unique species: ${deduped.length}`);
  return { allSpecies: deduped, allLogs };
}
