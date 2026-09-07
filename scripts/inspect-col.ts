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

// Inspect the column metadata via information_schema.
const { data, error } = await supabase.rpc("exec_sql", { sql: `
  SELECT column_name, data_type, udt_name, character_maximum_length, numeric_precision
  FROM information_schema.columns
  WHERE table_name = 'opportunities' AND column_name = 'embedding';
` });
console.log("rpc result:", data, error?.message);

// If rpc doesn't exist, fall back to checking pg_attribute via a known helper.
// Try a simpler read: does the column show up?
const { data: cols } = await supabase
  .from("opportunities")
  .select("embedding")
  .limit(1);
console.log("select result type:", typeof cols?.[0]?.embedding);
