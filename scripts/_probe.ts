
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
async function main() {
  const { data, error } = await supabase
    .from("opportunities")
    .select("id, title, embedding")
    .limit(1);
  if (error) {
    console.log("ERROR:", error.message);
    return;
  }
  if (!data || data.length === 0) {
    console.log("NO ROWS");
    return;
  }
  const sample = data[0];
  if (sample.embedding === null) {
    console.log("FIRST ROW embedding: NULL (column exists, vector empty)");
  } else if (Array.isArray(sample.embedding)) {
    console.log("FIRST ROW embedding dim:", sample.embedding.length);
  } else if (typeof sample.embedding === "string") {
    console.log("FIRST ROW embedding as string, length:", sample.embedding.length);
  } else {
    console.log("UNEXPECTED TYPE:", typeof sample.embedding, sample.embedding);
  }
  // Also count rows and how many have non-null embedding
  const { count } = await supabase
    .from("opportunities")
    .select("id", { count: "exact", head: true });
  console.log("TOTAL opportunity rows:", count);

  const { count: withEmb } = await supabase
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .not("embedding", "is", null);
  console.log("with non-null embedding:", withEmb);
}
main().catch(e => { console.log("EXCEPTION:", e.message); process.exit(1); });
