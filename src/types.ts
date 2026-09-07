export type EducationLevel = "high_school" | "bachelor" | "master" | "phd";

export interface StudentProfile {
  id: string;
  fullName: string;
  age?: number;
  nationality: string;
  countryOfResidence?: string;
  bio?: string;
  education?: {
    institution: string;
    degreeLevel: EducationLevel;
    major: string;
    yearOfStudy?: number;
    gpa?: number;
    gpaScale?: number;
    graduationYear?: number;
    isCurrent?: boolean;
  }[];
  skills?: string[];
  languages?: {
    name: string;
    proficiency: "native" | "fluent" | "intermediate" | "basic";
    testName?: "IELTS" | "TOEFL" | "Duolingo";
    testScore?: number;
  }[];
  experience?: {
    type: "internship" | "research" | "volunteering" | "project" | "work";
    title: string;
    organization?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }[];
  interests?: string[];
}

export type RequirementType =
  | "nationality"
  | "education_level"
  | "gpa_min"
  | "age_min"
  | "age_max"
  | "language_test_min"
  | "experience_years_min"
  | "major";

export type ComparisonOperator = "=" | ">=" | "<=" | "in" | "not_in" | "exists";

export interface EligibilityRequirement {
  id?: string;
  opportunityId: string;
  requirementType: RequirementType | string;
  operator: ComparisonOperator | string;
  value: any;
  isMandatory: boolean;
  displayLabel: string;
}

export interface Opportunity {
  id: string;
  organizationId?: string;
  organizationName?: string;
  title: string;
  type: "scholarship" | "internship" | "hackathon" | "research" | "exchange" | "training" | "event" | "volunteering" | "competition" | "other";
  category?: string;
  field?: string;
  description?: string;
  fundingType: "fully_funded" | "partial" | "paid" | "unpaid" | "free" | "fee_required" | "unknown";
  fundingAmount?: number;
  fundingCurrency?: string;
  locationCountry?: string;
  locationMode: "remote" | "in_person" | "hybrid";
  deadline?: string;
  applicationUrl?: string;
  sourceUrl: string;
  verificationStatus: "verified" | "unverified" | "expired";
  requirements?: EligibilityRequirement[];
}

export type EligibilityStatus = "eligible" | "likely_eligible" | "unknown" | "not_eligible";

export interface RuleEvaluationResult {
  requirement: EligibilityRequirement;
  passed: boolean;
  isUnknown: boolean;
  reason: string;
}

export interface EligibilityVerdict {
  opportunityId: string;
  status: EligibilityStatus;
  passedMandatory: boolean;
  evaluations: RuleEvaluationResult[];
  whyNot?: string[];
  missingInfo?: string[];
  summary: string;
}

export interface MatchScoreResult {
  opportunityId: string;
  totalScore: number;
  breakdown: {
    academicsScore: number;
    skillsScore: number;
    interestsScore: number;
    languageScore: number;
  };
  whyThisMatch: string[];
  gapAnalysis: {
    missingToUnlock: string[];
    recommendations: string[];
  };
}

export interface ParsedSearchQuery {
  extractedFilters: {
    type?: string;
    fundingType?: string;
    field?: string;
    locationCountry?: string;
    locationMode?: string;
    degreeLevel?: string;
    nationality?: string;
    deadlineBefore?: string;
  };
  semanticKeywords: string[];
  explanation: string;
}
