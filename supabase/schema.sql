-- Kelowna Wildlife Tracker - Database Schema (Version 1)
-- Run this in your Supabase SQL Editor

-- Enable PostGIS extension for geospatial queries (optional but recommended for future)
-- create extension if not exists postgis;

-- Observations table
CREATE TABLE IF NOT EXISTS observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species_category TEXT NOT NULL CHECK (species_category IN ('Bird', 'Mammal', 'Reptile / Amphibian')),
  species_name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  observation_timestamp TIMESTAMPTZ NOT NULL,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster map queries
CREATE INDEX IF NOT EXISTS idx_observations_location ON observations (latitude, longitude);

-- Index for sorting by timestamp
CREATE INDEX IF NOT EXISTS idx_observations_timestamp ON observations (observation_timestamp DESC);

-- Enable Row Level Security (RLS) but allow public access for Version 1
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts
CREATE POLICY "Allow anonymous inserts" ON observations
  FOR INSERT TO anon WITH CHECK (true);

-- Allow anonymous selects
CREATE POLICY "Allow anonymous selects" ON observations
  FOR SELECT TO anon USING (true);

-- Storage bucket for wildlife photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('wildlife-photos', 'wildlife-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public uploads to wildlife-photos bucket
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'wildlife-photos');

-- Allow public reads from wildlife-photos bucket
CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'wildlife-photos');
