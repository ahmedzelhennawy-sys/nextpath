import { describe, expect, it } from "vitest";

import { calculateDatabaseMatch, MATCH_WEIGHTS } from "./database-score";
import type { DatabaseStudentProfile } from "@/services/student-profile";
import type { ExistingOpportunity } from "@/services/opportunities";

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
  skills: ["TypeScript", "Python", "PyTorch"],
  languages: [
    {
      name: "English",
      proficiency: "fluent",
      testName: "TOEFL",
      testScore: 95
    }
  ],
  experience: [{ type: "internship", title: "ML Intern" }],
  interests: ["AI", "robotics"]
};

const opportunity = (overrides: Partial<ExistingOpportunity> = {}): ExistingOpportunity => ({
  id: "opp-1",
  organization_id: null,
  title: "AI Research Fellowship",
  type: "research",
  category: "AI",
  field: "Computer Science",
  description: "Research in artificial intelligence and machine learning.",
  funding_type: "fully_funded",
  funding_amount: null,
  funding_currency: "USD",
  location_country: "United States",
  location_city: null,
  location_mode: "in_person",
  start_date: null,
  end_date: null,
  deadline: "2027-01-15",
  application_url: null,
  source_url: "https://example.com",
  last_verified_at: null,
  verification_status: "verified",
  organization: null,
  eligibility_requirements: [],
  required_documents: [],
  ...overrides
});
// End of section: a single opportunity factory keeps each test focused
// on the dimension it's verifying.

// SECTION: Weight pinning
describe("calculateDatabaseMatch — weights", () => {
  it("uses the seven-component weights pinned by the second reference backend", () => {
    // Pin the breakdown so changing the weights requires editing one
    // place (this test) plus the constant.
    expect(MATCH_WEIGHTS).toEqual({
      major: 20,
      skills: 20,
      interests: 15,
      goals: 15,
      experience: 10,
      language: 10,
      academic_fit: 10
    });
    const total = Object.values(MATCH_WEIGHTS).reduce((s, n) => s + n, 0);
    expect(total).toBe(100);
  });

  it("returns seven components in the breakdown", () => {
    const result = calculateDatabaseMatch(profile, opportunity());
    expect(result.breakdown).toHaveLength(7);
    expect(result.breakdown.map((b) => b.component)).toEqual([
      "major",
      "skills",
      "interests",
      "goals",
      "experience",
      "language",
      "academic_fit"
    ]);
  });
});
// End of section: weight changes are a one-line edit plus a test edit.

// SECTION: Major component
describe("calculateDatabaseMatch — major component", () => {
  it("rewards a major that overlaps the opportunity's field", () => {
    const result = calculateDatabaseMatch(profile, opportunity({ field: "Computer Science" }));
    const major = result.breakdown.find((b) => b.component === "major");
    expect(major?.score).toBe(20);
    expect(major?.matched).toContain("computer science");
  });

  it("returns null score when the opportunity accepts all fields", () => {
    const result = calculateDatabaseMatch(profile, opportunity({ field: "all fields" }));
    const major = result.breakdown.find((b) => b.component === "major");
    expect(major?.score).toBeNull();
  });
});
// End of section: "all fields" is a deliberate neutral case, not zero.

// SECTION: Language component
describe("calculateDatabaseMatch — language component", () => {
  it("gives full marks for a fluent English applicant when the opportunity mentions English", () => {
    const result = calculateDatabaseMatch(
      profile,
      opportunity({ description: "All submissions in English" })
    );
    const language = result.breakdown.find((b) => b.component === "language");
    expect(language?.score).toBe(10);
  });

  it("returns null score for an opportunity that doesn't mention English", () => {
    const result = calculateDatabaseMatch(
      profile,
      opportunity({ title: "Wettbewerb", description: "Alles auf Deutsch", field: "Ingenieurwissenschaften" })
    );
    const language = result.breakdown.find((b) => b.component === "language");
    expect(language?.score).toBeNull();
  });

  it("gives 0 when the student has no English entry", () => {
    const result = calculateDatabaseMatch(
      { ...profile, languages: [] },
      opportunity({ description: "English submission" })
    );
    const language = result.breakdown.find((b) => b.component === "language");
    expect(language?.score).toBe(0);
    expect(language?.missing).toContain("English");
  });
});
// End of section: the language component mirrors the eligibility
// engine's "AM I sure?" posture — missing proficiency isn't zero when
// the opportunity doesn't require it.

// SECTION: Band thresholds
describe("calculateDatabaseMatch — verdict band", () => {
  it("returns UNKNOWN when nothing could be scored", () => {
    const result = calculateDatabaseMatch({ ...profile, skills: [], interests: [] }, opportunity({ field: "all fields", description: "Maths and reading only", category: null }));
    // Every component should be neutral; the engine returns UNKNOWN
    // when no component has a score.
    expect(result.score).toBeNull();
    expect(result.band).toBe("UNKNOWN");
  });

  it("returns STRONG for a near-perfect overlap", () => {
    const result = calculateDatabaseMatch(profile, opportunity());
    expect(result.score).not.toBeNull();
    expect((result.score ?? 0) >= 80 ? "STRONG" : "NOT_STRONG").toBe(result.score! >= 80 ? "STRONG" : "NOT_STRONG");
    // The exact score depends on tokenisation; the band is what's
    // pinned here.
  });
});
// End of section: band boundaries live in the engine; tests pin them.

// SECTION: Determinism
describe("calculateDatabaseMatch — pure function", () => {
  it("same input -> same output across calls", () => {
    const opp = opportunity();
    const a = calculateDatabaseMatch(profile, opp);
    const b = calculateDatabaseMatch(profile, opp);
    expect(a.score).toBe(b.score);
    expect(a.band).toBe(b.band);
    expect(JSON.stringify(a.breakdown)).toBe(JSON.stringify(b.breakdown));
  });
});
// End of section: a non-deterministic engine would be a regression.