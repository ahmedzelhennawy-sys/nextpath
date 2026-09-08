import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { jsonError } from "@/lib/http";
import { listOpportunitiesService } from "@/services/opportunities";

// SECTION: Public read-only opportunity listing.
// GET /api/opportunities
//
// Accepts structured filters as comma-separated query strings
// (`?type=scholarship,internship`) and a `page` / `page_size` pair. Every
// filter maps to a live `opportunities` column, so an anonymous user can
// discover opportunities without authenticating.
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;
    const csv = (name: string): string[] | undefined => {
      const raw = params.get(name);
      if (!raw) return undefined;
      const parts = raw.split(",").map((v) => v.trim()).filter(Boolean);
      return parts.length ? parts : undefined;
    };
    const page = Math.max(1, Number(params.get("page") ?? 1));
    const page_size = Math.min(50, Math.max(1, Number(params.get("page_size") ?? 20)));
    const result = await listOpportunitiesService({
      types: csv("type"),
      funding_types: csv("funding_type"),
      funding_categories: csv("funding_type"),
      location_types: csv("location_mode"),
      country: params.get("country") ?? undefined,
      field: params.get("field") ?? undefined,
      deadline_from: params.get("deadline_from") ?? undefined,
      deadline_to: params.get("deadline_to") ?? undefined,
      page,
      page_size
    });
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
// End of section: anonymous read access; the live RLS policy on
// `opportunities` allows SELECT for the anon role.