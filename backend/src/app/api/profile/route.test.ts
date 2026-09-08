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

import { GET, PUT } from "./route";
import { createMockSupabaseClient } from "@/test/mock-supabase-client";
import type { MockSupabaseClient } from "@/test/mock-supabase-client";

beforeEach(() => {
  mockGetSupabaseClient.mockReset();
  mockCreateUserSupabase.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("Profile routes", () => {
  it("GET /api/profile returns 401 when unauthenticated", async () => {
    const request = new Request("http://localhost/api/profile");
    const response = await GET(request as unknown as Parameters<typeof GET>[0]);
    expect(response.status).toBe(401);
  });

  it("GET /api/profile returns 200 with profile data for authenticated user", async () => {
    const authClient: MockSupabaseClient = createMockSupabaseClient();
    const userClient: MockSupabaseClient = createMockSupabaseClient({
      tableResults: {
        profiles: {
          data: {
            id: "user-1",
            full_name: "Ahmed Mostafa",
            age: 22,
            nationality: "Egyptian",
            country_of_residence: "Egypt",
            bio: "CS Undergrad"
          },
          error: null
        },
        education: { data: [], error: null },
        profile_skills: { data: [], error: null },
        profile_languages: { data: [], error: null },
        experience: { data: [], error: null },
        interests: { data: [], error: null },
        documents: { data: [], error: null }
      }
    });
    mockGetSupabaseClient.mockReturnValue(authClient);
    mockCreateUserSupabase.mockReturnValue(userClient);

    const request = new Request("http://localhost/api/profile", {
      headers: { authorization: "Bearer valid-token" }
    });
    const response = await GET(request as unknown as Parameters<typeof GET>[0]);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.profile.full_name).toBe("Ahmed Mostafa");
    expect(body.profile.age).toBe(22);
  });

  it("PUT /api/profile updates profile fields", async () => {
    const authClient: MockSupabaseClient = createMockSupabaseClient();
    const userClient: MockSupabaseClient = createMockSupabaseClient({
      tableResults: {
        profiles: {
          data: {
            id: "user-1",
            full_name: "Ahmed M.",
            age: 23,
            nationality: "Egyptian",
            country_of_residence: "Egypt",
            bio: "AI researcher"
          },
          error: null
        }
      }
    });
    mockGetSupabaseClient.mockReturnValue(authClient);
    mockCreateUserSupabase.mockReturnValue(userClient);

    const request = new Request("http://localhost/api/profile", {
      method: "PUT",
      headers: {
        authorization: "Bearer valid-token",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        full_name: "Ahmed M.",
        age: 23,
        bio: "AI researcher"
      })
    });
    const response = await PUT(request as unknown as Parameters<typeof PUT>[0]);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.profile.full_name).toBe("Ahmed M.");
    expect(body.profile.age).toBe(23);
  });
});
