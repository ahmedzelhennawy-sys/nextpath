import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { getMatchForUser } from "@/services/match";

// SECTION: Authenticated pure match endpoint.
// GET /api/opportunities/:id/match
//
// The match engine is the second of the two deterministic engines; it
// runs AFTER the eligibility engine decides the student may apply. A
// `NOT_ELIGIBLE` verdict short-circuits here — the response carries
// `match: null` plus a short reason so the frontend can render "not
// eligible — match scoring does not apply" instead of a misleading
// percentage.
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    return NextResponse.json(await getMatchForUser(user.accessToken, user.id, id));
  } catch (error) {
    return jsonError(error);
  }
}
// End of section: the engine never writes data or calls AI.