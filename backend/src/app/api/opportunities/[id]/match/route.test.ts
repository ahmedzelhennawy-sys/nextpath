import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";

const { mockGetSupabaseClient, mockCreateUserSupabase } = vi.hoisted(() => ({
  mockGetSupabaseClient: vi.fn(),
  mockCreateUserSupabase: vi.fn()
}));

vi.mock("@/lib/supabase", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/supabase")>();
  return {
    ...mod,
    getSupabaseClient: () => mockGetSupabaseClient(),
    createUserSupabase: () => mockCreateUserSupabase(),
    getSupabaseConfig: () => ({ url: "https://example.supabase.co", anonKey: "anon-test-key", serviceKey: undefined })
  };
});

import { GET } from "./route";
import { createMockSupabaseClient } from "@/test/mock-supabase-client";
import type { MockSupabaseClient } from "@/test/mock-supabase-client";

beforeEach(() => {
  mockGetSupabaseClient.mockReset();
  mockCreateUserSupabase.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/opportunities/:id/match", () => {
  it("returns 401 when unauthenticated", async () => {
    const request = new Request("http://localhost/api/opportunities/opp-1/match");
    const response = await GET(
      request as unknown as Parameters<typeof GET>[0],
      { params: Promise.resolve({ id: "opp-1" }) }
    );
    expect(response.status).toBe(401);
  });

  it("returns match: null when student is NOT_ELIGIBLE", async () => {
    const publicClient: MockSupabaseClient = createMockSupabaseClient({
      result: {
        data: {
          id: "opp-1",
          title: "German Scholarship",
          type: "scholarship",
          deadline: "2028-01-01",
          eligibility_requirements: [
            {
              id: "req-1",
              requirement_type: "nationality",
              operator: "in",
              value: { values: ["German"] },
              is_mandatory: true,
              display_label: "Open to German citizens"
            }
          ],
          required_documents: []
        },
        error: null
      }
    });
    const userClient: MockSupabaseClient = createMockSupabaseClient({
      tableResults: {
        profiles: {
          data: {
            id: "user-1",
            full_name: "Kareem",
            nationality: "Egyptian",
            country_of_residence: "Egypt",
            age: 21
          },
          error: null
        },
        education: { data: [], error: null },
        profile_skills: { data: [], error: null },
        profile_languages: { data: [], error: null },
        experience: { data: [], error: null },
        interests: { data: [], error: null }
      }
    });

    mockGetSupabaseClient.mockReturnValue(publicClient);
    mockCreateUserSupabase.mockReturnValue(userClient);

    const request = new Request("http://localhost/api/opportunities/opp-1/match", {
      headers: { authorization: "Bearer valid-token" }
    });
    const response = await GET(
      request as unknown as Parameters<typeof GET>[0],
      { params: Promise.resolve({ id: "opp-1" }) }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.opportunity_id).toBe("opp-1");
    expect(body.eligibility).toBe("NOT_ELIGIBLE");
    expect(body.match).toBeNull();
    expect(body.reason).toContain("does not apply");
  });

  it("returns 7-component match breakdown when student is eligible", async () => {
    const publicClient: MockSupabaseClient = createMockSupabaseClient({
      result: {
        data: {
          id: "opp-2",
          title: "Computer Science Fellowship",
          type: "fellowship",
          field: "Computer Science",
          description: "Fellowship for AI and Machine Learning researchers.",
          deadline: "2028-01-01",
          eligibility_requirements: [],
          required_documents: []
        },
        error: null
      }
    });
    const userClient: MockSupabaseClient = createMockSupabaseClient({
      tableResults: {
        profiles: {
          data: {
            id: "user-1",
            full_name: "Kareem",
            nationality: "Egyptian",
            country_of_residence: "Egypt",
            age: 21
          },
          error: null
        },
        education: { data: [
          {
            institution: "Cairo University",
            degreeLevel: "bachelor",
            major: "Computer Science",
            isCurrent: true
          }
        ], error: null },
        profile_skills: { data: [{ name: "AI", proficiency: "advanced" }], error: null },
        profile_languages: { data: [], error: null },
        experience: { data: [], error: null },
        interests: { data: [{ label: "AI" }], error: null }
      }
    });

    mockGetSupabaseClient.mockReturnValue(publicClient);
    mockCreateUserSupabase.mockReturnValue(userClient);

    const request = new Request("http://localhost/api/opportunities/opp-2/match", {
      headers: { authorization: "Bearer valid-token" }
    });
    const response = await GET(
      request as unknown as Parameters<typeof GET>[0],
      { params: Promise.resolve({ id: "opp-2" }) }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.opportunity_id).toBe("opp-2");
    expect(body.eligibility).toBe("ELIGIBLE");
    expect(body.match).not.toBeNull();
    expect(body.match.breakdown).toHaveLength(7);
  });
});
