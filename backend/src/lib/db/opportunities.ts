import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "@/lib/http";
import { getSupabaseClient } from "@/lib/supabase";

// SECTION: Row shapes and public types
// Matches the live `opportunities` table + nested joins. Adding a new
// column to the table is a one-line change here; the engine and routes
// receive the new shape automatically.
export interface DatabaseRequirementRow {
  id: string;
  requirement_type: string;
  operator: string;
  value: unknown;
  is_mandatory: boolean;
  display_label: string | null;
}

export interface DatabaseRequiredDocumentRow {
  id: string;
  doc_type: string;
  is_mandatory: boolean;
}

export interface DatabaseOrganizationRow {
  id: string;
  name: string;
  type: string | null;
  website: string | null;
}

export interface DatabaseOpportunityRow {
  id: string;
  organization_id: string | null;
  title: string;
  type: string;
  category: string | null;
  field: string | null;
  description: string | null;
  funding_type: string | null;
  funding_amount: number | null;
  funding_currency: string | null;
  location_country: string | null;
  location_city: string | null;
  location_mode: string;
  start_date: string | null;
  end_date: string | null;
  deadline: string | null;
  application_url: string | null;
  source_url: string;
  last_verified_at: string | null;
  verification_status: string;
}

export interface DatabaseOpportunity {
  id: string;
  organization_id: string | null;
  title: string;
  type: string;
  category: string | null;
  field: string | null;
  description: string | null;
  funding_type: string | null;
  funding_amount: number | null;
  funding_currency: string | null;
  location_country: string | null;
  location_city: string | null;
  location_mode: string;
  start_date: string | null;
  end_date: string | null;
  deadline: string | null;
  application_url: string | null;
  source_url: string;
  last_verified_at: string | null;
  verification_status: string;
  organization: DatabaseOrganizationRow | null;
  eligibility_requirements: DatabaseRequirementRow[];
  required_documents: DatabaseRequiredDocumentRow[];
}

export interface ListOpportunitiesFilters {
  types?: string[];
  funding_types?: string[];
  funding_categories?: string[];
  location_types?: string[];
  country?: string;
  field?: string;
  deadline_from?: string;
  deadline_to?: string;
  page: number;
  page_size: number;
}

export interface ListOpportunitiesResult {
  opportunities: DatabaseOpportunity[];
  pagination: { page: number; page_size: number; total: number };
}

// Legacy type alias preserved so the engines can import the same name
// the active backend has always used. New code should reach for
// `DatabaseOpportunity` directly.
export type ExistingOpportunity = DatabaseOpportunity;
export type ExistingRequirement = DatabaseRequirementRow;
export type ExistingRequiredDocument = DatabaseRequiredDocumentRow;
export type ExistingOrganization = DatabaseOrganizationRow;
// End of section: types live next to the repository so callers don't
// have to import a separate module just to type a function parameter.

// SECTION: Supabase client resolution
// Each function accepts an optional Supabase client so tests can inject
// a mock. The default is the shared anon client (safe for the public
// `opportunities` SELECT under the live RLS policy).
function clientOrThrow(provided?: SupabaseClient | null): SupabaseClient {
  if (provided) return provided;
  const client = getSupabaseClient();
  if (!client) throw new ApiError(500, "CONFIGURATION_ERROR", "Supabase is not configured");
  return client;
}
// End of section: explicit null handling rather than implicit trust — a
// misconfigured backend returns 500 immediately, not a cryptic null
// dereference deeper in the call stack.

