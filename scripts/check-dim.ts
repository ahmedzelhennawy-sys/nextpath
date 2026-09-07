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
  // Probe the column dim by trying to write a 1-element vector.
  // If column is vector(2048), this fails with "expected 2048 dimensions".
  // If column is vector(768), it fails with "expected 768 dimensions".
  // If column is unconstrained vector, it succeeds.
  const { error } = await supabase
    .from("opportunities")
    .update({ embedding: "[0.5]" })
    .eq("id", "a0000001-0000-0000-0000-000000000001");
  console.log("1-dim update error message:", error?.message ?? "(none)");
  // Revert
  await supabase
    .from("opportunities")
    .update({ embedding: null })
    .eq("id", "a0000001-0000-0000-0000-000000000001");
}
main();
