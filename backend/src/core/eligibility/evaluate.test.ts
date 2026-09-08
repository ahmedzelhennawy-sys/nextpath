import { describe, expect, it } from "vitest";
import { evaluateEligibility } from "./evaluate";
import type { StudentProfile } from "./types";
const student: StudentProfile = { nationality: "EG", residencyCountry: "EG", dateOfBirth: "2005-01-01", educationLevel: "UNDERGRADUATE", academicYear: 2, gpa: 3.5, gpaScale: 4, degree: "Computer Science" };
const future = "2030-01-01";
describe("eligibility aggregation", () => {
  it("fails a single hard requirement regardless of passes", () => expect(evaluateEligibility(student, { gpaMin: 3.8, gpaMinScale: 4 }, future).verdict).toBe("NOT_ELIGIBLE"));
  it("treats deadline today as passing and yesterday as failing", () => { expect(evaluateEligibility(student, {}, "2026-09-06", new Date("2026-09-06T10:00:00Z")).verdict).not.toBe("NOT_ELIGIBLE"); expect(evaluateEligibility(student, {}, "2026-09-05", new Date("2026-09-06T10:00:00Z")).verdict).toBe("NOT_ELIGIBLE"); });
  it("returns unknown where a sourced legal check is ambiguous", () => expect(evaluateEligibility(student, { legalRequirementDescription: "Check visa" }, future).verdict).toBe("UNKNOWN"));
  it("handles age and residency failures structurally", () => { const result = evaluateEligibility(student, { ageMin: 25, residencyAllowlist: ["US"] }, future); expect(result.reasons.map(x => x.requirement)).toEqual(expect.arrayContaining(["age", "residency"])); });
  // ---- Missing‑field tests ----
  it("returns UNKNOWN when GPA and GPA scale are missing but gpaMin is required", () => {
    const incomplete = { ...student, gpa: undefined as any, gpaScale: undefined as any };
    expect(evaluateEligibility(incomplete, { gpaMin: 3.5, gpaMinScale: 4 }, future).verdict).toBe("UNKNOWN");
  });

  it("returns UNKNOWN when nationality is missing but an allow‑list is present", () => {
    const incomplete = { ...student, nationality: undefined as any };
    expect(evaluateEligibility(incomplete, { nationalityAllowlist: ["US", "CA"] }, future).verdict).toBe("UNKNOWN");
  });

  it("returns UNKNOWN when educationLevel is missing but required", () => {
    const incomplete = { ...student, educationLevel: undefined as any };
    expect(evaluateEligibility(incomplete, { educationLevelRequired: "UNDERGRADUATE" }, future).verdict).toBe("UNKNOWN");
  });

  it("returns UNKNOWN when academicYear is missing but academicYearMin is required", () => {
    const incomplete = { ...student, academicYear: undefined as any };
    expect(evaluateEligibility(incomplete, { academicYearMin: 2 }, future).verdict).toBe("UNKNOWN");
  });

  it("returns UNKNOWN when degree is missing but requiredDegree is set", () => {
    const incomplete = { ...student, degree: undefined as any };
    expect(evaluateEligibility(incomplete, { requiredDegree: "Computer Science" }, future).verdict).toBe("UNKNOWN");
  });
});
