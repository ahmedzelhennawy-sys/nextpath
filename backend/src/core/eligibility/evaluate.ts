import type { EligibilityResult, FailedRequirement, OpportunityRequirements, RequirementResult, StudentProfile } from "./types";

// SECTION: Pure hard-requirement evaluators. These functions never call a database or AI.
const pass = (requirement: string, required: unknown, actual: unknown, explicit = true): RequirementResult => ({ requirement, required, actual, outcome: explicit ? "PASS_EXPLICIT" : "PASS_INFERRED" });
const unknown = (requirement: string, required: unknown, actual: unknown): RequirementResult => ({ requirement, required, actual, outcome: "AMBIGUOUS_UNSTATED" });
const fail = (requirement: string, required: unknown, actual: unknown): RequirementResult => ({ requirement, required, actual, outcome: "FAIL" });
const ageOn = (dob: string, today: Date) => { const d = new Date(dob); let age = today.getUTCFullYear() - d.getUTCFullYear(); if (today.getUTCMonth() < d.getUTCMonth() || (today.getUTCMonth() === d.getUTCMonth() && today.getUTCDate() < d.getUTCDate())) age--; return age; };
const listCheck = (name: string, value: string | null | undefined, allowed: string[] | null | undefined): RequirementResult => !allowed ? pass(name, null, value, false) : allowed.length === 0 ? pass(name, allowed, value) : !value ? unknown(name, allowed, value) : allowed.some(x => x.toLowerCase() === value.toLowerCase()) ? pass(name, allowed, value) : fail(name, allowed, value);

export function evaluateMinimumGpa(profile: StudentProfile, requirement: OpportunityRequirements): RequirementResult {
  if (requirement.gpaMin == null) return pass("gpa", null, profile.gpa, false);
  if (profile.gpa == null || profile.gpaScale == null) return unknown("gpa", requirement.gpaMin, profile.gpa);
  const targetScale = requirement.gpaMinScale ?? profile.gpaScale;
  const normalized = profile.gpa / profile.gpaScale * targetScale;
  return normalized >= requirement.gpaMin ? pass("gpa", `>=${requirement.gpaMin}/${targetScale}`, profile.gpa) : fail("gpa", `>=${requirement.gpaMin}/${targetScale}`, profile.gpa);
}

export function evaluateEligibility(profile: StudentProfile, r: OpportunityRequirements, deadline: string, today = new Date()): EligibilityResult {
  const checks: RequirementResult[] = [listCheck("nationality", profile.nationality, r.nationalityAllowlist), listCheck("residency", profile.residencyCountry, r.residencyAllowlist)];
  if (r.ageMin == null && r.ageMax == null) checks.push(pass("age", null, null, false)); else if (!profile.dateOfBirth) checks.push(unknown("age", { min: r.ageMin, max: r.ageMax }, null)); else { const age = ageOn(profile.dateOfBirth, today); checks.push((r.ageMin != null && age < r.ageMin) || (r.ageMax != null && age > r.ageMax) ? fail("age", { min: r.ageMin, max: r.ageMax }, age) : pass("age", { min: r.ageMin, max: r.ageMax }, age)); }
  checks.push(!r.educationLevelRequired ? pass("education_level", null, profile.educationLevel, false) : !profile.educationLevel ? unknown("education_level", r.educationLevelRequired, null) : profile.educationLevel === r.educationLevelRequired ? pass("education_level", r.educationLevelRequired, profile.educationLevel) : fail("education_level", r.educationLevelRequired, profile.educationLevel));
  checks.push(r.academicYearMin == null ? pass("academic_year", null, profile.academicYear, false) : profile.academicYear == null ? unknown("academic_year", r.academicYearMin, null) : profile.academicYear >= r.academicYearMin ? pass("academic_year", r.academicYearMin, profile.academicYear) : fail("academic_year", r.academicYearMin, profile.academicYear));
  checks.push(evaluateMinimumGpa(profile, r));
  checks.push(!r.requiredDegree ? pass("degree", null, profile.degree, false) : !profile.degree ? unknown("degree", r.requiredDegree, null) : profile.degree.toLowerCase().includes(r.requiredDegree.toLowerCase()) ? pass("degree", r.requiredDegree, profile.degree) : fail("degree", r.requiredDegree, profile.degree));
  checks.push(r.legalRequirementStructuredCheck == null ? unknown("legal_requirement", r.legalRequirementDescription, null) : r.legalRequirementStructuredCheck ? pass("legal_requirement", r.legalRequirementDescription, true) : fail("legal_requirement", r.legalRequirementDescription, false));
  const start = new Date(today); start.setUTCHours(0, 0, 0, 0); const due = new Date(`${deadline}T00:00:00Z`); checks.push(due >= start ? pass("deadline", deadline, deadline) : fail("deadline", deadline, deadline));
  const reasons: FailedRequirement[] = checks.filter(check => check.outcome === "FAIL").map(check => ({ requirement: check.requirement, required: check.required, actual: check.actual, message_data: { type: `${check.requirement}_not_met`, required: check.required, actual: check.actual } }));
  const outcomes = checks.map(check => check.outcome); const verdict = outcomes.includes("FAIL") ? "NOT_ELIGIBLE" : outcomes.includes("AMBIGUOUS_UNSTATED") ? "UNKNOWN" : outcomes.includes("PASS_INFERRED") ? "LIKELY_ELIGIBLE" : "ELIGIBLE";
  return { verdict, requirements: checks, reasons };
}
// End of section.
