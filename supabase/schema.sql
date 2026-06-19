-- Kelowna Wildlife Tracker - Database Schema (Version 1)
-- Run this in your Supabase SQL Editor

-- Observations table
CREATE TABLE IF NOT EXISTS observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_type TEXT NOT NULL DEFAULT 'wildlife' CHECK (observation_type IN ('wildlife', 'structure')),
  species_category TEXT,
  species_name TEXT,
  structure_category TEXT,
  structure_name TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  observation_timestamp TIMESTAMPTZ NOT NULL,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster map queries
CREATE INDEX IF NOT EXISTS idx_observations_location ON observations (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_observations_timestamp ON observations (observation_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_observations_type ON observations (observation_type);
CREATE INDEX IF NOT EXISTS idx_observations_structure_category ON observations (structure_category);

-- Species table (dynamic, driven by markdown files)
CREATE TABLE IF NOT EXISTS species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'Common',
  slug TEXT NOT NULL UNIQUE,
  wikipedia_url TEXT,
  thumbnail_url TEXT,
  image_source TEXT,
  observation_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_species_category ON species (category);
CREATE INDEX IF NOT EXISTS idx_species_slug ON species (slug);
CREATE INDEX IF NOT EXISTS idx_species_display_name ON species (display_name);
CREATE INDEX IF NOT EXISTS idx_species_rarity ON species (rarity);

-- Enable Row Level Security (RLS) but allow public access for Version 1
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE species ENABLE ROW LEVEL SECURITY;

-- Observations policies
CREATE POLICY "Allow anonymous inserts" ON observations
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous selects" ON observations
  FOR SELECT TO anon USING (true);

-- Species policies (public read/write for build sync)
CREATE POLICY "Allow anonymous selects on species" ON species
  FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous inserts on species" ON species
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous updates on species" ON species
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous deletes on species" ON species
  FOR DELETE TO anon USING (true);

-- Storage bucket for wildlife photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('wildlife-photos', 'wildlife-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public uploads to wildlife-photos bucket
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'wildlife-photos');
CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'wildlife-photos');
