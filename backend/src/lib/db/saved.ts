import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "@/lib/http";
import { createUserSupabase } from "@/lib/supabase";

// SECTION: Row shape and public types
// Matches the live `saved_opportunities` table. The composite primary
// key is `(profile_id, opportunity_id)` — there is NO `id` column. The
// public type exposes only the fields the live table actually has.
export interface DatabaseSavedRow {
  profile_id: string;
  opportunity_id: string;
  saved_at: string;
}

export interface DatabaseSavedOpportunity {
  profile_id: string;
  opportunity_id: string;
  saved_at: string;
}

export interface ListSavedResult {
  items: DatabaseSavedOpportunity[];
  count: number;
}
// End of section: types live next to the repository so callers don't
// have to import a separate module just to type a function parameter.

// SECTION: Supabase client resolution
// Saved-opportunity reads and writes always need the per-request
// user-scoped client so the RLS policy `auth.uid() = profile_id` is
// honoured. There is no service-role fallback.
function clientOrThrow(accessToken: string, provided?: SupabaseClient | null): SupabaseClient {
  if (provided) return provided;
  const client = createUserSupabase(accessToken);
  if (!client) throw new ApiError(500, "CONFIGURATION_ERROR", "Supabase is not configured");
  return client;
}
// End of section: matches the same pattern as the profile repository.

// SECTION: Reads
// Lists every saved opportunity for the authenticated user. Ordered by
// `saved_at` descending so the most recent saves surface first.
export async function listSavedByUser(
  accessToken: string,
  provided?: SupabaseClient | null
): Promise<ListSavedResult> {
  const client = clientOrThrow(accessToken, provided);
  const { data, error } = await client
    .from("saved_opportunities")
    .select("*")
    .order("saved_at", { ascending: false });
  if (error) throw new ApiError(500, "DATABASE_ERROR", "Could not list saved opportunities");
  const rows = (data ?? []) as DatabaseSavedRow[];
  return { items: rows, count: rows.length };
}
// End of section: zero rows is a 200 with `items: []`, not an error.

// SECTION: Writes
// Saves an opportunity for the authenticated user. The unique
// constraint on `(profile_id, opportunity_id)` raises a PostgREST error
// with `code: '23505'`; the route translates that to a 409.
export async function saveOpportunity(
  userId: string,
  opportunityId: string,
  accessToken: string,
  provided?: SupabaseClient | null
): Promise<DatabaseSavedOpportunity> {
  const client = clientOrThrow(accessToken, provided);
  const { data, error } = await client
    .from("saved_opportunities")
    .insert({ profile_id: userId, opportunity_id: opportunityId })
    .select()
    .maybeSingle();
  if (error) {
    // The unique-constraint error from PostgREST has a `code` of
    // '23505'. The route layer turns it into a 409 instead of a 500.
    throw new ApiError(500, "SAVED_INSERT_FAILED", error.message ?? "Could not save opportunity");
  }
  if (!data) {
    throw new ApiError(500, "SAVED_INSERT_FAILED", "Insert did not return a row");
  }
  return data as DatabaseSavedOpportunity;
}
// End of section: write paths accept an optional Supabase client and
// throw a descriptive error on Supabase failure.

export async function unsaveOpportunity(
  userId: string,
  opportunityId: string,
  accessToken: string,
  provided?: SupabaseClient | null
): Promise<void> {
  const client = clientOrThrow(accessToken, provided);
  const { error } = await client
    .from("saved_opportunities")
    .delete()
    .eq("profile_id", userId)
    .eq("opportunity_id", opportunityId);
  if (error) throw new ApiError(500, "SAVED_DELETE_FAILED", error.message ?? "Could not remove saved opportunity");
  // Idempotent delete: 200 whether a row existed or not. RLS ensures we
  // can only delete rows whose `profile_id` matches the caller.
}
// End of section: a 404 path is intentionally absent — "already not
// saved" is the same state as "just unsaved" for the user.