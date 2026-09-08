import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";

// SECTION: Mock injection
// Replace the shared Supabase client factory with a function we can
// re-point per test. `vi.hoisted` ensures the mock function exists
// before the module factory runs.
const { mockGetSupabaseClient } = vi.hoisted(() => ({
  mockGetSupabaseClient: vi.fn()
}));

vi.mock("@/lib/supabase", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/supabase")>();
  return {
    ...mod,
    getSupabaseClient: () => mockGetSupabaseClient(),
    getSupabaseConfig: () => ({ url: "https://example.supabase.co", anonKey: "anon-test-key", serviceKey: undefined })
  };
});

import { GET } from "./route";
import { createMockSupabaseClient } from "@/test/mock-supabase-client";
import type { MockSupabaseClient } from "@/test/mock-supabase-client";

beforeEach(() => {
  mockGetSupabaseClient.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});
// End of section: module-level mock + per-test reset mirrors the
// second reference backend's test pattern.

describe("GET /api/opportunities", () => {
  it("returns 200 with the listed opportunities and pagination", async () => {
    const client: MockSupabaseClient = createMockSupabaseClient({
      tableResults: {
        opportunities: {
          data: [
            {
              id: "opp-1",
              title: "AI Scholarship",
              type: "scholarship",
              funding_type: "fully_funded",
              field: "AI",
              description: "An AI scholarship.",
              location_country: "US",
              location_mode: "in_person",
              deadline: "2027-01-15",
              application_url: null,
              source_url: "https://example.com",
              last_verified_at: null,
              verification_status: "verified",
              organization_id: null,
              organizations: null,
              eligibility_requirements: [],
              required_documents: []
            }
          ],
          error: null
        }
      }
    });
    mockGetSupabaseClient.mockReturnValue(client);
    const request = new Request("http://localhost/api/opportunities?page=1&page_size=20");
    const response = await GET(request as unknown as Parameters<typeof GET>[0]);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.opportunities).toHaveLength(1);
    expect(body.opportunities[0].id).toBe("opp-1");
    expect(body.pagination.page).toBe(1);
  });

  it("returns 200 with empty list when the database has no rows", async () => {
    const client: MockSupabaseClient = createMockSupabaseClient({
      result: { data: [], error: null }
    });
    mockGetSupabaseClient.mockReturnValue(client);
    const request = new Request("http://localhost/api/opportunities");
    const response = await GET(request as unknown as Parameters<typeof GET>[0]);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.opportunities).toEqual([]);
    expect(body.pagination.total).toBe(0);
  });

  it("returns 500 when the database query errors", async () => {
    const client: MockSupabaseClient = createMockSupabaseClient({
      result: { data: null, error: { message: "permission denied" } }
    });
    mockGetSupabaseClient.mockReturnValue(client);
    const request = new Request("http://localhost/api/opportunities");
    const response = await GET(request as unknown as Parameters<typeof GET>[0]);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe("DATABASE_ERROR");
  });

  it("clamps page_size to a sane upper bound", async () => {
    const client: MockSupabaseClient = createMockSupabaseClient({
      result: { data: [], error: null }
    });
    mockGetSupabaseClient.mockReturnValue(client);
    const request = new Request("http://localhost/api/opportunities?page_size=9999");
    const response = await GET(request as unknown as Parameters<typeof GET>[0]);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.pagination.page_size).toBeLessThanOrEqual(50);
  });
});
// End of section: the public list endpoint's contract is
// (200, envelope) on success and (500, error envelope) when the
// underlying repository throws.