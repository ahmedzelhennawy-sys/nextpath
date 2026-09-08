import { ApiError } from "@/lib/http";
import { getProfileById } from "@/lib/db/profiles";

// SECTION: Engine-facing profile shape
// The pure engines consume a normalised profile shape rather than the
// raw row shape, so the engines can be tested with hand-rolled fixtures
// and the database row shape can evolve without touching them.
export interface DatabaseStudentProfile {
  id: string;
  fullName: string;
  age?: number;
  nationality?: string;
  countryOfResidence?: string;
  education: Array<{
    institution: string;
    degreeLevel: string;
    major?: string;
    yearOfStudy?: number;
    gpa?: number;
    gpaScale?: number;
  }>;
  skills: string[];
  languages: Array<{
    name: string;
    proficiency: string;
    testName?: string;
    testScore?: number;
  }>;
  experience: Array<{
    type: string;
    title: string;
    organization?: string;
    startDate?: string;
    endDate?: string;
  }>;
  interests: string[];
}
// End of section: the engine consumes only what it needs. Adding a
// column to the database does not change this shape unless an engine
// starts caring about the new field.

// SECTION: Repository -> engine mapper
// Maps the live `profiles` rows + related tables into the
// engine-facing shape. Pure function so a test can pin it.
function mapProfile(
  userId: string,
  row: {
    full_name: string | null;
    age: number | null;
    nationality: string | null;
    country_of_residence: string | null;
  },
  educations: Array<{
    institution: string;
    degree_level: string;
    major: string | null;
    year_of_study: number | null;
    gpa: number | null;
    gpa_scale: number | null;
  }>,
  skills: Array<{ name: string }>,
  languages: Array<{ name: string; proficiency: string | null; test_name: string | null; test_score: number | null }>,
  experience: Array<{ type: string; title: string; organization: string | null; start_date: string | null; end_date: string | null }>,
  interests: Array<{ label: string }>
): DatabaseStudentProfile {
  return {
    id: userId,
    fullName: row.full_name ?? "Student",
    age: row.age ?? undefined,
    nationality: row.nationality ?? undefined,
    countryOfResidence: row.country_of_residence ?? undefined,
    education: educations.map((e) => ({
      institution: e.institution,
      degreeLevel: e.degree_level,
      major: e.major ?? undefined,
      yearOfStudy: e.year_of_study ?? undefined,
      gpa: e.gpa == null ? undefined : Number(e.gpa),
      gpaScale: e.gpa_scale == null ? undefined : Number(e.gpa_scale)
    })),
    skills: skills.map((s) => s.name).filter(Boolean),
    languages: languages
      .filter((l) => l.name)
      .map((l) => ({
        name: l.name,
        proficiency: l.proficiency ?? "intermediate",
        testName: l.test_name ?? undefined,
        testScore: l.test_score == null ? undefined : Number(l.test_score)
      })),
    experience: experience.map((e) => ({
      type: e.type,
      title: e.title,
      organization: e.organization ?? undefined,
      startDate: e.start_date ?? undefined,
      endDate: e.end_date ?? undefined
    })),
    interests: interests.map((i) => i.label).filter(Boolean)
  };
}
// End of section: one mapper so every route that needs the engine input
// gets the same shape.

// SECTION: Public read
// Loads the authenticated user's profile + related tables and projects
// them into the engine-facing shape. Returns the same 422 the active
// backend previously used when the profile row doesn't exist — that's
// a normal state for a fresh signup, but the eligibility route needs
// to refuse to run without a profile.
export async function getStudentProfile(
  accessToken: string,
  userId: string
): Promise<DatabaseStudentProfile> {
  const related = await getProfileById(userId, accessToken);
  if (!related) {
    throw new ApiError(422, "PROFILE_REQUIRED", "Create your profile before calculating eligibility");
  }
  return mapProfile(
    userId,
    related.profile,
    related.educations,
    related.skills,
    related.languages,
    related.experience,
    related.interests
  );
}
// End of section: a single read entry point shared by the eligibility
// and match routes.