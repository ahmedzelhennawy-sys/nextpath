import { evaluateDatabaseEligibility } from "@/core/eligibility/database-evaluate";
import type { DatabaseRequirement } from "@/core/eligibility/database-evaluate";
import { getOpportunityService } from "@/services/opportunities";
import { getStudentProfile } from "@/services/student-profile";

// SECTION: Public API
// Loads the authenticated user's profile and the requested opportunity
// (with its eligibility_requirements rows), then runs the pure engine.
// Same input -> same output, no AI, no database writes.
export async function getEligibilityForUser(
  accessToken: string,
  userId: string,
  opportunityId: string
): Promise<{
  opportunity_id: string;
  eligibility: ReturnType<typeof evaluateDatabaseEligibility>;
  requirements: DatabaseRequirement[];
}> {
  // Two parallel reads so the response latency is bounded by the slower
  // query, not the sum of both.
  const [profile, opportunity] = await Promise.all([
    getStudentProfile(accessToken, userId),
    getOpportunityService(opportunityId)
  ]);
  const requirements = (opportunity.eligibility_requirements ?? []) as DatabaseRequirement[];
  return {
    opportunity_id: opportunity.id,
    requirements,
    eligibility: evaluateDatabaseEligibility(profile, requirements, opportunity.deadline)
  };
}
// End of section: the engine is the only source of truth for the
// verdict. The service is responsible for fetching inputs only.