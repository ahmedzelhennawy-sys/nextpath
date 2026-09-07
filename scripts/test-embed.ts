import { readFileSync } from "fs";
const envLines = readFileSync(".env.local", "utf8").split("\n");
for (const line of envLines) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
async function main() {
  const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "nvidia/nemotron-3-embed-1b:free",
      input: "Fulbright Foreign Student Program – Egypt scholarship for Egyptian graduates",
    }),
  });
  console.log("HTTP", res.status);
  if (!res.ok) {
    console.log("body:", (await res.text()).slice(0, 500));
    return;
  }
  const data = await res.json();
  console.log("model:", data.model);
  console.log("dim:", data.data?.[0]?.embedding?.length);
  console.log("usage:", data.usage);
}
main().catch(e => { console.log("EXC:", e.message); });
