import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";

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

import { POST } from "./route";
import { createMockSupabaseClient } from "@/test/mock-supabase-client";
import type { MockSupabaseClient } from "@/test/mock-supabase-client";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body)
  });
}

beforeEach(() => {
  mockGetSupabaseClient.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/search", () => {
  it("returns 400 when request body is not valid JSON", async () => {
    const request = new Request("http://localhost/api/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "invalid-json"
    });
    const response = await POST(request as unknown as Parameters<typeof POST>[0]);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when body lacks both filters and query", async () => {
    const response = await POST(jsonRequest({}) as unknown as Parameters<typeof POST>[0]);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 200 with structured search results", async () => {
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

    const response = await POST(
      jsonRequest({
        filters: {
          types: ["scholarship"],
          location_types: ["in_person"]
        }
      }) as unknown as Parameters<typeof POST>[0]
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.source).toBe("structured");
    expect(body.opportunities).toHaveLength(1);
    expect(body.opportunities[0].id).toBe("opp-1");
  });

  it("returns 400 with AI_DISABLED when query is sent without AI provider configured", async () => {
    const response = await POST(
      jsonRequest({ query: "scholarships in computer science" }) as unknown as Parameters<typeof POST>[0]
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("AI_DISABLED");
  });
});
