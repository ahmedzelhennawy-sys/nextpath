import type { DatabaseStudentProfile } from "@/services/student-profile";

// SECTION: Pure evaluator for the database team's `eligibility_requirements` rows.
// Every requirement_type observed in the live database has a deterministic
// branch; any unrecognised requirement_type returns AMBIGUOUS_UNSTATED
// rather than fabricating a verdict. AI NEVER runs here.

export type DatabaseRequirement = {
  id: string;
  requirement_type: string;
  operator: string;
  value: unknown;
  is_mandatory: boolean;
  display_label: string | null;
};

export type DatabaseVerdict = "ELIGIBLE" | "LIKELY_ELIGIBLE" | "UNKNOWN" | "NOT_ELIGIBLE";

export type DatabaseRequirementOutcome =
  | "FAIL"
  | "PASS_EXPLICIT"
  | "PASS_INFERRED"
  | "AMBIGUOUS_UNSTATED";

export type DatabaseEvaluation = {
  requirement: string;
  outcome: DatabaseRequirementOutcome;
  required: unknown;
  actual: unknown;
  isMandatory: boolean;
  display_label: string | null;
  message_data: Record<string, unknown>;
};

export type DatabaseEligibilityResult = {
  verdict: DatabaseVerdict;
  requirements: DatabaseEvaluation[];
  reasons: DatabaseEvaluation[];
};

// SECTION: Value helpers
// The `value` column is JSONB and its shape depends on `requirement_type`.
// Two shapes appear in production rows:
//   - { "values": ["Egyptian", "Tunisian"] }     (array form, used for "in"/"not_in")
//   - { "value": 3.0 }                            (scalar form, used for ">="/"<=")
//   - { "test_name": "TOEFL", "value": 79 }       (labelled scalar)
// `values` always returns at least one element so the caller never has
// to branch on `null` vs `[]`.
function values(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    const obj = value as { values?: unknown[]; value?: unknown };
    if (Array.isArray(obj.values)) return obj.values;
    if (obj.value !== undefined) return [obj.value];
  }
  return [];
}

function scalar(value: unknown): unknown {
  return values(value)[0];
}
// End of section: single source of truth for value parsing; any new
// requirement_type that uses a different JSONB shape can be added here
// without touching the branch functions.

// SECTION: Result builders
const pass = (r: DatabaseRequirement, actual: unknown, explicit = true): DatabaseEvaluation => ({
  requirement: r.requirement_type,
  outcome: explicit ? "PASS_EXPLICIT" : "PASS_INFERRED",
  required: r.value,
  actual,
  isMandatory: r.is_mandatory,
  display_label: r.display_label,
  message_data: { type: `${r.requirement_type}_met`, required: r.value, actual }
});

const unknown = (r: DatabaseRequirement, actual: unknown): DatabaseEvaluation => ({
  requirement: r.requirement_type,
  outcome: "AMBIGUOUS_UNSTATED",
  required: r.value,
  actual,
  isMandatory: r.is_mandatory,
  display_label: r.display_label,
  message_data: { type: `${r.requirement_type}_unknown`, required: r.value, actual }
});

const fail = (r: DatabaseRequirement, actual: unknown): DatabaseEvaluation => ({
  requirement: r.requirement_type,
  outcome: "FAIL",
  required: r.value,
  actual,
  isMandatory: r.is_mandatory,
  display_label: r.display_label,
  message_data: { type: `${r.requirement_type}_not_met`, required: r.value, actual }
});
// End of section: every check goes through one of these three helpers so
// the response shape is consistent and tests can pin the message_data.type
// code for each branch.

// SECTION: Individual requirement evaluators
// Each function is a pure `profile + requirement -> DatabaseEvaluation`.
// They never query a database or call AI.
function checkNationality(profile: DatabaseStudentProfile, r: DatabaseRequirement): DatabaseEvaluation {
  if (!profile.nationality) return unknown(r, null);
  const wanted = values(r.value).map((v) => String(v).toLowerCase());
  const mine = profile.nationality.toLowerCase();
  if (r.operator === "not_in") {
    return wanted.includes(mine) ? fail(r, profile.nationality) : pass(r, profile.nationality);
  }
  // Default operators: "in", "=". Both mean "nationality must be in the list".
  if (!wanted.length) return unknown(r, profile.nationality);
  return wanted.includes(mine) ? pass(r, profile.nationality) : fail(r, profile.nationality);
}

