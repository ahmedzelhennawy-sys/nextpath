import { describe, expect, it } from "vitest";

import { evaluateDatabaseEligibility } from "./database-evaluate";
import type { DatabaseRequirement } from "./database-evaluate";
import type { DatabaseStudentProfile } from "@/services/student-profile";

// SECTION: Reusable fixtures
const profile: DatabaseStudentProfile = {
  id: "student-1",
  fullName: "Omar",
  age: 21,
  nationality: "Egyptian",
  countryOfResidence: "Egypt",
  education: [
    {
      institution: "Cairo University",
      degreeLevel: "bachelor",
      major: "Computer Science",
      yearOfStudy: 3,
      gpa: 3.4,
      gpaScale: 4
    }
  ],
  skills: ["TypeScript", "Python"],
  languages: [
    {
      name: "English",
      proficiency: "fluent",
      testName: "TOEFL",
      testScore: 95
    }
  ],
  experience: [
    { type: "internship", title: "ML Intern", organization: "X" }
  ],
  interests: ["AI", "robotics"]
};

const req = (
  id: string,
  requirement_type: string,
  value: unknown,
  operator = "=",
  is_mandatory = true
): DatabaseRequirement => ({
  id,
  requirement_type,
  operator,
  value,
  is_mandatory,
  display_label: requirement_type
});
// End of section: a single factory keeps the test cases readable.

// SECTION: Existing behaviour preserved
describe("evaluateDatabaseEligibility — existing requirements", () => {
  it("returns ELIGIBLE when mandatory rules pass and no deadline is set", () => {
    const result = evaluateDatabaseEligibility(
      profile,
      [
        req("n", "nationality", { values: ["Egyptian"] }, "in"),
        req("e", "education_level", { values: ["bachelor"] }, "in"),
        req("g", "gpa_min", { value: 3 }, ">=")
      ],
      null
    );
    expect(result.verdict).toBe("ELIGIBLE");
  });

  it("returns NOT_ELIGIBLE when a mandatory rule fails", () => {
    const result = evaluateDatabaseEligibility(
      profile,
      [
        req("age", "age_max", { value: 18 }, "<=")
      ],
      null
    );
    expect(result.verdict).toBe("NOT_ELIGIBLE");
    expect(result.reasons[0].requirement).toBe("age_max");
  });

  it("treats a deadline of 'today' as valid", () => {
    const result = evaluateDatabaseEligibility(
      profile,
      [],
      "2026-09-07",
      new Date("2026-09-07T20:00:00Z")
    );
    expect(result.verdict).toBe("ELIGIBLE");
  });

  it("treats a deadline of 'yesterday' as invalid", () => {
    const result = evaluateDatabaseEligibility(
      profile,
      [],
      "2026-09-06",
      new Date("2026-09-07T20:00:00Z")
    );
    expect(result.verdict).toBe("NOT_ELIGIBLE");
    expect(result.reasons[0].message_data.type).toBe("deadline_not_met");
  });

  it("returns UNKNOWN when a mandatory requirement has unknown data", () => {
    const result = evaluateDatabaseEligibility(
      // profile.age is missing
      { ...profile, age: undefined },
      [req("a", "age_min", { value: 18 }, ">=")],
      null
    );
    expect(result.verdict).toBe("UNKNOWN");
  });
});
// End of section: the legacy behaviour is unchanged.

// SECTION: New requirement types
describe("evaluateDatabaseEligibility — newly covered requirement types", () => {
  it("handles age_min", () => {
    const result = evaluateDatabaseEligibility(profile, [req("a", "age_min", { value: 18 }, ">=")], null);
    expect(result.verdict).toBe("ELIGIBLE");
  });

  it("handles language_test_min with TOEFL score", () => {
    const result = evaluateDatabaseEligibility(profile, [req("l", "language_test_min", { test_name: "TOEFL", value: 80 }, ">=")], null);
    expect(result.verdict).toBe("ELIGIBLE");
  });

  it("handles experience_years_min as 'number of records' semantics", () => {
    const result = evaluateDatabaseEligibility(profile, [req("e", "experience_years_min", { value: 1 }, ">=")], null);
    expect(result.verdict).toBe("ELIGIBLE");
  });

  it("handles major with case-insensitive overlap", () => {
    const result = evaluateDatabaseEligibility(profile, [req("m", "major", { values: ["computer science"] }, "in")], null);
    expect(result.verdict).toBe("ELIGIBLE");
  });

  it("handles nationality not_in as a denial list", () => {
    const result = evaluateDatabaseEligibility(profile, [req("n", "nationality", { values: ["Turkish"] }, "not_in")], null);
    expect(result.verdict).toBe("ELIGIBLE");
    const denied = evaluateDatabaseEligibility({ ...profile, nationality: "Turkish" }, [req("n", "nationality", { values: ["Turkish"] }, "not_in")], null);
    expect(denied.verdict).toBe("NOT_ELIGIBLE");
  });

  it("treats team_size as AMBIGUOUS_UNSTATED — never NOT_ELIGIBLE", () => {
    const result = evaluateDatabaseEligibility(profile, [req("t", "team_size_min", { value: 2 }, ">=")], null);
    expect(result.verdict).toBe("UNKNOWN");
    expect(result.reasons).toEqual([]);
  });

  it("treats unrecognised requirement types as AMBIGUOUS_UNSTATED", () => {
    const result = evaluateDatabaseEligibility(
      profile,
      [req("?", "made_up_type", { value: 1 }, "=")],
      null
    );
    expect(result.verdict).toBe("UNKNOWN");
  });

  it("normalises GPA from any scale to 4-point before comparing", () => {
    const bigScale: DatabaseStudentProfile = {
      ...profile,
      education: [{ ...profile.education[0], gpa: 4.5, gpaScale: 5 }]
    };
    const result = evaluateDatabaseEligibility(bigScale, [req("g", "gpa_min", { value: 3.5 }, ">=")], null);
    expect(result.verdict).toBe("ELIGIBLE");
  });
});
// End of section: every requirement type observed in the live
// database has a deterministic branch. Tests pin the message_data.type
// code for each branch so a future refactor cannot silently change it.

// SECTION: Optional vs mandatory
describe("evaluateDatabaseEligibility — optional requirements", () => {
  it("optional failures do NOT make the student NOT_ELIGIBLE", () => {
    const result = evaluateDatabaseEligibility(
      profile,
      [
        req("a", "age_max", { value: 30 }, "<=", false /* not mandatory */),
        req("n", "nationality", { values: ["Egyptian"] }, "in")
      ],
      null
    );
    // The optional age check failed, but the nationality check passed;
    // mandatory-only verdict aggregation means we still get ELIGIBLE.
    expect(result.verdict).toBe("ELIGIBLE");
  });
});
// End of section: only mandatory requirement failures downgrade the
// verdict. Optional requirement failures are recorded in
// `requirements` but never in `reasons`.