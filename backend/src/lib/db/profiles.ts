import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "@/lib/http";
import { createUserSupabase } from "@/lib/supabase";

// SECTION: Row shapes and public types
// Matches the live `profiles` table joined with the related profile_*,
// `education`, `experience`, `interests` tables. Foreign keys:
//   - education.profile_id   -> profiles.id
//   - profile_skills.profile_id -> profiles.id  (joins skills on skill_id)
//   - profile_languages.profile_id -> profiles.id (joins languages on language_id)
//   - experience.profile_id  -> profiles.id
//   - interests.profile_id   -> profiles.id
export interface DatabaseProfileRow {
  id: string;
  full_name: string | null;
  age: number | null;
  nationality: string | null;
  country_of_residence: string | null;
  bio: string | null;
  completeness_pct: number | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseEducationRow {
  id: string;
  profile_id: string;
  institution: string;
  degree_level: string;
  major: string | null;
  year_of_study: number | null;
  gpa: number | null;
  gpa_scale: number | null;
  graduation_year: number | null;
  is_current: boolean | null;
}

export interface DatabaseLanguageRow {
  id: string;
  name: string;
  iso_code: string | null;
}

export interface DatabaseSkillRow {
  id: string;
  name: string;
  category: string | null;
}

export interface DatabaseProfileLanguageJoinRow {
  profile_id: string;
  language_id: string;
  proficiency: string | null;
  test_name: string | null;
  test_score: number | null;
  languages: DatabaseLanguageRow | DatabaseLanguageRow[] | null;
}

export interface DatabaseProfileSkillJoinRow {
  profile_id: string;
  skill_id: string;
  proficiency: string | null;
  skills: DatabaseSkillRow | DatabaseSkillRow[] | null;
}

export interface DatabaseExperienceRow {
  id: string;
  profile_id: string;
  type: string;
  title: string;
  organization: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface DatabaseInterestRow {
  id: string;
  profile_id: string;
  label: string;
}

export interface DatabaseProfileWithRelated {
  profile: DatabaseProfileRow;
  educations: DatabaseEducationRow[];
  skills: Array<{ skill_id: string; name: string; proficiency: string | null }>;
  languages: Array<{
    language_id: string;
    name: string;
    proficiency: string | null;
    test_name: string | null;
    test_score: number | null;
  }>;
  experience: DatabaseExperienceRow[];
  interests: DatabaseInterestRow[];
}

export interface ProfileUpdatePayload {
  full_name?: string;
  age?: number;
  nationality?: string;
  country_of_residence?: string;
  bio?: string;
}
// End of section: types live next to the repository so callers don't
// have to import a separate module just to type a function parameter.

// SECTION: Supabase client resolution
// Profile reads always need the per-request user-scoped client so RLS
// resolves `auth.uid()` to the real student. `createUserSupabase` is
// the boundary the auth helper already establishes.
function clientOrThrow(accessToken: string, provided?: SupabaseClient | null): SupabaseClient {
  if (provided) return provided;
  const client = createUserSupabase(accessToken);
  if (!client) throw new ApiError(500, "CONFIGURATION_ERROR", "Supabase is not configured");
  return client;
}
// End of section: profile reads are ALWAYS user-scoped. There is no
// service-role fallback here.

// SECTION: Row mappers
// PostgREST can return joined rows as either an object or a single-element
// array depending on the relationship cardinality. We normalize to the
// first element so the rest of the codebase can rely on one shape.
function pickFirst<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}
// End of section: a single helper used by every mapper below.

// SECTION: Public read
// Loads the authenticated user's profile plus the related tables the
// eligibility and match engines need. Returns `null` when the profile
// row doesn't exist yet (a normal state for a fresh signup, not an
// error).
export async function getProfileById(
  userId: string,
  accessToken: string,
  provided?: SupabaseClient | null
): Promise<DatabaseProfileWithRelated | null> {
  const client = clientOrThrow(accessToken, provided);

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw new ApiError(500, "DATABASE_ERROR", "Could not retrieve profile");
  if (!profile) return null;

  // Parallel reads against the related tables. Each query is filtered by
  // `profile_id` so the row-level security policy on the related tables
  // resolves `auth.uid() = profile_id` against the same JWT and returns
  // only the rows this student owns.
  const [educationsRes, skillsRes, languagesRes, experienceRes, interestsRes] = await Promise.all([
    client.from("education").select("*").eq("profile_id", userId),
    client.from("profile_skills").select("skill_id, proficiency, skills(name)").eq("profile_id", userId),
    client
      .from("profile_languages")
      .select("language_id, proficiency, test_name, test_score, languages(name)")
      .eq("profile_id", userId),
    client.from("experience").select("*").eq("profile_id", userId),
    client.from("interests").select("*").eq("profile_id", userId)
  ]);

  for (const result of [educationsRes, experienceRes, interestsRes, skillsRes, languagesRes]) {
    if (result.error) throw new ApiError(500, "DATABASE_ERROR", "Could not retrieve profile relations");
  }

  return {
    profile: profile as DatabaseProfileRow,
    educations: (educationsRes.data ?? []) as DatabaseEducationRow[],
    skills: ((skillsRes.data ?? []) as Array<Record<string, unknown>>).map((row) => {
      const skill = pickFirst(row["skills"] as DatabaseSkillRow | DatabaseSkillRow[] | null);
      return {
        skill_id: String(row["skill_id"]),
        name: skill?.name ?? "",
        proficiency: (row["proficiency"] as string | null) ?? null
      };
    }),
    languages: ((languagesRes.data ?? []) as Array<Record<string, unknown>>).map((row) => {
      const language = pickFirst(row["languages"] as DatabaseLanguageRow | DatabaseLanguageRow[] | null);
      return {
        language_id: String(row["language_id"]),
        name: language?.name ?? "",
        proficiency: (row["proficiency"] as string | null) ?? null,
        test_name: (row["test_name"] as string | null) ?? null,
        test_score: row["test_score"] == null ? null : Number(row["test_score"])
      };
    }),
    experience: (experienceRes.data ?? []) as DatabaseExperienceRow[],
    interests: (interestsRes.data ?? []) as DatabaseInterestRow[]
  };
}
// End of section: a single read entry point that powers both the
// eligibility and match engines. No engine reaches into the database
// directly.

// SECTION: Public write
// Updates only the fields the live `profiles` table exposes. Related
// tables stay out of scope in this increment; the frontend team can
// add PUT /api/profile/educations and friends when they're ready.
export async function updateProfile(
  userId: string,
  payload: ProfileUpdatePayload,
  accessToken: string,
  provided?: SupabaseClient | null
): Promise<DatabaseProfileRow> {
  const client = clientOrThrow(accessToken, provided);
  const { data, error } = await client
    .from("profiles")
    .update(payload)
    .eq("id", userId)
    .select()
    .maybeSingle();
  if (error) throw new ApiError(500, "DATABASE_ERROR", "Could not update profile");
  if (!data) throw new ApiError(404, "PROFILE_NOT_FOUND", "Profile not found");
  return data as DatabaseProfileRow;
}
// End of section: returns 404 only when no row matched the UPDATE —
// this can happen if the row was deleted concurrently, which is
// information the route should surface rather than mask as a 500.