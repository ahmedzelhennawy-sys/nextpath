import { StudentProfile, Opportunity } from "./types";
import { evaluateEligibility } from "./eligibility-engine";
import { calculateMatchScore } from "./match-engine";
import { parseNaturalLanguageQuery } from "./ai-search";
import { draftMotivationLetter } from "./ai-assistant";

// 1. Realistic Egyptian Student Profile
const sampleStudent: StudentProfile = {
  id: "student-101",
  fullName: "Omar Hassan",
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
      gpaScale: 4.0,
      isCurrent: true,
    },
  ],
  skills: ["Python", "Machine Learning", "FastAPI", "SQL"],
  languages: [
    { name: "Arabic", proficiency: "native" },
    { name: "English", proficiency: "fluent", testName: "TOEFL", testScore: 85 },
  ],
  interests: ["Artificial Intelligence", "Digital Media"],
};

// 2. Sample Opportunities from our Seed Data
const sampleOpportunities: Opportunity[] = [
  {
    id: "a0000001-0000-0000-0000-000000000001",
    organizationName: "Fulbright Egypt Commission",
    title: "Fulbright Foreign Student Program – Egypt",
    type: "scholarship",
    field: "All fields",
    fundingType: "fully_funded",
    locationMode: "in_person",
    sourceUrl: "https://egypt.usembassy.gov",
    verificationStatus: "verified",
    requirements: [
      {
        opportunityId: "a0000001-0000-0000-0000-000000000001",
        requirementType: "nationality",
        operator: "in",
        value: { values: ["Egyptian"] },
        isMandatory: true,
        displayLabel: "Must hold Egyptian nationality",
      },
      {
        opportunityId: "a0000001-0000-0000-0000-000000000001",
        requirementType: "education_level",
        operator: "in",
        value: { values: ["bachelor", "master"] },
        isMandatory: true,
        displayLabel: "Bachelor's degree completed",
      },
      {
        opportunityId: "a0000001-0000-0000-0000-000000000001",
        requirementType: "gpa_min",
        operator: ">=",
        value: { value: 3.0 },
        isMandatory: false,
        displayLabel: "Competitive GPA of 3.0+",
      },
      {
        opportunityId: "a0000001-0000-0000-0000-000000000001",
        requirementType: "language_test_min",
        operator: ">=",
        value: { test_name: "TOEFL", value: 79 },
        isMandatory: true,
        displayLabel: "TOEFL iBT 79+",
      },
    ],
  },
  {
    id: "a0000005-0000-0000-0000-000000000005",
    organizationName: "UNESCO",
    title: "UNESCO Youth Hackathon 2026",
    type: "hackathon",
    field: "Digital Media & AI",
    fundingType: "fully_funded",
    locationMode: "in_person",
    sourceUrl: "https://opportunitiescorners.com/unesco-youth-hackathon-2026",
    verificationStatus: "verified",
    requirements: [
      {
        opportunityId: "a0000005-0000-0000-0000-000000000005",
        requirementType: "age_min",
        operator: ">=",
        value: { value: 18 },
        isMandatory: true,
        displayLabel: "Minimum age 18",
      },
      {
        opportunityId: "a0000005-0000-0000-0000-000000000005",
        requirementType: "age_max",
        operator: "<=",
        value: { value: 30 },
        isMandatory: true,
        displayLabel: "Maximum age 30",
      },
    ],
  },
];

console.log("==================================================================");
console.log("🚀 NEXTPATH — AI & Deterministic Eligibility Engine Demo");
console.log("==================================================================\n");

// DEMO 1: Deterministic Eligibility & Match Scoring
console.log(`--- 1. Evaluating Opportunities for Student: ${sampleStudent.fullName} ---`);
for (const opp of sampleOpportunities) {
  const verdict = evaluateEligibility(sampleStudent, opp.id, opp.requirements || []);
  const match = calculateMatchScore(sampleStudent, opp);

  console.log(`\n📌 Opportunity: ${opp.title}`);
  console.log(`   Eligibility Status: ${verdict.status.toUpperCase()}`);
  console.log(`   Verdict Summary: ${verdict.summary}`);
  console.log(`   Match Score: ${match.totalScore}%`);

  if (match.whyThisMatch.length > 0) {
    console.log("   Why this match?:");
    match.whyThisMatch.forEach(w => console.log(`     ✓ ${w}`));
  }

  if (verdict.whyNot && verdict.whyNot.length > 0) {
    console.log("   'Why not?' failed rules:");
    verdict.whyNot.forEach(wn => console.log(`     ✗ ${wn}`));
  }
}

// DEMO 2: AI Natural Language Search Query Parsing
console.log("\n------------------------------------------------------------------");
console.log("--- 2. Natural-Language AI Query Parsing ---");
const userQuery = "Find fully funded AI and machine learning master scholarships for Egyptian students in Europe";
console.log(`User Query: "${userQuery}"`);
const parsedQuery = parseNaturalLanguageQuery(userQuery);
console.log("Parsed SQL / Supabase Filters:", JSON.stringify(parsedQuery.extractedFilters, null, 2));
console.log("Explanation for User:", parsedQuery.explanation);

// DEMO 3: AI Motivation Letter Drafter
console.log("\n------------------------------------------------------------------");
console.log("--- 3. AI Application / Motivation Letter Assistant (Zero Hallucination) ---");
const drafted = draftMotivationLetter(sampleStudent, sampleOpportunities[1]);
console.log("Subject Line:", drafted.subject);
console.log("Grounded Student Facts Used:", drafted.groundedFactsUsed);
console.log("\n--- Generated Letter Draft ---\n");
console.log(drafted.letter);
console.log("\n==================================================================");
