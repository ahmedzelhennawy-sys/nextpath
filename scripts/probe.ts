import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Minimal .env.local loader (no dotenv dependency).
const envLines = readFileSync(".env.local", "utf8").split("\n");
for (const line of envLines) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const { data, error } = await supabase
    .from("opportunities")
    .select("id, title, embedding")
    .limit(2);
  if (error) {
    console.log("ERR:", error.message);
    process.exit(1);
  }
  if (!data?.length) {
    console.log("NO ROWS");
    return;
  }
  const sample = data[0];
  console.log("SAMPLE title:", sample.title);
  console.log("embedding type:", typeof sample.embedding);
  if (sample.embedding === null) console.log("embedding: NULL");
  else if (Array.isArray(sample.embedding))
    console.log("embedding dim:", sample.embedding.length);
  else if (typeof sample.embedding === "string")
    console.log(
      "embedding as string len:",
      sample.embedding.length,
      "first80:",
      sample.embedding.slice(0, 80),
    );

  const { count: total } = await supabase
    .from("opportunities")
    .select("id", { count: "exact", head: true });
  console.log("TOTAL rows:", total);

  const { count: withEmb } = await supabase
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .not("embedding", "is", null);
  console.log("non-null embedding:", withEmb);
}
main();
