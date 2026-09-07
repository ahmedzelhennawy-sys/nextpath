import {
  StudentProfile,
  EligibilityRequirement,
  RuleEvaluationResult,
  EligibilityVerdict,
  EligibilityStatus,
} from "./types";

/**
 * Deterministic Rule-Based Eligibility Engine
 * Evaluates individual requirements strictly against student profile data.
 * Zero LLM hallucination in eligibility decisions.
 */
export function evaluateRequirement(
  profile: StudentProfile,
  req: EligibilityRequirement
): RuleEvaluationResult {
  const reqType = req.requirementType;
  const val = req.value;

  // 1. Nationality Check
  if (reqType === "nationality") {
    if (!profile.nationality) {
      return { requirement: req, passed: false, isUnknown: true, reason: "Profile is missing nationality." };
    }
    if (req.operator === "not_in") {
      const excluded = Array.isArray(val.values) ? val.values : [val.value];
      const isExcluded = excluded.map((s: string) => s.toLowerCase()).includes(profile.nationality.toLowerCase());
      return {
        requirement: req,
        passed: !isExcluded,
        isUnknown: false,
        reason: isExcluded
          ? `Program excludes [${excluded.join(", ")}]; student is ${profile.nationality}.`
          : `Nationality (${profile.nationality}) is allowed (not in excluded list).`,
      };
    }
    const allowed = Array.isArray(val.values) ? val.values : [val.value];
    const isAllowed = allowed.map((s: string) => s.toLowerCase()).includes(profile.nationality.toLowerCase());
    return {
      requirement: req,
      passed: isAllowed,
      isUnknown: false,
      reason: isAllowed
        ? `Nationality (${profile.nationality}) satisfies requirement.`
        : `Program requires nationality in [${allowed.join(", ")}], but student is ${profile.nationality}.`,
    };
  }

  // 2. Education Level Check
  if (reqType === "education_level") {
    const currentEdu = profile.education?.[0];
    if (!currentEdu || !currentEdu.degreeLevel) {
      return { requirement: req, passed: false, isUnknown: true, reason: "Profile is missing degree level information." };
    }
    const allowedLevels: string[] = Array.isArray(val.values) ? val.values : [val.value];
    const isMatched = allowedLevels.map(l => l.toLowerCase()).includes(currentEdu.degreeLevel.toLowerCase());
    return {
      requirement: req,
      passed: isMatched,
      isUnknown: false,
      reason: isMatched
        ? `Degree level (${currentEdu.degreeLevel}) matches required levels.`
        : `Requires education level in [${allowedLevels.join(", ")}], current level is ${currentEdu.degreeLevel}.`,
    };
  }

  // 3. Minimum GPA Check
  if (reqType === "gpa_min") {
    const currentEdu = profile.education?.[0];
    if (!currentEdu || currentEdu.gpa === undefined || currentEdu.gpa === null) {
      return { requirement: req, passed: false, isUnknown: true, reason: "Profile is missing GPA." };
    }
    const scale = currentEdu.gpaScale || 4.0;
    const normalizedGpa = (currentEdu.gpa / scale) * 4.0;
    const minGpa = Number(val.value);
    const passed = normalizedGpa >= minGpa;
    return {
      requirement: req,
      passed,
      isUnknown: false,
      reason: passed
        ? `GPA of ${currentEdu.gpa}/${scale} (normalized ${normalizedGpa.toFixed(2)}) meets minimum requirement of ${minGpa}.`
        : `Program requires minimum GPA of ${minGpa}, your GPA is ${currentEdu.gpa}/${scale}.`,
    };
  }

  // 4. Age Minimum Check
  if (reqType === "age_min") {
    if (profile.age === undefined || profile.age === null) {
      return { requirement: req, passed: false, isUnknown: true, reason: "Profile is missing date of birth / age." };
    }
    const minAge = Number(val.value);
    const passed = profile.age >= minAge;
    return {
      requirement: req,
      passed,
      isUnknown: false,
      reason: passed
        ? `Age (${profile.age}) is at or above minimum age of ${minAge}.`
        : `Program requires minimum age of ${minAge}, student age is ${profile.age}.`,
    };
  }

  // 5. Age Maximum Check
  if (reqType === "age_max") {
    if (profile.age === undefined || profile.age === null) {
      return { requirement: req, passed: false, isUnknown: true, reason: "Profile is missing date of birth / age." };
    }
    const maxAge = Number(val.value);
    const passed = profile.age <= maxAge;
    return {
      requirement: req,
      passed,
      isUnknown: false,
      reason: passed
        ? `Age (${profile.age}) meets maximum age limit of ${maxAge}.`
        : `Program requires maximum age of ${maxAge}, student age is ${profile.age}.`,
    };
  }

  // 6. Language Test Score Check (e.g. TOEFL or IELTS)
  if (reqType === "language_test_min") {
    const testName = (val.test_name || "IELTS").toLowerCase();
    const minScore = Number(val.value);

    const langEntry = profile.languages?.find(
      l => l.testName?.toLowerCase() === testName
    );

    if (!langEntry || langEntry.testScore === undefined || langEntry.testScore === null) {
      return {
        requirement: req,
        passed: false,
        isUnknown: true,
        reason: `Profile does not list official ${val.test_name || "English test"} score.`,
      };
    }

    const passed = langEntry.testScore >= minScore;
    return {
      requirement: req,
      passed,
      isUnknown: false,
      reason: passed
        ? `${langEntry.testName} score (${langEntry.testScore}) meets minimum requirement of ${minScore}.`
        : `Program requires ${val.test_name} score of ${minScore}, your score is ${langEntry.testScore}.`,
    };
  }

  // 7. Experience Years Check
  if (reqType === "experience_years_min") {
    const requiredYears = Number(val.value);
    const expCount = profile.experience?.length || 0;
    const passed = expCount >= requiredYears;
    return {
      requirement: req,
      passed,
      isUnknown: expCount === 0 && !profile.experience,
      reason: passed
        ? `Student has verified experience records.`
        : `Program prefers ${requiredYears}+ years experience, student has recorded ${expCount} positions.`,
    };
  }

  // 8. Team Size Min (hackathons: e.g. teams of 2+)
  if (reqType === "team_size_min") {
    const min = Number(val.value);
    // Profile doesn't carry team_size today; this req is informational
    // until the application flow collects team composition.
    return {
      requirement: req,
      passed: true,
      isUnknown: true,
      reason: `Teams of ${min}+ required (collected at application time).`,
    };
  }

  // 9. Team Size Max
  if (reqType === "team_size_max") {
    const max = Number(val.value);
    return {
      requirement: req,
      passed: true,
      isUnknown: true,
      reason: `Max team size ${max} (collected at application time).`,
    };
  }

  return {
    requirement: req,
    passed: true,
    isUnknown: true,
    reason: `Informational requirement: ${req.displayLabel || reqType}`,
  };
}

