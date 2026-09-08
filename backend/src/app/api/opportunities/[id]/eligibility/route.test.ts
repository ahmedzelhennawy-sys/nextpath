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

describe("GET /api/opportunities/:id/eligibility", () => {
  it("returns 401 when unauthenticated", async () => {
    const request = new Request("http://localhost/api/opportunities/opp-1/eligibility");
    const response = await GET(
      request as unknown as Parameters<typeof GET>[0],
      { params: Promise.resolve({ id: "opp-1" }) }
    );
    expect(response.status).toBe(401);
  });

  it("evaluates eligibility deterministically for authenticated user", async () => {
    const authClient: MockSupabaseClient = createMockSupabaseClient();
    const publicClient: MockSupabaseClient = createMockSupabaseClient({
      result: {
        data: {
          id: "opp-1",
          title: "Egyptian Tech Grant",
          type: "scholarship",
          deadline: "2028-01-01",
          eligibility_requirements: [
            {
              id: "req-1",
              requirement_type: "nationality",
              operator: "in",
              value: { values: ["Egyptian"] },
              is_mandatory: true,
              display_label: "Open to Egyptian nationals"
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

    mockGetSupabaseClient.mockImplementation(() => {
      // Return authClient or publicClient as appropriate
      return publicClient;
    });
    mockCreateUserSupabase.mockReturnValue(userClient);

    const request = new Request("http://localhost/api/opportunities/opp-1/eligibility", {
      headers: { authorization: "Bearer valid-token" }
    });
    const response = await GET(
      request as unknown as Parameters<typeof GET>[0],
      { params: Promise.resolve({ id: "opp-1" }) }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.opportunity_id).toBe("opp-1");
    expect(body.eligibility.verdict).toBe("ELIGIBLE");
    expect(body.eligibility.reasons).toHaveLength(0);
    expect(body.eligibility.requirements).toHaveLength(2); // nationality check + deadline check
  });
});
