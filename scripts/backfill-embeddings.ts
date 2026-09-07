/**
 * Backfill embeddings for all verified opportunities.
 *
 * Usage:
 *   OPENROUTER_API_KEY=sk-or-... \
 *   NEXT_PUBLIC_SUPABASE_URL=https://... \
 *   SUPABASE_SERVICE_ROLE_KEY=ey... \
 *   npx tsx scripts/backfill-embeddings.ts
 *
 * Reads `opportunities` where verification_status = 'verified' AND embedding IS NULL,
 * builds an embed string from title + description + field + category, and updates
 * the row with the new 2048-dim vector.
 */

import { createClient } from "@supabase/supabase-js";
import { generateEmbedding, getEmbeddingDim } from "../src/openrouter-client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY is required.");
    process.exit(1);
  }
  console.log(`Embedding dimension target: ${getEmbeddingDim()}`);

  const { data: opps, error } = await supabase
    .from("opportunities")
    .select("id, title, description, field, category")
    .eq("verification_status", "verified")
    .is("embedding", null);

  if (error) {
    console.error("Supabase read error:", error);
    process.exit(1);
  }
  if (!opps || opps.length === 0) {
    console.log("No opportunities need backfilling.");
    return;
  }

  console.log(`Found ${opps.length} opportunities to embed.`);

  let ok = 0;
  let fail = 0;
  for (const opp of opps) {
    const text = [opp.title, opp.description, opp.field, opp.category]
      .filter(Boolean)
      .join(" | ");

    const vec = await generateEmbedding(text);
    if (!vec) {
      console.warn(`  ✗ ${opp.title} — embedding returned null`);
      fail++;
      continue;
    }

    // pgvector accepts a JSON array of numbers; pass it as a string formatted
    // as '[v1,v2,...]' which supabase-js sends as text and pg casts to vector.
    const vecLiteral = `[${vec.join(",")}]`;

    const { error: upErr } = await supabase
      .from("opportunities")
      .update({ embedding: vecLiteral })
      .eq("id", opp.id);

    if (upErr) {
      console.warn(`  ✗ ${opp.title} — update failed: ${upErr.message}`);
      fail++;
    } else {
      console.log(`  ✓ ${opp.title}`);
      ok++;
    }
  }

  console.log(`\nDone. ok=${ok} fail=${fail}`);
  process.exit(fail > 0 ? 2 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
