import {
  StudentProfile,
  Opportunity,
  MatchScoreResult,
} from "./types";
import { evaluateEligibility } from "./eligibility-engine";

/**
 * Calculates Match Score (0 - 100%) and generates Gap Analysis
 */
export function calculateMatchScore(
  profile: StudentProfile,
  opportunity: Opportunity
): MatchScoreResult {
  let academicsScore = 0;
  let skillsScore = 0;
  let interestsScore = 0;
  let languageScore = 0;

  const whyThisMatch: string[] = [];
  const missingToUnlock: string[] = [];
  const recommendations: string[] = [];

  const currentEdu = profile.education?.[0];

  // 1. Academics Alignment (30 pts)
  if (currentEdu) {
    if (opportunity.field && currentEdu.major) {
      const fieldLower = opportunity.field.toLowerCase();
      const majorLower = currentEdu.major.toLowerCase();
      if (fieldLower.includes(majorLower) || majorLower.includes(fieldLower) || fieldLower === "all fields") {
        academicsScore += 15;
        whyThisMatch.push(`Your major (${currentEdu.major}) directly aligns with the opportunity field.`);
      }
    }
    if (currentEdu.gpa && currentEdu.gpa >= 3.0) {
      academicsScore += 15;
      whyThisMatch.push(`Strong academic standing with GPA of ${currentEdu.gpa}.`);
    } else if (currentEdu.gpa) {
      academicsScore += 8;
    }
  }

  // 2. Skills Match (30 pts)
  const studentSkills = (profile.skills || []).map(s => s.toLowerCase());
  const oppDesc = `${opportunity.title} ${opportunity.description || ""} ${opportunity.field || ""}`.toLowerCase();

  const matchedSkills: string[] = [];
  for (const skill of studentSkills) {
    if (oppDesc.includes(skill)) {
      matchedSkills.push(skill);
    }
  }

  if (matchedSkills.length > 0) {
    skillsScore = Math.min(30, matchedSkills.length * 10);
    whyThisMatch.push(`Relevant skills matched: ${matchedSkills.slice(0, 3).join(", ")}.`);
  } else {
    recommendations.push("Add more technical or field-specific skills to boost match scoring.");
  }

  // 3. Interests & Category Match (20 pts)
  const studentInterests = (profile.interests || []).map(i => i.toLowerCase());
  const matchedInterests: string[] = [];
  for (const interest of studentInterests) {
    if (oppDesc.includes(interest)) {
      matchedInterests.push(interest);
    }
  }

  if (matchedInterests.length > 0) {
    interestsScore = Math.min(20, matchedInterests.length * 10);
    whyThisMatch.push(`Shared interests in ${matchedInterests.join(", ")}.`);
  }

  // 4. Language & International Readiness (20 pts)
  const english = profile.languages?.find(l => l.name.toLowerCase() === "english");
  if (english) {
    if (english.testScore) {
      languageScore = 20;
      whyThisMatch.push(`Verified ${english.testName || "English test"} score (${english.testScore}).`);
    } else if (english.proficiency === "fluent" || english.proficiency === "native") {
      languageScore = 15;
      whyThisMatch.push(`High English proficiency (${english.proficiency}).`);
    } else {
      languageScore = 10;
    }
  } else {
    missingToUnlock.push("Official English Test (e.g. IELTS 6.5+ or TOEFL 80+)");
    recommendations.push("Taking an IELTS or TOEFL exam unlocks 70%+ of international graduate scholarships.");
  }

  // 5. Gap Analysis from Requirements
  if (opportunity.requirements) {
    const verdict = evaluateEligibility(profile, opportunity.id, opportunity.requirements);
    if (verdict.whyNot) {
      missingToUnlock.push(...verdict.whyNot);
    }
    if (verdict.missingInfo) {
      recommendations.push(...verdict.missingInfo);
    }
  }

  const totalScore = Math.min(100, academicsScore + skillsScore + interestsScore + languageScore);

  return {
    opportunityId: opportunity.id,
    totalScore,
    breakdown: {
      academicsScore,
      skillsScore,
      interestsScore,
      languageScore,
    },
    whyThisMatch,
    gapAnalysis: {
      missingToUnlock,
      recommendations,
    },
  };
}