/**
 * Evaluates all requirements for an opportunity against a student profile.
 * Returns 4-state verdict: 'eligible' | 'likely_eligible' | 'unknown' | 'not_eligible'
 */
export function evaluateEligibility(
  profile: StudentProfile,
  opportunityId: string,
  requirements: EligibilityRequirement[]
): EligibilityVerdict {
  if (!requirements || requirements.length === 0) {
    return {
      opportunityId,
      status: "eligible",
      passedMandatory: true,
      evaluations: [],
      whyNot: [],
      missingInfo: [],
      summary: "No explicit restrictions specified for this opportunity.",
    };
  }

  const evaluations: RuleEvaluationResult[] = [];
  const whyNot: string[] = [];
  const missingInfo: string[] = [];

  let failedMandatory = false;
  let hasUnknownMandatory = false;
  let hasFailedOptional = false;

  for (const req of requirements) {
    const evalResult = evaluateRequirement(profile, req);
    evaluations.push(evalResult);

    if (evalResult.isUnknown) {
      if (req.isMandatory) {
        hasUnknownMandatory = true;
        missingInfo.push(evalResult.reason);
      }
    } else if (!evalResult.passed) {
      if (req.isMandatory) {
        failedMandatory = true;
        whyNot.push(evalResult.reason);
      } else {
        hasFailedOptional = true;
      }
    }
  }

  let status: EligibilityStatus = "eligible";
  let summary = "You meet all mandatory eligibility criteria.";

  if (failedMandatory) {
    status = "not_eligible";
    summary = `Ineligible: ${whyNot.length} requirement(s) failed.`;
  } else if (hasUnknownMandatory) {
    status = "unknown";
    summary = `Needs more profile details: ${missingInfo.length} requirement(s) pending info.`;
  } else if (hasFailedOptional) {
    status = "likely_eligible";
    summary = "You meet all mandatory rules, but some optional preferences are missing.";
  }

  return {
    opportunityId,
    status,
    passedMandatory: !failedMandatory,
    evaluations,
    whyNot: whyNot.length > 0 ? whyNot : undefined,
    missingInfo: missingInfo.length > 0 ? missingInfo : undefined,
    summary,
  };
}
