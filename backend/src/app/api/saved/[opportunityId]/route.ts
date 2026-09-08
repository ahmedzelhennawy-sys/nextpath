import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { unsaveOpportunity } from "@/lib/db/saved";

// SECTION: Authenticated unsave.
// DELETE /api/saved/:opportunityId
//
// The `:opportunityId` is the *opportunity* id (not a saved-row id),
// matching the live composite primary key. Idempotent: 200 whether a
// row existed or not — RLS guarantees we can only delete rows whose
// `profile_id` matches the caller.
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ opportunityId: string }> }
): Promise<NextResponse> {
  try {
    const user = await requireUser(request);
    const { opportunityId } = await context.params;
    await unsaveOpportunity(user.id, opportunityId, user.accessToken);
    return NextResponse.json({ status: "ok", message: "Removed from saved list." });
  } catch (error) {
    return jsonError(error);
  }
}
// End of section: 200 means the delete completed. Whether a row
// actually existed is irrelevant — idempotent deletes keep the client
// simple.