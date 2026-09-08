import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { getEligibilityForUser } from "@/services/eligibility";

// SECTION: Authenticated, deterministic eligibility endpoint.
// GET /api/opportunities/:id/eligibility
//
// Validates the user's Bearer token, loads the matching profile + the
// opportunity + its `eligibility_requirements` rows, and runs the pure
// engine. The engine never writes data, never calls AI, and never
// makes a network call.
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const result = await getEligibilityForUser(user.accessToken, user.id, id);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
// End of section: a single GET returns the four-state verdict plus
// structured per-requirement checks and "why not?" reasons. The
// deadline rule treats "deadline is today" as valid.