function checkEducationLevel(profile: DatabaseStudentProfile, r: DatabaseRequirement): DatabaseEvaluation {
  const current = profile.education[0];
  if (!current?.degreeLevel) return unknown(r, null);
  const wanted = values(r.value).map((v) => String(v).toLowerCase());
  return wanted.includes(current.degreeLevel.toLowerCase())
    ? pass(r, current.degreeLevel)
    : fail(r, current.degreeLevel);
}

function checkGpaMin(profile: DatabaseStudentProfile, r: DatabaseRequirement): DatabaseEvaluation {
  const current = profile.education[0];
  if (!current || current.gpa == null) return unknown(r, null);
  const scale = current.gpaScale && current.gpaScale > 0 ? current.gpaScale : 4;
  const minimum = Number(scalar(r.value));
  if (!Number.isFinite(minimum)) return unknown(r, current.gpa);
  // Normalise to a 4-point scale before comparing — supports profiles whose
  // gpa_scale is e.g. 5.
  const normalised = (current.gpa / scale) * 4;
  return normalised >= minimum ? pass(r, current.gpa) : fail(r, current.gpa);
}

function checkAgeMin(profile: DatabaseStudentProfile, r: DatabaseRequirement): DatabaseEvaluation {
  if (profile.age == null) return unknown(r, null);
  const minimum = Number(scalar(r.value));
  if (!Number.isFinite(minimum)) return unknown(r, profile.age);
  return profile.age >= minimum ? pass(r, profile.age) : fail(r, profile.age);
}

function checkAgeMax(profile: DatabaseStudentProfile, r: DatabaseRequirement): DatabaseEvaluation {
  if (profile.age == null) return unknown(r, null);
  const maximum = Number(scalar(r.value));
  if (!Number.isFinite(maximum)) return unknown(r, profile.age);
  return profile.age <= maximum ? pass(r, profile.age) : fail(r, profile.age);
}

function checkLanguageTestMin(profile: DatabaseStudentProfile, r: DatabaseRequirement): DatabaseEvaluation {
  const obj = (r.value && typeof r.value === "object" ? r.value : {}) as { test_name?: string; value?: unknown };
  const testName = (obj.test_name ?? "IELTS").toString().toLowerCase();
  const minimum = Number(obj.value ?? scalar(r.value));
  if (!Number.isFinite(minimum)) return unknown(r, null);
  const entry = profile.languages.find((l) => (l.testName ?? "").toLowerCase() === testName);
  if (!entry || entry.testScore == null) return unknown(r, null);
  return entry.testScore >= minimum ? pass(r, entry.testScore) : fail(r, entry.testScore);
}

function checkExperienceYearsMin(profile: DatabaseStudentProfile, r: DatabaseRequirement): DatabaseEvaluation {
  const minimum = Number(scalar(r.value));
  if (!Number.isFinite(minimum)) return unknown(r, null);
  const actualYears = profile.experience.length;
  return actualYears >= minimum ? pass(r, actualYears) : fail(r, actualYears);
}

function checkMajor(profile: DatabaseStudentProfile, r: DatabaseRequirement): DatabaseEvaluation {
  const current = profile.education[0];
  if (!current?.major) return unknown(r, null);
  const wanted = values(r.value).map((v) => String(v).toLowerCase());
  const mine = current.major.toLowerCase();
  if (!wanted.length) return unknown(r, current.major);
  const hit = wanted.some((w) => mine.includes(w) || w.includes(mine));
  return hit ? pass(r, current.major) : fail(r, current.major);
}

