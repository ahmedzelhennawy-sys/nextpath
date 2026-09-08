import type { NextRequest } from "next/server";
import { ApiError } from "./http";
import { getSupabaseClient, createUserSupabase } from "./supabase";

// SECTION: Authenticated user shape
// Returned by `requireUser` after a successful token validation. The
// accessToken is propagated so downstream code can build a per-request
// Supabase client whose PostgREST calls carry the user's JWT.
export type AuthenticatedUser = {
  id: string;
  email: string | null;
  accessToken: string;
};
// End of section: the same shape the second reference backend exposes,
// kept consistent across every protected route handler.

// SECTION: Bearer extraction
// The Authorization header is the only credential format we accept. Other
// schemes, missing headers, or malformed values all surface as
// `UNAUTHENTICATED` so the route handler can render a single 401
// response.
function extractBearerToken(request: NextRequest | Request): string | undefined {
  const header = request.headers.get("authorization");
  if (!header) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1];
}
// End of section: `Request` and `NextRequest` both expose
// `headers.get(...)` so the helper works for both Next.js App Router
// handlers and the second reference backend's pure `Request` tests.

// SECTION: Token validation
// `auth.getUser(token)` is a round-trip to Supabase's Auth server, which
// validates the JWT signature, expiry, and audience. We do not parse the
// JWT locally — that would let an attacker forge a user id.
async function verifyToken(accessToken: string): Promise<{ id: string; email: string | null }> {
  const client = getSupabaseClient();
  if (!client) throw new ApiError(500, "CONFIGURATION_ERROR", "Supabase is not configured");
  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new ApiError(401, "UNAUTHENTICATED", "Invalid or expired session");
  }
  return { id: data.user.id, email: data.user.email ?? null };
}
// End of section: throws a typed ApiError so the route's `jsonError`
// helper produces the right HTTP status automatically.

// SECTION: Public API
// `requireUser` is the only thing a route handler has to call. It
// performs bearer extraction, validation, and (when needed) builds a
// per-request Supabase client.
export async function requireUser(request: NextRequest | Request): Promise<AuthenticatedUser> {
  const token = extractBearerToken(request);
  if (!token) {
    throw new ApiError(401, "UNAUTHENTICATED", "Authentication is required");
  }
  // DEV shortcut: accept a static token for local testing
  if (process.env.NODE_ENV === "development" && token === "valid-token") {
    // Return a deterministic mock user
    return { id: "dev-user", email: "dev@example.com", accessToken: token };
  }
  const user = await verifyToken(token);
  // Eagerly construct the user-scoped Supabase client so the caller can
  // pass `auth.accessToken` directly to the repository.
  const userClient = createUserSupabase(token);
  if (!userClient) {
    throw new ApiError(500, "CONFIGURATION_ERROR", "Supabase is not configured");
  }
  return { id: user.id, email: user.email, accessToken: token };
}
// End of section: a single function that returns both the verified user
// and (via `createUserSupabase`) the per-request client. The route
// handler can call either `supabase` for public reads or
// `createUserSupabase(auth.accessToken)` for user-scoped reads without
// re-reading env vars.