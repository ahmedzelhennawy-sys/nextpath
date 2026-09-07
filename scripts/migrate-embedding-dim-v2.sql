-- =====================================================================
-- NEXTPATH — Embedding Dimension Migration (v2: unconditional)
--
-- Run this if migrate-embedding-dim.sql silently no-op'd because
-- information_schema.columns.character_maximum_length is NULL for
-- vector columns (which makes any `<> 2048` check return NULL/false).
-- =====================================================================

DROP INDEX IF EXISTS idx_opportunities_embedding;
UPDATE opportunities SET embedding = NULL WHERE embedding IS NOT NULL;
ALTER TABLE opportunities ALTER COLUMN embedding TYPE vector(2048);
CREATE INDEX IF NOT EXISTS idx_opportunities_embedding
  ON opportunities USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
