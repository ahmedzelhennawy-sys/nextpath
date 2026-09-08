import type { ExistingOpportunity } from "@/services/opportunities";
import type { DatabaseStudentProfile } from "@/services/student-profile";

// SECTION: Match-engine vocabulary
// The match engine runs AFTER the eligibility engine decides the student
// may apply. A `NOT_ELIGIBLE` eligibility verdict short-circuits at the
// route layer and the engine only ever sees opportunities the student
// is allowed to consider.
//
// Weights mirror the second reference backend's documented seven-
// component breakdown (Major 20 / Skills 20 / Interests 15 / Goals 15 /
// Experience 10 / Language 10 / Academic 10 -> total 100). When the live
// database carries fewer soft facts than the breakdown expects, the
// missing components are scored as "no preferred tokens" (i.e. nothing
// to score against) rather than as zero — same posture as the
// eligibility engine's missingProfileCheck.
export const MATCH_WEIGHTS = {
  major: 20,
  skills: 20,
  interests: 15,
  goals: 15,
  experience: 10,
  language: 10,
  academic_fit: 10
} as const;
// End of section: a const object so a test can assert the breakdown
// exactly and changing the weights is one line.

export type MatchComponentName = keyof typeof MATCH_WEIGHTS;

export type MatchComponent = {
  component: MatchComponentName;
  weight: number;
  /** Points actually awarded. `null` when nothing could be scored. */
  score: number | null;
  matched: string[];
  missing: string[];
  /** Stable machine-readable code for the AI explanation layer. */
  message_data: Record<string, unknown>;
};

export type DatabaseMatchResult = {
  /** Total score 0–100. `null` when nothing could be scored. */
  score: number | null;
  /** Ordinal band derived from `score`. */
  band: "UNKNOWN" | "POOR" | "FAIR" | "GOOD" | "STRONG";
  /** Per-component breakdown, in the order they were summed. */
  breakdown: MatchComponent[];
  /** Human-readable strings the AI explanation layer can re-use. */
  why_this_match: string[];
  /** Profile-side gaps the student could close to improve the score. */
  gaps: string[];
};
// End of section: the public shape the route and tests pin.

// SECTION: Helpers
// Token-based overlap on free-text fields. We lowercase + trim to make
// matches case-insensitive and robust to surrounding whitespace. The
// score is "share of opportunity-preferred tokens that the student
// covers" so a student with zero of the preferred tokens scores 0 —
// not the inverse (which would unfairly reward sparse profiles).

function normalise(values: string[] | undefined): string[] {
  if (!values) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const token = raw.trim().toLowerCase();
    if (!token || seen.has(token)) continue;
    seen.add(token);
    out.push(token);
  }
  return out;
}

function overlap(wanted: string[], have: string[]): { matched: string[]; missing: string[]; ratio: number } {
  if (!wanted.length) return { matched: [], missing: [], ratio: 0 };
  const haveSet = new Set(have);
  const matched: string[] = [];
  for (const token of wanted) {
    if (haveSet.has(token)) matched.push(token);
  }
  const missing = wanted.filter((t) => !matched.includes(t));
  return { matched, missing, ratio: matched.length / wanted.length };
}

function award(
  component: MatchComponentName,
  wanted: string[],
  have: string[]
): MatchComponent {
  const weight = MATCH_WEIGHTS[component];
  if (!wanted.length) {
    return {
      component,
      weight,
      score: null,
      matched: [],
      missing: [],
      message_data: { type: "no_preferred_tokens" }
    };
  }
  if (!have.length) {
    return {
      component,
      weight,
      score: null,
      matched: [],
      missing: wanted,
      message_data: { type: "no_student_tokens" }
    };
  }
  const { matched, missing, ratio } = overlap(wanted, have);
  if (ratio <= 0) {
    return {
      component,
      weight,
      score: 0,
      matched,
      missing,
      message_data: { type: "no_overlap" }
    };
  }
  const score = Math.round(weight * ratio);
  return {
    component,
    weight,
    score,
    matched,
    missing,
    message_data: { type: "partial_overlap", ratio: Math.round(ratio * 100) / 100 }
  };
}
// End of section: token overlap is the universal sub-score. The
// language component is the only exception because it operates on
// (language, level) tuples — see `languageScore`.

