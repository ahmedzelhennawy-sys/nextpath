import type { OpportunityRequirements, StudentProfile } from "@/core/eligibility/types";

// SECTION: Pure transparent soft-requirement scoring.
export const MATCH_WEIGHTS = { major: 20, skills: 20, interests: 15, goals: 15, experience: 10, language: 10, academicFit: 10 } as const;
export type MatchComponent = { component: keyof typeof MATCH_WEIGHTS; score: number; max: number; matched: string[]; missing: string[] };
export type MatchResult = { score: number; breakdown: MatchComponent[] };
const normalized = (items: string[] = []) => items.map(item => item.toLowerCase());
const overlap = (wanted: string[] | null | undefined, actual: string[] | undefined, max: number) => { if (!wanted?.length) return { score: max, matched: [], missing: [] }; const have = normalized(actual); const matched = wanted.filter(item => have.includes(item.toLowerCase())); return { score: Math.round(max * matched.length / wanted.length), matched, missing: wanted.filter(item => !matched.includes(item)) }; };
export function calculateMatch(profile: StudentProfile, requirements: OpportunityRequirements): MatchResult {
  const simple = (component: keyof typeof MATCH_WEIGHTS, wanted: string[] | null | undefined, actual: string[] | undefined): MatchComponent => ({ component, max: MATCH_WEIGHTS[component], ...overlap(wanted, actual, MATCH_WEIGHTS[component]) });
  const major = simple("major", requirements.relevantMajors, profile.majors); const skills = simple("skills", requirements.relevantSkills, profile.skills); const interests = simple("interests", requirements.relevantInterests, profile.interests); const goals = simple("goals", requirements.careerGoalTags, profile.goals);
  const totalYears = (profile.experiences ?? []).reduce((sum, item) => sum + (item.years ?? 0), 0); const experience: MatchComponent = { component: "experience", max: 10, score: requirements.minExperienceYears == null || totalYears >= requirements.minExperienceYears ? 10 : Math.round(10 * totalYears / requirements.minExperienceYears), matched: totalYears ? [`${totalYears} years`] : [], missing: requirements.minExperienceYears && totalYears < requirements.minExperienceYears ? [`${requirements.minExperienceYears} years`] : [] };
  const language = simple("language", requirements.preferredLanguages?.map(item => item.language), profile.languages?.map(item => item.name));
  const academicFit: MatchComponent = { component: "academicFit", max: 10, score: profile.educationLevel ? 10 : 0, matched: profile.educationLevel ? [profile.educationLevel] : [], missing: profile.educationLevel ? [] : ["education level"] };
  const breakdown = [major, skills, interests, goals, experience, language, academicFit]; return { score: breakdown.reduce((sum, item) => sum + item.score, 0), breakdown };
}
// End of section.
