// SECTION: Public read-only opportunity service.
// The service is a thin wrapper around the database repository so route
// handlers don't have to know about Supabase. This is the boundary
// that the live schema evolves through — adding a column to the
// `opportunities` table is a one-line change in `lib/db/opportunities.ts`.

import { listOpportunities, getOpportunity } from "@/lib/db/opportunities";
import type {
  DatabaseOpportunity,
  DatabaseRequirementRow,
  DatabaseRequiredDocumentRow,
  DatabaseOrganizationRow,
  ListOpportunitiesFilters,
  ListOpportunitiesResult
} from "@/lib/db/opportunities";

// Re-export the public shape so the route layer can stay agnostic about
// which layer produced the data.
export type {
  DatabaseOpportunity,
  DatabaseRequirementRow,
  DatabaseRequiredDocumentRow,
  DatabaseOrganizationRow,
  ListOpportunitiesFilters,
  ListOpportunitiesResult
};
export type { ExistingOpportunity, ExistingRequirement, ExistingRequiredDocument, ExistingOrganization } from "@/lib/db/opportunities";

// SECTION: List
// Wraps the repository's `listOpportunities` so the route handler can
// stay narrow. Throws an ApiError if Supabase is not configured — the
// caller catches via `jsonError`.
export async function listOpportunitiesService(
  filters: ListOpportunitiesFilters
): Promise<ListOpportunitiesResult> {
  return listOpportunities(filters);
}
// End of section: a pass-through today, but isolating the boundary
// means a future increment can add caching/feature flags without
// touching the route.

// SECTION: Detail
// Loads one opportunity by id, including its nested
// eligibility_requirements and required_documents. 404 is already
// thrown by the repository.
export async function getOpportunityService(id: string): Promise<DatabaseOpportunity> {
  return getOpportunity(id);
}
// End of section: this is the only read path for the
// `/api/opportunities/:id` route; eligibility and match routes call
// the repository directly so they can share one query.