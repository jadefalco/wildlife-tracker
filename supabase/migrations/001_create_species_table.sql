-- ============================================================
-- Kelowna Wildlife Tracker — Species System Migration
-- ============================================================
-- Run this in your Supabase SQL Editor:
--   Dashboard → SQL Editor → New Query → Paste → Run
--
-- This migration is idempotent — safe to run multiple times.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Create the species table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'Common',
  slug TEXT NOT NULL,
  wikipedia_url TEXT,
  thumbnail_url TEXT,
  image_source TEXT,
  observation_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure slug is unique across all species
  CONSTRAINT species_slug_unique UNIQUE (slug)
);

-- ------------------------------------------------------------
-- 2. Indexes for fast lookups
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_species_category ON public.species (category);
CREATE INDEX IF NOT EXISTS idx_species_slug ON public.species (slug);
CREATE INDEX IF NOT EXISTS idx_species_display_name ON public.species (display_name);
CREATE INDEX IF NOT EXISTS idx_species_rarity ON public.species (rarity);

-- Full-text search support (optional but recommended for future search)
CREATE INDEX IF NOT EXISTS idx_species_display_name_trgm ON public.species USING gin (display_name gin_trgm_ops);

-- ------------------------------------------------------------
-- 3. Enable Row Level Security
-- ------------------------------------------------------------
ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 4. RLS Policies — public read/write for Version 1
-- ------------------------------------------------------------

-- Allow anyone to read species
CREATE POLICY IF NOT EXISTS "Allow anonymous selects on species"
  ON public.species
  FOR SELECT TO anon
  USING (true);

-- Allow anyone to insert species (required for build-time sync script)
CREATE POLICY IF NOT EXISTS "Allow anonymous inserts on species"
  ON public.species
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow anyone to update species (required for build-time sync script)
CREATE POLICY IF NOT EXISTS "Allow anonymous updates on species"
  ON public.species
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete species (required for build-time sync cleanup)
CREATE POLICY IF NOT EXISTS "Allow anonymous deletes on species"
  ON public.species
  FOR DELETE TO anon
  USING (true);

-- ------------------------------------------------------------
-- 5. Auto-update updated_at trigger
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS species_updated_at ON public.species;

CREATE TRIGGER species_updated_at
  BEFORE UPDATE ON public.species
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- 6. Observation count refresh function
-- ------------------------------------------------------------
-- Call this after bulk imports or when observation data changes:
--   SELECT public.refresh_species_observation_counts();
CREATE OR REPLACE FUNCTION public.refresh_species_observation_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.species s
  SET observation_count = COALESCE(cnt.count, 0)
  FROM (
    SELECT species_name, COUNT(*) as count
    FROM public.observations
    GROUP BY species_name
  ) cnt
  WHERE s.display_name = cnt.species_name;
END;
$$;

-- ------------------------------------------------------------
-- 7. Optional: Auto-increment observation_count on new observation
-- ------------------------------------------------------------
-- This trigger keeps observation_count in sync automatically
-- when users submit new sightings through the app.
CREATE OR REPLACE FUNCTION public.increment_species_observation_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.species
  SET observation_count = observation_count + 1
  WHERE display_name = NEW.species_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS observations_increment_count ON public.observations;

CREATE TRIGGER observations_increment_count
  AFTER INSERT ON public.observations
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_species_observation_count();

-- ------------------------------------------------------------
-- 8. Verify migration succeeded
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'species'
  ) THEN
    RAISE NOTICE 'SUCCESS: public.species table created.';
  ELSE
    RAISE EXCEPTION 'FAILURE: public.species table was not created.';
  END IF;
END $$;