// SECTION: Opportunity-text extraction
// Opportunities don't carry explicit `preferred_*` fields. We derive
// soft facts from `title + description + field + category` so the engine
// works against the live schema without any database changes.
function opportunityText(opportunity: ExistingOpportunity): string {
  return `${opportunity.title} ${opportunity.description ?? ""} ${opportunity.field ?? ""} ${opportunity.category ?? ""}`.toLowerCase();
}

function preferredSkills(opportunity: ExistingOpportunity): string[] {
  // The live schema has no `required_skills` column; we approximate by
  // tokenising the opportunity's title + field + category. A future
  // schema migration could promote this to a first-class array.
  const text = opportunityText(opportunity);
  return text ? text.split(/\W+/).filter((token) => token.length >= 4) : [];
}

function preferredMajors(opportunity: ExistingOpportunity): string[] {
  const field = opportunity.field?.trim();
  if (!field || field.toLowerCase() === "all fields") return [];
  return [field];
}
// End of section: the helpers above document the assumption that soft
// facts live inside opportunity text. If the schema gains a dedicated
// `preferred_*` column the engine can be retargeted without changing its
// public type.

// SECTION: Major component
// Field/major overlap drives the major component.
function scoreMajor(profile: DatabaseStudentProfile, opportunity: ExistingOpportunity): MatchComponent {
  const wanted = normalise(preferredMajors(opportunity));
  const mine = profile.education
    .map((e) => e.major)
    .filter((m): m is string => typeof m === "string" && m.length > 0);
  return award("major", wanted, normalise(mine));
}
// End of section: when the opportunity accepts "All fields" the engine
// reports "no preferred tokens" — neutral, not a penalty.

// SECTION: Skills component
// Tokenise opportunity text and look for the student's skill names.
function scoreSkills(profile: DatabaseStudentProfile, opportunity: ExistingOpportunity): MatchComponent {
  const wanted = preferredSkills(opportunity);
  return award("skills", wanted, normalise(profile.skills));
}
// End of section: same overlap pattern as the eligibility engine's
// tokens; the result is a "share of opportunity keywords" score capped
// at the component weight.

// SECTION: Interests component
// Match the student's declared interest labels against the opportunity
// text.
function scoreInterests(profile: DatabaseStudentProfile, opportunity: ExistingOpportunity): MatchComponent {
  const text = opportunityText(opportunity);
  const wanted = text ? text.split(/\W+/).filter((t) => t.length >= 5) : [];
  return award("interests", wanted, normalise(profile.interests));
}
// End of section: a parallel of the skills component using a slightly
// longer token length so single-character tokens don't dominate.

// SECTION: Goals / experience / academic fit
// The live profile model doesn't expose goals, experience text, or
// academic descriptors as separate fields. Each component therefore
// scores as "no preferred tokens" (neutral) until a future schema
// migration promotes them — which is what the reference backend's
// soft_facts JSONB column did. We still call `award` so the breakdown
// array always carries seven entries and the breakdown UI never has to
// branch on "did this version support goals?".
function scoreGoals(profile: DatabaseStudentProfile): MatchComponent {
  // profile.experience[].title doubles as a soft "career goal" hint.
  const wanted: string[] = [];
  return award("goals", wanted, profile.experience.flatMap((e) => e.title ? [e.title] : []));
}

function scoreExperience(profile: DatabaseStudentProfile, opportunity: ExistingOpportunity): MatchComponent {
  const wanted: string[] = [];
  return award("experience", wanted, profile.experience.flatMap((e) => e.title ? [e.title] : []));
}

function scoreAcademicFit(profile: DatabaseStudentProfile, opportunity: ExistingOpportunity): MatchComponent {
  const wanted = preferredMajors(opportunity);
  return award("academic_fit", wanted, profile.education.map((e) => e.degreeLevel).filter((d): d is string => Boolean(d)));
}
// End of section: the three components above always return
// `null score` today. The framework is in place to receive data when
// the schema grows.

