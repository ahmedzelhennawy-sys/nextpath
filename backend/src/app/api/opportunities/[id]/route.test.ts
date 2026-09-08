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

import { GET } from "./route";
import { createMockSupabaseClient } from "@/test/mock-supabase-client";
import type { MockSupabaseClient } from "@/test/mock-supabase-client";

beforeEach(() => {
  mockGetSupabaseClient.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/opportunities/:id", () => {
  it("returns 200 with opportunity details when found", async () => {
    const client: MockSupabaseClient = createMockSupabaseClient({
      result: {
        data: {
          id: "opp-123",
          title: "AI Research Grant",
          type: "research",
          funding_type: "fully_funded",
          funding_amount: 50000,
          funding_currency: "USD",
          location_country: "US",
          location_city: "Boston",
          location_mode: "in_person",
          field: "Computer Science",
          description: "Full research grant for AI students.",
          start_date: "2027-09-01",
          end_date: "2028-08-31",
          deadline: "2027-01-15",
          application_url: "https://example.com/apply",
          source_url: "https://example.com",
          last_verified_at: null,
          verification_status: "verified",
          organization_id: "org-1",
          organizations: { id: "org-1", name: "AI Institute", type: "university", website: "https://ai.example.com" },
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
          required_documents: [
            { id: "doc-1", doc_type: "cv", is_mandatory: true }
          ]
        },
        error: null
      }
    });
    mockGetSupabaseClient.mockReturnValue(client);

    const request = new Request("http://localhost/api/opportunities/opp-123");
    const response = await GET(
      request as unknown as Parameters<typeof GET>[0],
      { params: Promise.resolve({ id: "opp-123" }) }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.opportunity.id).toBe("opp-123");
    expect(body.opportunity.title).toBe("AI Research Grant");
    expect(body.opportunity.organization?.name).toBe("AI Institute");
    expect(body.opportunity.eligibility_requirements).toHaveLength(1);
    expect(body.opportunity.required_documents).toHaveLength(1);
  });

  it("returns 404 when opportunity is not found", async () => {
    const client: MockSupabaseClient = createMockSupabaseClient({
      result: { data: null, error: null }
    });
    mockGetSupabaseClient.mockReturnValue(client);

    const request = new Request("http://localhost/api/opportunities/non-existent");
    const response = await GET(
      request as unknown as Parameters<typeof GET>[0],
      { params: Promise.resolve({ id: "non-existent" }) }
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("OPPORTUNITY_NOT_FOUND");
  });
});
