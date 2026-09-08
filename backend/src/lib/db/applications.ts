import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "@/lib/http";
import { createUserSupabase } from "@/lib/supabase";

// SECTION: Status vocabulary
// The LIVE `applications.status` enum is exactly six values:
//   'draft' | 'ready' | 'submitted' | 'in_review' | 'accepted' | 'rejected'
//
// This is NOT the second reference backend's eight-state machine
// (DISCOVERED/SAVED/PREPARING/READY/SUBMITTED/ACCEPTED/REJECTED/EXPIRED).
// We use the live enum and a small forward-only transition table below.
export type ApplicationStatus =
  | "draft"
  | "ready"
  | "submitted"
  | "in_review"
  | "accepted"
  | "rejected";

export const APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  "draft",
  "ready",
  "submitted",
  "in_review",
  "accepted",
  "rejected"
] as const;
// End of section: a single source of truth for the live enum; both the
// validation schema and the state machine import from here.

// SECTION: Forward-only state machine
// `draft -> ready -> submitted -> in_review -> accepted | rejected`
// `rejected` and `accepted` are terminal. `submitted` can fall back to
// `ready` if the student discovers a missing document before the
// official review starts.
export const APPLICATION_TRANSITIONS: Readonly<Record<ApplicationStatus, readonly ApplicationStatus[]>> = {
  draft: ["ready"],
  ready: ["submitted", "draft"],
  submitted: ["in_review", "ready"],
  in_review: ["accepted", "rejected"],
  accepted: [],
  rejected: []
};

export function canTransitionApplication(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return APPLICATION_TRANSITIONS[from].includes(to);
}
// End of section: a single function every route can call to know
// whether a state change is allowed.

// SECTION: Row shape and public types
export interface DatabaseApplicationRow {
  id: string;
  profile_id: string;
  opportunity_id: string;
  status: ApplicationStatus;
  readiness_pct: number | null;
  submitted_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseApplication {
  id: string;
  profile_id: string;
  opportunity_id: string;
  status: ApplicationStatus;
  readiness_pct: number | null;
  submitted_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListApplicationsResult {
  items: DatabaseApplication[];
  count: number;
}
// End of section: types live next to the repository so callers don't
// have to import a separate module just to type a function parameter.

// SECTION: Supabase client resolution
// Application reads and writes always need the per-request user-scoped
// client so the RLS policy `auth.uid() = profile_id` is honoured.
function clientOrThrow(accessToken: string, provided?: SupabaseClient | null): SupabaseClient {
  if (provided) return provided;
  const client = createUserSupabase(accessToken);
  if (!client) throw new ApiError(500, "CONFIGURATION_ERROR", "Supabase is not configured");
  return client;
}
// End of section: matches the same pattern as the profile and saved
// repositories.

// SECTION: Reads
// Lists every application for the authenticated user, newest update first.
export async function listApplications(
  accessToken: string,
  provided?: SupabaseClient | null
): Promise<ListApplicationsResult> {
  const client = clientOrThrow(accessToken, provided);
  const { data, error } = await client
    .from("applications")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new ApiError(500, "DATABASE_ERROR", "Could not list applications");
  const rows = (data ?? []) as DatabaseApplicationRow[];
  return { items: rows, count: rows.length };
}

export async function getApplication(
  applicationId: string,
  accessToken: string,
  provided?: SupabaseClient | null
): Promise<DatabaseApplication | null> {
  const client = clientOrThrow(accessToken, provided);
  const { data, error } = await client.from("applications").select("*").eq("id", applicationId).maybeSingle();
  if (error) throw new ApiError(500, "DATABASE_ERROR", "Could not load application");
  return (data as DatabaseApplicationRow | null) ?? null;
}
// End of section: zero rows is a 200 with `items: []`, not an error;
// RLS guarantees the caller only sees their own rows.

// SECTION: Writes
// Creates a new application. Defaults to `draft` so the student can
// fill in `notes` and `readiness_pct` over time. The unique constraint
// on `(profile_id, opportunity_id)` raises a PostgREST error with code
// '23505' on duplicates; the route translates that to a 409.
export async function createApplication(
  userId: string,
  opportunityId: string,
  initialStatus: ApplicationStatus,
  accessToken: string,
  provided?: SupabaseClient | null
): Promise<DatabaseApplication> {
  const client = clientOrThrow(accessToken, provided);
  const { data, error } = await client
    .from("applications")
    .insert({
      profile_id: userId,
      opportunity_id: opportunityId,
      status: initialStatus
    })
    .select()
    .maybeSingle();
  if (error) throw new ApiError(500, "APPLICATION_INSERT_FAILED", error.message ?? "Could not create application");
  if (!data) throw new ApiError(500, "APPLICATION_INSERT_FAILED", "Insert did not return a row");
  return data as DatabaseApplication;
}

export async function updateApplication(
  applicationId: string,
  changes: { status?: ApplicationStatus; notes?: string | null },
  accessToken: string,
  provided?: SupabaseClient | null
): Promise<DatabaseApplication> {
  const client = clientOrThrow(accessToken, provided);
  const { data, error } = await client
    .from("applications")
    .update(changes)
    .eq("id", applicationId)
    .select()
    .maybeSingle();
  if (error) throw new ApiError(500, "APPLICATION_UPDATE_FAILED", error.message ?? "Could not update application");
  if (!data) throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application not found");
  return data as DatabaseApplication;
}

export async function deleteApplication(
  applicationId: string,
  accessToken: string,
  provided?: SupabaseClient | null
): Promise<void> {
  const client = clientOrThrow(accessToken, provided);
  const { error } = await client.from("applications").delete().eq("id", applicationId);
  if (error) throw new ApiError(500, "APPLICATION_DELETE_FAILED", error.message ?? "Could not delete application");
}
// End of section: writes go through the same dependency-injection
// pattern as the other repositories. The route layer maps unique-
// constraint and FK errors to 409/400 respectively.