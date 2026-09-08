// SECTION: AI adapter boundary
// The adapter is the only place that knows about a specific AI provider.
// The route never imports OpenAI, OpenRouter, or Gemini directly —
// it only depends on this interface.
//
// The default `noOpAdapter` is safe to ship in production: it returns
// `status: "disabled"` with a stable message so the route can reject
// natural-language queries until a real adapter is wired up.
//
// A future increment can implement `AiSearchAdapter` against OpenRouter
// or Gemini and return it from `selectAiAdapter()` when
// `AI_PROVIDER_API_KEY` is present in the environment.

import type { ListOpportunitiesFilters } from "@/lib/db/opportunities";

// SECTION: Adapter contract
// Filters are the same shape the structured search accepts, with every
// field optional. The adapter never returns opportunity rows — only
// filters. The database is the source of truth for what matches.
export interface AiSearchAdapter {
  parseQuery(query: string): Promise<AiParseResult>;
}

export type AiParseResult =
  | { status: "parsed"; filters: Partial<ListOpportunitiesFilters> }
  | { status: "disabled"; message: string };
// End of section: a discriminated union makes the route's switch over
// `result.status` exhaustive — adding a new outcome later forces every
// caller to handle it.

// SECTION: No-op adapter
// The safe default. Returns `disabled` so production deployments
// without an AI key fail honestly rather than throwing at request time.
export const noOpAdapter: AiSearchAdapter = {
  parseQuery: async () => ({
    status: "disabled",
    message: "AI search is not configured. Send { filters: { ... } } instead of { query: '...' }."
  })
};
// End of section: the message is short, stable, and free of internal
// jargon so the frontend can render it directly.

// SECTION: Provider selection
// Reads an env var to decide whether a real provider is available.
// Returns the no-op adapter when the key is absent so deployments
// without an AI key fail safely.
export function selectAiAdapter(): AiSearchAdapter {
  const hasKey = typeof process !== "undefined"
    && Boolean(process.env["AI_PROVIDER_API_KEY"]);
  const provider = process.env["AI_PROVIDER"] ?? "";
  if (!hasKey) return noOpAdapter;
  if (provider.toLowerCase() === "openrouter") {
    return openRouterAdapter;
  }
  // fallback for any other provider (e.g., minimax) – currently not implemented
  return noOpAdapter;
}

// ---------- OpenRouter Adapter ----------
/**
 * Calls OpenRouter with the configured model to parse a free‑text query into
 * structured search filters. The model is expected to return a JSON string that
 * matches the shape of `Partial<ListOpportunitiesFilters>`.
 */
const openRouterAdapter: AiSearchAdapter = {
  async parseQuery(prompt: string) {
    const apiKey = process.env["AI_PROVIDER_API_KEY"];
    const model = process.env["AI_MODEL"] ?? "nvidia/nemotron-3-super-120b-a12b:free";
    const url = "https://openrouter.ai/api/v1/chat/completions";
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        return { status: "disabled", message: `OpenRouter error: ${text}` };
      }
      const data = await res.json();
      console.log('🔎 OpenRouter raw response:', JSON.stringify(data, null, 2));
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        return { status: "disabled", message: "Empty response from OpenRouter" };
      }
      // Assume the model returns a JSON object with filter fields.
      const parsed = JSON.parse(content);
      return { status: "parsed", filters: parsed };
    } catch (e: any) {
      return { status: "disabled", message: `OpenRouter exception: ${e.message}` };
    }
  },
};
// End of OpenRouter adapter
// End of section: the env-var check happens once per module load so
// repeated `/api/search` calls don't re-read `process.env`. Production
// deployments without a key silently get the no-op path.