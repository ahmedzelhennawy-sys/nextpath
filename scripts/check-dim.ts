import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

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
  // Try writing a 2048-dim vector. If the column IS 2048, it'll succeed (the value will fit).
  // If it's still 768, we'll get "expected 768 dimensions, not 2048".
  const bigVec = new Array(2048).fill(0).join(",");
  const { error: e2048 } = await supabase
    .from("opportunities")
    .update({ embedding: `[${bigVec}]` })
    .eq("id", "a0000001-0000-0000-0000-000000000001");
  console.log("2048-dim write:", e2048?.message ?? "OK");

  // Revert
  await supabase
    .from("opportunities")
    .update({ embedding: null })
    .eq("id", "a0000001-0000-0000-0000-000000000001");

  // Try writing a 768-dim vector
  const vec768 = new Array(768).fill(0).join(",");
  const { error: e768 } = await supabase
    .from("opportunities")
    .update({ embedding: `[${vec768}]` })
    .eq("id", "a0000001-0000-0000-0000-000000000001");
  console.log("768-dim write:", e768?.message ?? "OK");

  // Revert
  await supabase
    .from("opportunities")
    .update({ embedding: null })
    .eq("id", "a0000001-0000-0000-0000-000000000001");
}
main();
