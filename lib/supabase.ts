import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { compressImage } from './image-utils';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required. Please check your .env.local file.');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

export interface Observation {
  id: string;
  species_category: string;
  species_name: string;
  latitude: number;
  longitude: number;
  observation_timestamp: string;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface SpeciesRecord {
  id: string;
  sort_name: string;
  display_name: string;
  category: string;
  rarity: string;
  slug: string;
  wikipedia_url: string | null;
  thumbnail_url: string | null;
  image_source: string | null;
  observation_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateObservationInput {
  species_category: string;
  species_name: string;
  latitude: number;
  longitude: number;
  observation_timestamp: string;
  notes?: string | null;
  photo_url?: string | null;
}

export async function createObservation(input: CreateObservationInput): Promise<Observation> {
  const client = getSupabase();
  const { data, error } = await client
    .from('observations')
    .insert({
      species_category: input.species_category,
      species_name: input.species_name,
      latitude: input.latitude,
      longitude: input.longitude,
      observation_timestamp: input.observation_timestamp,
      notes: input.notes ?? null,
      photo_url: input.photo_url ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('No data returned from insert');
  return data as Observation;
}

export async function getObservations(): Promise<Observation[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('observations')
    .select('*')
    .order('observation_timestamp', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Observation[];
}

export async function uploadPhoto(file: File): Promise<string> {
  const client = getSupabase();

  // Compress and resize on the client before uploading.
  // Typical phone photos (3–8 MB) are reduced to ~150–400 KB,
  // keeping the free Supabase storage tier viable as the app scales.
  const compressed = await compressImage(file);

  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await client.storage
    .from('wildlife-photos')
    .upload(filePath, compressed, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = client.storage.from('wildlife-photos').getPublicUrl(filePath);
  return data.publicUrl;
}

// ── Species API ──

export async function getSpecies(): Promise<SpeciesRecord[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('species')
    .select('*')
    .order('display_name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as SpeciesRecord[];
}

export async function getSpeciesByCategory(category: string): Promise<SpeciesRecord[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('species')
    .select('*')
    .eq('category', category)
    .order('display_name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as SpeciesRecord[];
}

export async function getSpeciesBySlug(slug: string): Promise<SpeciesRecord | null> {
  const client = getSupabase();
  const { data, error } = await client
    .from('species')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // no rows
    throw error;
  }
  return data as SpeciesRecord;
}

export async function searchSpecies(query: string): Promise<SpeciesRecord[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('species')
    .select('*')
    .ilike('display_name', `%${query}%`)
    .order('display_name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as SpeciesRecord[];
}

export async function getSpeciesCategories(): Promise<string[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('species')
    .select('category')
    .order('category', { ascending: true });

  if (error) throw error;
  const categories = Array.from(new Set((data ?? []).map((d: { category: string }) => d.category)));
  return categories;
}
