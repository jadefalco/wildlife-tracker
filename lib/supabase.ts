import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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
  species_category: 'Bird' | 'Mammal' | 'Reptile / Amphibian';
  species_name: string;
  latitude: number;
  longitude: number;
  observation_timestamp: string;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface CreateObservationInput {
  species_category: 'Bird' | 'Mammal' | 'Reptile / Amphibian';
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
  const fileExt = file.name.split('.').pop() ?? 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await client.storage
    .from('wildlife-photos')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = client.storage.from('wildlife-photos').getPublicUrl(filePath);
  return data.publicUrl;
}
