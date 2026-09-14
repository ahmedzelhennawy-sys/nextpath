// Mirrors nextpath-main/src/types.ts with the additions the UI needs:
//   - TrackableApplication, ToastNotification, Theme, OnboardingDraft
// All existing types are preserved verbatim so the same fixtures
// would work in both the backend engine and this front-end.

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
  goals?: string[];
}

export type RequirementType =
  | "nationality"
  | "education_level"
  | "gpa_min"
  | "age_min"
  | "age_max"
  | "language_test_min"
  | "experience_years_min"
  | "major"
  | string;

export type ComparisonOperator =
  | "="
  | ">="
  | "<="
  | "in"
  | "not_in"
  | "exists"
  | string;

export interface EligibilityRequirement {
  id?: string;
  opportunityId: string;
  requirementType: RequirementType;
  operator: ComparisonOperator;
  value: any;
  isMandatory: boolean;
  displayLabel: string;
}

export type OpportunityType =
  | "scholarship"
  | "internship"
  | "hackathon"
  | "research"
  | "exchange"
  | "training"
  | "event"
  | "volunteering"
  | "competition"
  | "other";

export type FundingType =
  | "fully_funded"
  | "partial"
  | "paid"
  | "unpaid"
  | "free"
  | "fee_required"
  | "unknown";

export interface Opportunity {
  id: string;
  organizationId?: string;
  organizationName?: string;
  title: string;
  type: OpportunityType;
  category?: string;
  field?: string;
  description?: string;
  fundingType: FundingType;
  fundingAmount?: number;
  fundingCurrency?: string;
  locationCountry?: string;
  locationMode: "remote" | "in_person" | "hybrid";
  deadline?: string;
  applicationUrl?: string;
  sourceUrl: string;
  verificationStatus: "verified" | "unverified" | "expired";
  requirements?: EligibilityRequirement[];
  // UI extras (mock data only)
  tags?: string[];
  highlights?: string[];
  cohort?: string;
}

export type EligibilityStatus =
  | "eligible"
  | "likely_eligible"
  | "unknown"
  | "not_eligible";

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

// ===== UI-only extensions =====

export type ApplicationStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "decision_pending"
  | "accepted"
  | "rejected";

export interface TrackedApplication {
  id: string;
  opportunityId: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  motivationLetter?: string;
  documents?: { name: string; uploaded: boolean }[];
  notes?: string;
}

export type Theme = "light" | "dark";

export interface ToastNotification {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error" | "info";
  durationMs?: number;
}

export interface FilterState {
  query: string;
  types: OpportunityType[];
  fundingTypes: FundingType[];
  locationMode: ("remote" | "in_person" | "hybrid")[];
  minMatchScore: number;
  sort: "match" | "deadline" | "newest";
}

export interface OnboardingDraft {
  fullName: string;
  nationality: string;
  countryOfResidence: string;
  age?: number;
  bio?: string;
  education: {
    institution: string;
    degreeLevel: EducationLevel;
    major: string;
    yearOfStudy?: number;
    gpa?: number;
    gpaScale?: number;
    graduationYear?: number;
    isCurrent?: boolean;
  };
  skills: string[];
  languages: {
    name: string;
    proficiency: "native" | "fluent" | "intermediate" | "basic";
    testName?: "IELTS" | "TOEFL" | "Duolingo";
    testScore?: number;
  }[];
  experience: {
    type: "internship" | "research" | "volunteering" | "project" | "work";
    title: string;
    organization?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }[];
  interests: string[];
  goals: string[];
}
