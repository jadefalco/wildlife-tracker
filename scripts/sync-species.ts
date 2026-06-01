/**
 * Build-time script: Parse species markdown files and sync to Supabase.
 *
 * Run with: npx tsx scripts/sync-species.ts
 * Or as part of npm run build.
 */


import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import { createClient } from '@supabase/supabase-js';
import { parseAllSpeciesFiles, toSlug } from '../lib/species-parser';

dotenv.config({
  path: path.resolve(process.cwd(), '.env.local'),
});

console.log('Current directory:', process.cwd());
console.log('.env.local exists:', fs.existsSync('.env.local'));

console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20));

const SPECIES_DIR = path.resolve(__dirname, '../4_Species');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isPlaceholder =
  !supabaseUrl ||
  !supabaseKey ||
  supabaseUrl.includes('your-project') ||
  supabaseKey.includes('your-anon-key');

if (isPlaceholder) {
  console.warn('WARN: Supabase credentials are not configured. Skipping species sync.');
  console.warn('      Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable sync.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface WikipediaSummary {
  title?: string;
  thumbnail?: { source: string; width: number; height: number };
  description?: string;
}

async function fetchWikipediaData(displayName: string): Promise<WikipediaSummary | null> {
  try {
    const encoded = encodeURIComponent(displayName.replace(/\s+/g, '_'));
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'KelownaWildlifeTracker/1.0' } });
    if (!res.ok) {
      if (res.status === 404) return null;
      console.warn(`  Wikipedia API error ${res.status} for ${displayName}`);
      return null;
    }
    return (await res.json()) as WikipediaSummary;
  } catch (err) {
    console.warn(`  Failed to fetch Wikipedia data for ${displayName}:`, (err as Error).message);
    return null;
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function sync() {
  console.log('=== Kelowna Wildlife Tracker — Species Sync ===\n');
  console.log(`Reading species from: ${SPECIES_DIR}\n`);

  const { allSpecies, allLogs } = parseAllSpeciesFiles(SPECIES_DIR);

  for (const log of allLogs) {
    console.log(log);
  }

  if (allSpecies.length === 0) {
    console.error('ERROR: No species found. Aborting.');
    process.exit(1);
  }

  // Fetch existing species from database for comparison
  const { data: existingData, error: fetchError } = await supabase
  .from('species')
  .select('slug, id, thumbnail_url');

  if (fetchError) {
    console.error('ERROR: Failed to fetch existing species:', fetchError.message);
    process.exit(1);
  }

const existingSpecies = new Map<
  string,
  {
    id: string;
    thumbnail_url: string | null;
  }
>();
for (const row of existingData ?? []) {
  existingSpecies.set(row.slug, {
    id: row.id,
    thumbnail_url: row.thumbnail_url,
  });
}

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let missingImages = 0;
  let missingWikipedia = 0;

  for (let i = 0; i < allSpecies.length; i++) {
    const s = allSpecies[i];
const existing = existingSpecies.get(s.slug);
const isExisting = !!existing;
    console.log(`[${i + 1}/${allSpecies.length}] ${s.displayName}`);

    // Fetch Wikipedia thumbnail
  let thumbnailUrl = existing?.thumbnail_url ?? null;
let imageSource = thumbnailUrl ? 'Wikipedia' : null;

if (!thumbnailUrl) {
  const wikiData = await fetchWikipediaData(s.displayName);

  await sleep(1500);

  thumbnailUrl = wikiData?.thumbnail?.source ?? null;
  imageSource = thumbnailUrl ? 'Wikipedia' : null;

  if (!thumbnailUrl) missingImages++;
  if (!wikiData) missingWikipedia++;
}

    const payload = {
      sort_name: s.sortName,
      display_name: s.displayName,
      category: s.category,
      rarity: s.rarity,
      slug: s.slug,
      wikipedia_url: s.wikipediaUrl,
      thumbnail_url: thumbnailUrl,
      image_source: imageSource,
      updated_at: new Date().toISOString(),
    };

    if (isExisting) {
      const { error } = await supabase
        .from('species')
        .update(payload)
        .eq('slug', s.slug);

      if (error) {
        console.warn(`  UPDATE FAILED: ${error.message}`);
        skipped++;
      } else {
        console.log(`  → Updated`);
        updated++;
      }
    } else {
      const { error } = await supabase.from('species').insert({
        ...payload,
        observation_count: 0,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.warn(`  INSERT FAILED: ${error.message}`);
        skipped++;
      } else {
        console.log(`  → Imported`);
        imported++;
      }
    }
  }

  // Remove species that no longer exist in markdown files
  const currentSlugs = new Set(allSpecies.map((s) => s.slug));
 const toDelete: string[] = [];

Array.from(existingSpecies.entries()).forEach(([slug, species]) => {
  if (!currentSlugs.has(slug)) {
    toDelete.push(species.id);
  }
});

  let deleted = 0;
  if (toDelete.length > 0) {
    const { error } = await supabase.from('species').delete().in('id', toDelete);
    if (error) {
      console.warn(`WARN: Failed to delete removed species: ${error.message}`);
    } else {
      deleted = toDelete.length;
      console.log(`\nRemoved ${deleted} species no longer in markdown files.`);
    }
  }

  // Update observation counts
  console.log('\nUpdating observation counts...');
  const { data: counts, error: countError } = await supabase
    .from('observations')
    .select('species_name');

  if (!countError && counts) {
    const countMap = new Map<string, number>();
    for (const obs of counts) {
      countMap.set(obs.species_name, (countMap.get(obs.species_name) ?? 0) + 1);
    }

    const entries = Array.from(countMap.entries());
    for (let i = 0; i < entries.length; i++) {
      const [speciesName, count] = entries[i];
      const { error } = await supabase
        .from('species')
        .update({ observation_count: count })
        .eq('display_name', speciesName);
      if (error) {
        console.warn(`  Count update failed for ${speciesName}: ${error.message}`);
      }
    }
  }

  console.log('\n=== Sync Complete ===');
  console.log(`Imported:  ${imported}`);
  console.log(`Updated:   ${updated}`);
  console.log(`Skipped:   ${skipped}`);
  console.log(`Deleted:   ${deleted}`);
  console.log(`Missing images:     ${missingImages}`);
  console.log(`Missing Wikipedia:  ${missingWikipedia}`);
  console.log(`Total species in DB: ${currentSlugs.size}`);
}

sync().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
