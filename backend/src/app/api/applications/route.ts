import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { ApiError, jsonError } from "@/lib/http";
import { listApplications, createApplication } from "@/lib/db/applications";
import { applicationCreateSchema } from "@/lib/validation";

// SECTION: Authenticated application list.
// GET /api/applications
//
// Returns every application for the authenticated user. An empty list
// is a 200 with `items: []` — not an error.
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireUser(request);
    const { items, count } = await listApplications(user.accessToken);
    return NextResponse.json({ items, count });
  } catch (error) {
    return jsonError(error);
  }
}
// End of section: uses the per-request Supabase client, so RLS
// `auth.uid() = profile_id` automatically scopes the result.

// SECTION: Authenticated application create.
// POST /api/applications
//
// Validates the body against the LIVE six-state enum
// (`draft | ready | submitted | in_review | accepted | rejected`) — NOT
// the second reference backend's eight-state machine. The unique
// constraint on `(profile_id, opportunity_id)` raises a PostgREST
// `23505` error on duplicates; the route translates that to a 409.
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
    const parsed = applicationCreateSchema.parse(body);
    try {
      const application = await createApplication(
        user.id,
        parsed.opportunity_id,
        parsed.initial_status ?? "draft",
        user.accessToken
      );
      return NextResponse.json({ application }, { status: 201 });
    } catch (error) {
      if (error instanceof ApiError && /duplicate key/i.test(error.message)) {
        return NextResponse.json(
          { error: { code: "ALREADY_TRACKED", message: "You are already tracking this opportunity." } },
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
// End of section: error mapping mirrors `/api/saved` — duplicate keys
// become 409, foreign-key violations become 400, anything else is 500.