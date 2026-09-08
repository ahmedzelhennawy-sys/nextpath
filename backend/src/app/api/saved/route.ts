import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { ApiError, jsonError } from "@/lib/http";
import { listSavedByUser, saveOpportunity } from "@/lib/db/saved";
import { savedCreateSchema } from "@/lib/validation";

// SECTION: Authenticated saved-opportunities list.
// GET /api/saved
//
// Returns every saved opportunity for the authenticated user. An empty
// list is a 200 with `items: []` — not an error.
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireUser(request);
    const { items, count } = await listSavedByUser(user.accessToken);
    return NextResponse.json({ items, count });
  } catch (error) {
    return jsonError(error);
  }
}
// End of section: uses the per-request Supabase client, so RLS
// `auth.uid() = profile_id` automatically scopes the result.

// SECTION: Authenticated save.
// POST /api/saved
//
// Validates the body, then inserts a row in `saved_opportunities`. The
// live composite primary key `(profile_id, opportunity_id)` means a
// duplicate insert raises a unique-constraint violation; the route
// translates that to a 409.
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireUser(request);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Request body must be valid JSON." } },
        { status: 400 }
      );
    }
    const parsed = savedCreateSchema.parse(body);
    try {
      const saved = await saveOpportunity(user.id, parsed.opportunity_id, user.accessToken);
      return NextResponse.json({ saved }, { status: 201 });
    } catch (error) {
      if (error instanceof ApiError && /duplicate key/i.test(error.message)) {
        return NextResponse.json(
          { error: { code: "ALREADY_SAVED", message: "You have already saved this opportunity." } },
          { status: 409 }
        );
      }
      if (error instanceof ApiError && /foreign key/i.test(error.message)) {
        return NextResponse.json(
          { error: { code: "INVALID_OPPORTUNITY", message: `Opportunity ${parsed.opportunity_id} does not exist.` } },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    return jsonError(error);
  }
}
// End of section: error mapping follows the same 401 / 400 / 409 / 500
// pattern as the second reference backend's saved route.