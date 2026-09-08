// SECTION: Shared, database-independent eligibility domain contracts.
export type RequirementOutcome = "FAIL" | "PASS_EXPLICIT" | "PASS_INFERRED" | "AMBIGUOUS_UNSTATED";
export type EligibilityVerdict = "ELIGIBLE" | "LIKELY_ELIGIBLE" | "UNKNOWN" | "NOT_ELIGIBLE";
export type EducationLevel = "HIGH_SCHOOL" | "UNDERGRADUATE" | "GRADUATE" | "PHD" | "OTHER";

export interface StudentProfile {
  nationality?: string | null; residencyCountry?: string | null; dateOfBirth?: string | null;
  educationLevel?: EducationLevel | null; academicYear?: number | null; gpa?: number | null;
  gpaScale?: number | null; degree?: string | null; majors?: string[]; skills?: string[];
  interests?: string[]; goals?: string[]; languages?: Array<{ name: string; proficiency: string }>;
  experiences?: Array<{ type: string; years?: number }>;
}
export interface OpportunityRequirements {
  nationalityAllowlist?: string[] | null; ageMin?: number | null; ageMax?: number | null;
  educationLevelRequired?: EducationLevel | null; academicYearMin?: number | null;
  gpaMin?: number | null; gpaMinScale?: number | null; residencyAllowlist?: string[] | null;
  requiredDegree?: string | null; legalRequirementStructuredCheck?: boolean | null;
  legalRequirementDescription?: string | null; relevantMajors?: string[] | null;
  relevantSkills?: string[] | null; relevantInterests?: string[] | null;
  minExperienceYears?: number | null; careerGoalTags?: string[] | null;
  preferredLanguages?: Array<{ language: string; minProficiency?: string }> | null;
}
export interface FailedRequirement { requirement: string; required: unknown; actual: unknown; message_data: Record<string, unknown>; }
export interface RequirementResult { requirement: string; outcome: RequirementOutcome; required: unknown; actual: unknown; }
export interface EligibilityResult { verdict: EligibilityVerdict; requirements: RequirementResult[]; reasons: FailedRequirement[]; }
// End of section.
