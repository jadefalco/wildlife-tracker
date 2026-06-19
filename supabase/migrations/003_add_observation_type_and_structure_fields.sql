-- Add observation type and structure fields to support Animal Home / Structure reports

ALTER TABLE observations
  ADD COLUMN IF NOT EXISTS observation_type TEXT NOT NULL DEFAULT 'wildlife'
    CHECK (observation_type IN ('wildlife', 'structure')),
  ADD COLUMN IF NOT EXISTS structure_category TEXT,
  ADD COLUMN IF NOT EXISTS structure_name TEXT;

-- Existing species columns must be nullable so structure observations can leave them empty.
ALTER TABLE observations
  ALTER COLUMN species_category DROP NOT NULL,
  ALTER COLUMN species_name DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_observations_type ON observations (observation_type);
CREATE INDEX IF NOT EXISTS idx_observations_structure_category ON observations (structure_category);
