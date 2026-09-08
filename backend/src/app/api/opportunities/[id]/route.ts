import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { jsonError } from "@/lib/http";
import { getOpportunityService } from "@/services/opportunities";

// SECTION: Public, read-only detail endpoint.
// GET /api/opportunities/:id
//
// Returns one opportunity with its eligibility_requirements and
// required_documents nested under the same payload. 404 is the only
// non-200 success path the route distinguishes from a real 500.
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const opportunity = await getOpportunityService(id);
    return NextResponse.json({ opportunity });
  } catch (error) {
    return jsonError(error);
  }
}
// End of section: anonymous read access. Eligibility/match routes
// layer their own authenticated reads on top.