function checkTeamSize(_profile: DatabaseStudentProfile, r: DatabaseRequirement): DatabaseEvaluation {
  // Team-size constraints are collected at application time; the profile
  // has no team-composition data yet. Treat as AMBIGUOUS_UNSTATED rather
  // than FAIL so a student who hasn't started an application isn't
  // rejected by the engine.
  return unknown(r, null);
}
// End of section: each function handles one requirement_type. Adding a
// new type means (1) add a function here, (2) add a case in the switch
// below. Tests pin the message_data.type code for each branch.

// SECTION: Requirement-type dispatch
// A switch so adding a new requirement_type is a one-line change and
// TypeScript flags any case we forget to update when the union widens.
function evaluateOne(profile: DatabaseStudentProfile, r: DatabaseRequirement): DatabaseEvaluation {
  switch (r.requirement_type) {
    case "nationality":
      return checkNationality(profile, r);
    case "education_level":
      return checkEducationLevel(profile, r);
    case "gpa_min":
      return checkGpaMin(profile, r);
    case "age_min":
      return checkAgeMin(profile, r);
    case "age_max":
      return checkAgeMax(profile, r);
    case "language_test_min":
      return checkLanguageTestMin(profile, r);
    case "experience_years_min":
      return checkExperienceYearsMin(profile, r);
    case "major":
      return checkMajor(profile, r);
    case "team_size_min":
    case "team_size_max":
      return checkTeamSize(profile, r);
    default:
      // Unknown requirement_type: never invent a verdict.
      return unknown(r, null);
  }
}
// End of section: a single dispatch point so the route layer can call
// exactly one function for every requirement row.

// SECTION: Deadline handling
// Implemented as a synthetic DatabaseRequirement so the rest of the
// evaluator doesn't need to special-case deadlines. A deadline of "today"
// (UTC) counts as valid.
function deadlineCheck(deadline: string | null | undefined, today: Date): DatabaseEvaluation | null {
  if (!deadline) return null;
  const day = new Date(today);
  day.setUTCHours(0, 0, 0, 0);
  const due = new Date(deadline);
  if (Number.isNaN(due.getTime())) return null;
  const synth: DatabaseRequirement = {
    id: "deadline",
    requirement_type: "deadline",
    operator: ">=",
    value: deadline,
    is_mandatory: true,
    display_label: "Application deadline"
  };
  // Compare on date only, not on hour/minute. If the deadline is later
  // today, it's still valid; if it was earlier today, treat as past.
  const dueDay = new Date(due);
  dueDay.setUTCHours(0, 0, 0, 0);
  return dueDay >= day ? pass(synth, deadline) : fail(synth, deadline);
}
// End of section: a deadline of "today" returns PASS_EXPLICIT so the
// route's 4-state verdict stays accurate up to midnight UTC.

// SECTION: Public API
// Aggregates per-requirement checks plus the synthetic deadline check
// into the four-state verdict. Same verdict across any clock: the engine
// is pure and the only state-changing input is `deadline` + `today`.
export function evaluateDatabaseEligibility(
  profile: DatabaseStudentProfile,
  requirements: DatabaseRequirement[],
  deadline?: string | null,
  today = new Date()
): DatabaseEligibilityResult {
  const checks = requirements.map((r) => evaluateOne(profile, r));
  const deadlineResult = deadlineCheck(deadline, today);
  if (deadlineResult) checks.push(deadlineResult);

  // The verdict is computed from MANDATORY checks only — an optional
  // requirement that fails is documented in `requirements` but cannot
  // make the student ineligible.
  const mandatory = checks.filter((c) => c.isMandatory);
  const reasons = mandatory.filter((c) => c.outcome === "FAIL");
  const verdict: DatabaseVerdict = reasons.length
    ? "NOT_ELIGIBLE"
    : mandatory.some((c) => c.outcome === "AMBIGUOUS_UNSTATED")
    ? "UNKNOWN"
    : mandatory.some((c) => c.outcome === "PASS_INFERRED")
    ? "LIKELY_ELIGIBLE"
    : "ELIGIBLE";
  return { verdict, requirements: checks, reasons };
}
// End of section: pure function, no Supabase / Next / AI involvement.