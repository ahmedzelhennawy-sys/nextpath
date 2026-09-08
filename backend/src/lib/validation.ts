import { z } from "zod";

// SECTION: Structured-search filters
// Mirrors the existing live `opportunities` columns and the values observed
// in production rows. Every field is optional; the engine treats absent
// filters as "no restriction on this dimension" rather than zero.
//
// CSV values are accepted as a single comma-separated string
// (`?types=scholarship,internship`) which the route layer parses before
// calling `.parse` — Zod then validates each element.
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected ISO date YYYY-MM-DD");

const csvSchema = (max: number) =>
  z.array(z.string().min(1).max(40)).max(max).optional();

export const searchSchema = z
  .object({
    types: csvSchema(20),
    funding_categories: csvSchema(20),
    funding_types: csvSchema(20),
    location_types: z.array(z.enum(["remote", "in_person", "hybrid"])).max(3).optional(),
    country: z.string().length(2).optional(),
    field: z.string().max(100).optional(),
    deadline_from: isoDate.optional(),
    deadline_to: isoDate.optional(),
    page: z.number().int().min(1).default(1),
    page_size: z.number().int().min(1).max(50).default(20)
  })
  .strict();
// End of section: accepts both `funding_categories` (legacy) and
// `funding_types` (current live column name) so neither frontend has to
// rewrite its query string today. The route layer translates CSV query
// strings into arrays before validation.

// SECTION: Profile update payload
// Mirrors the live `profiles` columns. Only fields actually present in
// the live schema are accepted — date_of_birth / residency_country /
// career_goals / phone / bio / gpa / gpa_scale / education_level /
// academic_year do NOT exist in the live schema and are intentionally
// rejected.
const profileLanguageSchema = z
  .object({
    language_id: z.string().uuid().optional(),
    name: z.string().min(1).max(80).optional(),
    proficiency: z.enum(["native", "fluent", "intermediate", "basic"]).optional(),
    test_name: z.string().max(40).optional(),
    test_score: z.number().min(0).max(120).optional()
  })
  .strict();

const profileSkillSchema = z
  .object({
    skill_id: z.string().uuid().optional(),
    name: z.string().min(1).max(80).optional(),
    proficiency: z.enum(["beginner", "intermediate", "advanced"]).optional()
  })
  .strict();

const profileEducationSchema = z
  .object({
    id: z.string().uuid().optional(),
    institution: z.string().min(1).max(160),
    degree_level: z.enum(["high_school", "bachelor", "master", "phd"]),
    major: z.string().max(120).optional(),
    year_of_study: z.number().int().min(0).max(20).optional(),
    gpa: z.number().min(0).max(10).optional(),
    gpa_scale: z.number().positive().max(10).optional(),
    graduation_year: z.number().int().min(1900).max(2100).optional(),
    is_current: z.boolean().optional()
  })
  .strict();

const profileExperienceSchema = z
  .object({
    id: z.string().uuid().optional(),
    type: z.enum(["internship", "research", "volunteering", "project", "work"]),
    title: z.string().min(1).max(160),
    organization: z.string().max(160).optional(),
    description: z.string().max(2000).optional(),
    start_date: isoDate.optional(),
    end_date: isoDate.optional()
  })
  .strict();

const profileInterestSchema = z
  .object({
    id: z.string().uuid().optional(),
    label: z.string().min(1).max(120)
  })
  .strict();

export const profileUpdateSchema = z
  .object({
    full_name: z.string().min(1).max(160).optional(),
    age: z.number().int().min(13).max(120).optional(),
    nationality: z.string().min(2).max(80).optional(),
    country_of_residence: z.string().min(2).max(80).optional(),
    bio: z.string().max(2000).optional(),
    educations: z.array(profileEducationSchema).max(20).optional(),
    skills: z.array(profileSkillSchema).max(80).optional(),
    languages: z.array(profileLanguageSchema).max(20).optional(),
    experience: z.array(profileExperienceSchema).max(40).optional(),
    interests: z.array(profileInterestSchema).max(40).optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Profile update must contain at least one field."
  });
// End of section: every nested write is opt-in. A PUT that sends only
// `bio` will update only `bio`, leaving the related tables untouched.

// SECTION: Saved opportunity write body
export const savedCreateSchema = z
  .object({
    opportunity_id: z.string().uuid()
  })
  .strict();
// End of section: the live table uses (profile_id, opportunity_id) as its
// composite primary key, so the write payload only needs the opportunity
// id.

// SECTION: Application create body
// Uses the LIVE six-state enum: draft / ready / submitted / in_review /
// accepted / rejected — NOT the second reference's eight-state machine.
const applicationStatusSchema = z.enum(["draft", "ready", "submitted", "in_review", "accepted", "rejected"]);

export const applicationCreateSchema = z
  .object({
    opportunity_id: z.string().uuid(),
    initial_status: applicationStatusSchema.optional(),
    notes: z.string().max(2000).optional()
  })
  .strict();

export const applicationUpdateSchema = z
  .object({
    status: applicationStatusSchema,
    notes: z.string().max(2000).optional()
  })
  .strict();
// End of section: status transitions are validated against the live
// enum and a small forward-only transition table inside the service
// layer.

// SECTION: AI-search query body
// Optional free-text prompt. Routed through the AI adapter; the adapter's
// output is re-validated against `searchSchema` so the route never trusts
// AI-generated filters blindly.
export const aiQuerySchema = z
  .object({
    query: z.string().min(1).max(500)
  })
  .strict();
// End of section: an AI request body never carries `filters`; the
// structured path never carries `query`. The route decides which branch
// to take.