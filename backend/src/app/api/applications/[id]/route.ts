import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { ApiError, jsonError } from "@/lib/http";
import {
  canTransitionApplication,
  deleteApplication,
  getApplication,
  updateApplication,
  APPLICATION_TRANSITIONS
} from "@/lib/db/applications";
import { applicationUpdateSchema } from "@/lib/validation";

// SECTION: Authenticated application update.
// PATCH /api/applications/:id
//
// Validates the requested transition against the live six-state machine
// (draft -> ready -> submitted -> in_review -> accepted | rejected)
// BEFORE writing. The state machine is the source of truth — the
// route never invents a transition.
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Request body must be valid JSON." } },
        { status: 400 }
      );
    }
    const parsed = applicationUpdateSchema.parse(body);

    let current;
    try {
      current = await getApplication(id, user.accessToken);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw error;
    }
    if (!current) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: `No application found with id ${id}.` } },
        { status: 404 }
      );
    }

    // If the client requests the same status we already have, treat it as a no‑op.
    if (parsed.status === current.status) {
      // Return the current application without touching the DB.
      return NextResponse.json({ application: current });
    }

    if (!canTransitionApplication(current.status, parsed.status)) {
      const allowed = APPLICATION_TRANSITIONS[current.status];
      return NextResponse.json(
        {
          error: {
            code: "ILLEGAL_TRANSITION",
            message: `Cannot move from ${current.status} to ${parsed.status}.`,
            from: current.status,
            to: parsed.status,
            allowed_next: allowed
          }
        },
        { status: 409 }
      );
    }

    const application = await updateApplication(
      id,
      { status: parsed.status, notes: parsed.notes },
      user.accessToken
    );
    return NextResponse.json({ application });
  } catch (error) {
    return jsonError(error);
  }
}
// End of section: a 409 carries the list of valid next states so the
// frontend can render an honest error rather than guessing what moves
// are allowed.

// SECTION: Authenticated application delete.
// DELETE /api/applications/:id
//
// Removes an application from the student's tracker. Idempotent: 200
// whether the row existed or not. RLS ensures we can only delete rows
// whose `profile_id` matches the caller.
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    await deleteApplication(id, user.accessToken);
    return NextResponse.json({ status: "ok", message: "Application removed from tracker." });
  } catch (error) {
    return jsonError(error);
  }
}
// End of section: the DELETE response is intentionally simpler than
// PATCH — there's no state to validate and no 409 path.