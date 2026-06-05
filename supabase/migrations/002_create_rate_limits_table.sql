-- ============================================================
-- Kelowna Wildlife Tracker — Rate Limiting Table
-- ============================================================
-- Run this in your Supabase SQL Editor:
--   Dashboard → SQL Editor → New Query → Paste → Run
--
-- This migration is idempotent — safe to run multiple times.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Create the rate_limits table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
  ip_address TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. Index for fast cleanup of expired windows
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits (window_start);

-- ------------------------------------------------------------
-- 3. Enable Row Level Security
-- ------------------------------------------------------------
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 4. RLS Policies — public access for Version 1
-- ------------------------------------------------------------
CREATE POLICY IF NOT EXISTS "Allow anonymous selects on rate_limits"
  ON public.rate_limits
  FOR SELECT TO anon
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow anonymous inserts on rate_limits"
  ON public.rate_limits
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow anonymous updates on rate_limits"
  ON public.rate_limits
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow anonymous deletes on rate_limits"
  ON public.rate_limits
  FOR DELETE TO anon
  USING (true);

-- ------------------------------------------------------------
-- 5. Verify migration succeeded
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'rate_limits'
  ) THEN
    RAISE NOTICE 'SUCCESS: public.rate_limits table created.';
  ELSE
    RAISE EXCEPTION 'FAILURE: public.rate_limits table was not created.';
  END IF;
END $$;
