-- =====================================================================
-- NEXTPATH — Embedding Dimension Migration (v3: no ivfflat)
--
-- pgvector's ivfflat index caps at 2000 dims, but our chosen embedder
-- (nvidia/nemotron-3-embed-1b:free) returns 2048. We drop the index
-- entirely and rely on sequential scan — fine for ~21 rows.
--
-- Re-add an index when:
--   (a) you have 1000+ opportunity rows, AND
--   (b) either your embedder dim <= 2000 (use ivfflat), or
--       your pgvector version supports hnsw with 2048+ dims.
-- =====================================================================

DROP INDEX IF EXISTS idx_opportunities_embedding;
UPDATE opportunities SET embedding = NULL WHERE embedding IS NOT NULL;
ALTER TABLE opportunities ALTER COLUMN embedding TYPE vector(2048);
-- (no index — add later per the comment above)