// SECTION: Language component
// Languages need a richer comparison than plain string overlap because
// the opportunity may require "fluent" English while the student claims
// "intermediate". The MVP score is binary (covers = full marks, doesn't
// cover = 0) because CEFR ordering isn't represented in the live data.
function scoreLanguage(profile: DatabaseStudentProfile, opportunity: ExistingOpportunity): MatchComponent {
  const english = profile.languages.find((l) => l.name.toLowerCase() === "english");
  const text = opportunityText(opportunity);
  const needsEnglish = /\benglish\b/i.test(text) || /english/i.test(opportunity.description ?? "");
  const weight = MATCH_WEIGHTS.language;

  if (!needsEnglish) {
    return {
      component: "language",
      weight,
      score: null,
      matched: [],
      missing: [],
      message_data: { type: "no_preferred_tokens" }
    };
  }
  if (!english) {
    return {
      component: "language",
      weight,
      score: 0,
      matched: [],
      missing: ["English"],
      message_data: { type: "language_missing" }
    };
  }
  const proficiency = english.proficiency.toLowerCase();
  const acceptable = proficiency === "fluent" || proficiency === "native" || (english.testScore != null && english.testScore >= 80);
  const awarded = acceptable ? weight : Math.round(weight / 2);
  return {
    component: "language",
    weight,
    score: awarded,
    matched: [english.name],
    missing: acceptable ? [] : ["higher English proficiency"],
    message_data: acceptable
      ? { type: "language_acceptable", proficiency }
      : { type: "language_below_preferred", proficiency }
  };
}
// End of section: an opportunity that doesn't mention English doesn't
// penalise a non-English applicant; an opportunity that does gives full
// marks to fluent/native applicants and half marks to everyone else.

// SECTION: Verdict band
// Band boundaries codified so a test can pin them without restating the
// numbers in two places.
function bandFromScore(score: number | null): DatabaseMatchResult["band"] {
  if (score === null) return "UNKNOWN";
  if (score >= 80) return "STRONG";
  if (score >= 60) return "GOOD";
  if (score >= 40) return "FAIR";
  return "POOR";
}
// End of section: shared with the eligibility engine's verdict pattern.

// SECTION: Public API
// Pure entry point. No Supabase / Next / AI involvement. Returns
// `score: null` plus `band: "UNKNOWN"` when nothing on the opportunity
// side can be scored, matching the eligibility engine's "unknown,
// don't invent" posture.
export function calculateDatabaseMatch(
  profile: DatabaseStudentProfile,
  opportunity: ExistingOpportunity
): DatabaseMatchResult {
  const breakdown: MatchComponent[] = [
    scoreMajor(profile, opportunity),
    scoreSkills(profile, opportunity),
    scoreInterests(profile, opportunity),
    scoreGoals(profile),
    scoreExperience(profile, opportunity),
    scoreLanguage(profile, opportunity),
    scoreAcademicFit(profile, opportunity)
  ];

  const scorable = breakdown.filter((b) => b.score !== null);
  if (scorable.length === 0) {
    return {
      score: null,
      band: "UNKNOWN",
      breakdown,
      why_this_match: [],
      gaps: []
    };
  }

  const total = scorable.reduce((sum, b) => sum + (b.score ?? 0), 0);
  const score = Math.min(100, Math.round(total));

  const why_this_match: string[] = [];
  const gaps: string[] = [];
  for (const component of breakdown) {
    if (!component.matched.length) continue;
    if (component.score === null) continue;
    if (component.score > 0) {
      why_this_match.push(`${humanComponent(component.component)}: ${component.matched.slice(0, 3).join(", ")}`);
    } else if (component.missing.length) {
      gaps.push(`Improve ${humanComponent(component.component)} (missing: ${component.missing.slice(0, 3).join(", ")})`);
    }
  }

  return {
    score,
    band: bandFromScore(score),
    breakdown,
    why_this_match,
    gaps
  };
}

function humanComponent(name: MatchComponentName): string {
  switch (name) {
    case "major":
      return "Major alignment";
    case "skills":
      return "Skills match";
    case "interests":
      return "Shared interests";
    case "goals":
      return "Career-goal signals";
    case "experience":
      return "Experience signals";
    case "language":
      return "Language readiness";
    case "academic_fit":
      return "Academic fit";
  }
}
// End of section: the seven-component breakdown always contains every
// component (no null gaps in the array). The score itself can be null
// only when every component was unscoreable.