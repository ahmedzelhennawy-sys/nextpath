import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { jsonError } from "@/lib/http";
import { selectAiAdapter, type AiParseResult } from "@/lib/search/aiAdapter";
import { searchSchema, aiQuerySchema } from "@/lib/validation";
import { listOpportunitiesService } from "@/services/opportunities";

// SECTION: Structured-filter search with an AI escape hatch.
// POST /api/search
//
// Accepts either:
//   { filters: { ... } }   — direct structured filters, validated by Zod
//   { query: "..." }       — free-text, routed through the AI adapter
//
// The structured path is the default. The AI path is gated on a real
// adapter being configured (env var) and the adapter's output is
// re-validated against `searchSchema` before it reaches the SQL
// builder. AI never returns opportunity rows — only filters.
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Request body must be valid JSON." } },
        { status: 400 }
      );
    }

    // SECTION: Structured path
    if (body && typeof body === "object" && "filters" in (body as Record<string, unknown>)) {
      const filters = searchSchema.parse((body as { filters: unknown }).filters);
      const result = await listOpportunitiesService(filters);
      return NextResponse.json({ ...result, source: "structured" });
    }
    // End of section: the engine never sees untrusted input.

    // SECTION: AI path
    if (body && typeof body === "object" && "query" in (body as Record<string, unknown>)) {
      const { query } = aiQuerySchema.parse(body);
      const adapter = selectAiAdapter();
      const parsed: AiParseResult = await adapter.parseQuery(query);
      if (parsed.status === "disabled") {
        return NextResponse.json(
          { error: { code: "AI_DISABLED", message: parsed.message } },
          { status: 400 }
        );
      }
      // Re-validate the AI's output against the structured schema.
      const filters = searchSchema.parse({ ...parsed.filters, page: parsed.filters.page ?? 1, page_size: parsed.filters.page_size ?? 20 });
      const result = await listOpportunitiesService(filters);
      return NextResponse.json({ ...result, source: "ai" });
    }
    // End of section: the AI extraction is validated by Zod; an
    // attacker who controls the model output cannot inject SQL
    // fragments because the SQL builder only reads typed fields.

    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Body must include either `filters` or `query`." } },
      { status: 400 }
    );
  } catch (error) {
    return jsonError(error);
  }
}
// End of section: the route is intentionally thin. Search logic lives
// in `services/opportunities.ts` and the AI adapter; the route only
// validates and dispatches.