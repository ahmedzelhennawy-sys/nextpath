import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// SECTION: Env helpers
// The active backend ships its real keys under the legacy SUPABASE_* names
// (.env.local). The second reference backend exposes the same values under
// NEXT_PUBLIC_SUPABASE_* (Next.js App Router convention). Accept either name
// so a teammate can keep either environment file.
function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export function getSupabaseConfig(): { url: string; anonKey: string; serviceKey: string | undefined } {
  const url = readEnv("SUPABASE_URL") ?? readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = readEnv("SUPABASE_ANON_KEY") ?? readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY") ?? readEnv("SUPABASE_SERVICE_KEY");
  return { url: url ?? "", anonKey: anonKey ?? "", serviceKey };
}
// End of section: shared env reader. Returning empty strings rather than
// throwing means downstream code can decide whether to fail fast (server
// boot) or degrade gracefully (e.g. tests that don't need Supabase).

// SECTION: Cached anon client
// One lazily-created client shared across read-only routes. The anon key is
// safe for public-read data (opportunities, organizations,
// eligibility_requirements) — the live RLS policies allow SELECT for the
// `anon` role on those tables.
let cachedAnon: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedAnon) return cachedAnon;
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;
  cachedAnon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  return cachedAnon;
}
// End of section: a `null` return means "Supabase is not configured" so
// tests and the local dev server can boot without keys, while production
// boot can still log a clear error.

export const supabase = getSupabaseClient();

// SECTION: Per-request user client (RLS-respecting)
// PostgREST evaluates RLS policies against the JWT in the request's
// Authorization header. By attaching the user's access token, every query
// this client makes will run under the student's auth context — so
// `auth.uid() = id` on `profiles`, `auth.uid() = profile_id` on
// `education`, etc., actually gate the read.
export function createUserSupabase(accessToken: string): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    accessToken: async () => accessToken,
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}
// End of section: a fresh client per request avoids any shared auth state
// between unrelated requests, mirroring the second reference backend's
// `createAuthenticatedClient`.

// SECTION: Service-role client
// Used only by admin operations (none yet). Kept in one place so the team
// can audit any service-role use; the rule is "never for student requests".
let cachedService: SupabaseClient | null = null;

export function getServiceSupabaseClient(): SupabaseClient | null {
  if (cachedService) return cachedService;
  const { url, serviceKey } = getSupabaseConfig();
  if (!url || !serviceKey) return null;
  cachedService = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  return cachedService;
}
// End of section: explicit factory (instead of a module-level singleton)
// so a test can intentionally avoid touching the service role.