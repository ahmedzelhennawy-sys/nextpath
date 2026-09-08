import { evaluateDatabaseEligibility } from "@/core/eligibility/database-evaluate";
import { calculateDatabaseMatch } from "@/core/match/database-score";
import { getOpportunityService } from "@/services/opportunities";
import { getStudentProfile } from "@/services/student-profile";

// SECTION: Public API
// Runs the eligibility engine first. If the verdict is NOT_ELIGIBLE the
// match engine is intentionally skipped and the response carries
// `match: null` plus a short reason — a failed mandatory rule means the
// student should not apply, so a percentage match would mislead them.
//
// For all other verdicts, both engines run. The eligibility verdict is
// returned alongside the match score so the frontend can render the
// four-state badge and the percentage on the same card.
export async function getMatchForUser(
  accessToken: string,
  userId: string,
  opportunityId: string
): Promise<{
  opportunity_id: string;
  eligibility: ReturnType<typeof evaluateDatabaseEligibility>["verdict"];
  match: ReturnType<typeof calculateDatabaseMatch> | null;
  reason: string | null;
}> {
  // Fetch both inputs in parallel — opportunity + profile.
  const [profile, opportunity] = await Promise.all([
    getStudentProfile(accessToken, userId),
    getOpportunityService(opportunityId)
  ]);
  const requirements = opportunity.eligibility_requirements ?? [];
  const eligibility = evaluateDatabaseEligibility(profile, requirements, opportunity.deadline);

  if (eligibility.verdict === "NOT_ELIGIBLE") {
    return {
      opportunity_id: opportunity.id,
      eligibility: eligibility.verdict,
      match: null,
      reason: "Match scoring does not apply to a not-eligible opportunity"
    };
  }

  return {
    opportunity_id: opportunity.id,
    eligibility: eligibility.verdict,
    match: calculateDatabaseMatch(profile, opportunity),
    reason: null
  };
}
// End of section: the match engine never decides eligibility. The
// verdict is determined by the deterministic engine before any match
// arithmetic runs.