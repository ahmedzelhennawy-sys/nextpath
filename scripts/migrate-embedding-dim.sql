-- =====================================================================
-- NEXTPATH — Embedding Dimension Migration
-- Run in Supabase SQL Editor when switching embedders.
--
-- Original schema: vector(768) (Gemini text-embedding-004)
-- New schema:      vector(2048) (nvidia/nemotron-3-embed-1b via OpenRouter)
--
-- Idempotent: if the column is already vector(2048), this is a no-op.
-- Safe on NULL values (you have 0 non-null embeddings today).
-- If you ever switch embedders again, edit the dim below and re-run.
-- =====================================================================

-- 1. Drop the index (will recreate after the resize)
DROP INDEX IF EXISTS idx_opportunities_embedding;

-- 2. Wipe any 768-dim vectors — they're in the wrong space for the new dim
UPDATE opportunities SET embedding = NULL WHERE embedding IS NOT NULL;

-- 3. Resize the column. pgvector requires an empty column for dim changes.
--    Only run if the current dim is not already 2048.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'opportunities'
      AND column_name = 'embedding'
      AND udt_name = 'vector'
      AND character_maximum_length <> 2048  -- vector dim is stored as the length
  ) THEN
    ALTER TABLE opportunities
      ALTER COLUMN embedding TYPE vector(2048);
  END IF;
END $$;

-- 4. Recreate the vector index for cosine similarity search
CREATE INDEX IF NOT EXISTS idx_opportunities_embedding
  ON opportunities USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 5. After this completes successfully, populate embeddings:
--      npx tsx scripts/backfill-embeddings.ts
--    (Reads OPENROUTER_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
--     from .env.local in the repo root.)
