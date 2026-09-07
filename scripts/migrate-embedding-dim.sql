-- =====================================================================
-- NEXTPATH — Embedding Dimension Migration
-- Run in Supabase SQL Editor when switching embedders.
--
-- The original schema declared vector(768) for Gemini text-embedding-004.
-- After switching to OpenRouter nvidia/nemotron-3-embed-1b:free, vectors
-- are 2048-dimensional. This file migrates the column safely.
--
-- If you ever switch embedders again, just edit the dim and re-run.
-- =====================================================================

-- 1. Drop any indexes that reference the column (none here, but safe)
DROP INDEX IF EXISTS idx_opportunities_embedding;

-- 2. Wipe existing 768-dim vectors (they would be invalid for 2048-dim space)
UPDATE opportunities SET embedding = NULL;

-- 3. Resize the column. pgvector requires an empty column for ALTER TYPE.
ALTER TABLE opportunities
  ALTER COLUMN embedding TYPE vector(2048)
  USING embedding::vector(2048);

-- 4. Recreate the vector index
CREATE INDEX IF NOT EXISTS idx_opportunities_embedding
  ON opportunities USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 5. Backfill embeddings for all verified opportunities.
-- This requires the OpenRouter client. Run the backfill script:
--   npx tsx scripts/backfill-embeddings.ts