// SECTION: Row -> public mapper
// The repository always returns the camelCase shape the rest of the
// project uses. `organizations` and `eligibility_requirements` come back
// as PostgREST's `{ organizations: {...} }` nested-object shape, which
// we flatten into the public `organization` field and
// `eligibility_requirements` array.
function rowToOpportunity(row: Record<string, unknown>): DatabaseOpportunity {
  const base = row as unknown as DatabaseOpportunityRow & {
    organizations?: DatabaseOrganizationRow | DatabaseOrganizationRow[] | null;
    eligibility_requirements?: DatabaseRequirementRow[] | null;
    required_documents?: DatabaseRequiredDocumentRow[] | null;
  };
  const org = Array.isArray(base.organizations) ? base.organizations[0] ?? null : base.organizations ?? null;
  return {
    id: base.id,
    organization_id: base.organization_id,
    title: base.title,
    type: base.type,
    category: base.category,
    field: base.field,
    description: base.description,
    funding_type: base.funding_type,
    funding_amount: base.funding_amount,
    funding_currency: base.funding_currency,
    location_country: base.location_country,
    location_city: base.location_city,
    location_mode: base.location_mode,
    start_date: base.start_date,
    end_date: base.end_date,
    deadline: base.deadline,
    application_url: base.application_url,
    source_url: base.source_url,
    last_verified_at: base.last_verified_at,
    verification_status: base.verification_status,
    organization: org,
    eligibility_requirements: base.eligibility_requirements ?? [],
    required_documents: base.required_documents ?? []
  };
}
// End of section: one mapper so every read path produces the same shape.

// SECTION: Public reads
// `listOpportunities` builds a PostgREST query that respects the
// supplied filters. PostgREST evaluates RLS for the anon key, so this
// endpoint is safe to call from a public route.
const DETAIL_SELECT = "*, organizations(*), eligibility_requirements(*), required_documents(*)";

export async function listOpportunities(
  filters: ListOpportunitiesFilters,
  provided?: SupabaseClient | null
): Promise<ListOpportunitiesResult> {
  const client = clientOrThrow(provided);
  let query = client.from("opportunities").select(DETAIL_SELECT, { count: "exact" });

  // Every filter maps to one PostgREST clause. `funding_types` is the
  // canonical live column name; `funding_categories` is a legacy alias
  // for backwards compatibility with older query strings.
  const funding = filters.funding_types?.length ? filters.funding_types : filters.funding_categories;
  if (filters.types?.length) query = query.in("type", filters.types);
  if (funding?.length) query = query.in("funding_type", funding);
  if (filters.location_types?.length) query = query.in("location_mode", filters.location_types);
  if (filters.country) query = query.eq("location_country", filters.country);
  if (filters.field) query = query.ilike("field", `%${filters.field}%`);
  if (filters.deadline_from) query = query.gte("deadline", filters.deadline_from);
  if (filters.deadline_to) query = query.lte("deadline", filters.deadline_to);

  const from = (filters.page - 1) * filters.page_size;
  const { data, error, count } = await query
    .order("deadline", { ascending: true, nullsFirst: false })
    .range(from, from + filters.page_size - 1);
  if (error) throw new ApiError(500, "DATABASE_ERROR", "Could not retrieve opportunities");
  return {
    opportunities: (data ?? []).map((row) => rowToOpportunity(row as Record<string, unknown>)),
    pagination: { page: filters.page, page_size: filters.page_size, total: count ?? 0 }
  };
}
// End of section: `range` is the PostgREST pagination primitive; the
// `count: "exact"` option lets us return total count to the caller
// without a second round-trip.

export async function getOpportunity(
  id: string,
  provided?: SupabaseClient | null
): Promise<DatabaseOpportunity> {
  const client = clientOrThrow(provided);
  const { data, error } = await client.from("opportunities").select(DETAIL_SELECT).eq("id", id).maybeSingle();
  if (error) throw new ApiError(500, "DATABASE_ERROR", "Could not retrieve opportunity");
  if (!data) throw new ApiError(404, "OPPORTUNITY_NOT_FOUND", "Opportunity not found");
  return rowToOpportunity(data as Record<string, unknown>);
}
// End of section: returns 404 only when no row matches — distinct from
// a real Supabase failure (which throws 500).