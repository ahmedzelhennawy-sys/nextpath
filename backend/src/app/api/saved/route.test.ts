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

import { GET, POST } from "./route";
import { DELETE } from "./[opportunityId]/route";
import { createMockSupabaseClient } from "@/test/mock-supabase-client";
import type { MockSupabaseClient } from "@/test/mock-supabase-client";

beforeEach(() => {
  mockGetSupabaseClient.mockReset();
  mockCreateUserSupabase.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("Saved Opportunities routes", () => {
  it("GET /api/saved returns 401 when unauthenticated", async () => {
    const request = new Request("http://localhost/api/saved");
    const response = await GET(request as unknown as Parameters<typeof GET>[0]);
    expect(response.status).toBe(401);
  });

  it("GET /api/saved returns 200 with saved list for authenticated student", async () => {
    const authClient: MockSupabaseClient = createMockSupabaseClient();
    const userClient: MockSupabaseClient = createMockSupabaseClient({
      tableResults: {
        saved_opportunities: {
          data: [
            {
              profile_id: "user-1",
              opportunity_id: "opp-100",
              saved_at: "2026-09-08T12:00:00Z",
              opportunities: {
                id: "opp-100",
                title: "Robotics Contest",
                type: "competition",
                deadline: "2026-11-01",
                funding_type: "free",
                location_mode: "online"
              }
            }
          ],
          error: null
        }
      }
    });
    mockGetSupabaseClient.mockReturnValue(authClient);
    mockCreateUserSupabase.mockReturnValue(userClient);

    const request = new Request("http://localhost/api/saved", {
      headers: { authorization: "Bearer valid-token" }
    });
    const response = await GET(request as unknown as Parameters<typeof GET>[0]);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.count).toBe(1);
    expect(body.items[0].opportunity_id).toBe("opp-100");
  });

  it("POST /api/saved returns 201 when saving an opportunity", async () => {
    const authClient: MockSupabaseClient = createMockSupabaseClient();
    const userClient: MockSupabaseClient = createMockSupabaseClient({
      result: {
        data: {
          profile_id: "user-1",
          opportunity_id: "a0000000-0000-0000-0000-000000000001",
          saved_at: "2026-09-08T12:00:00Z"
        },
        error: null
      }
    });
    mockGetSupabaseClient.mockReturnValue(authClient);
    mockCreateUserSupabase.mockReturnValue(userClient);

    const request = new Request("http://localhost/api/saved", {
      method: "POST",
      headers: {
        authorization: "Bearer valid-token",
        "content-type": "application/json"
      },
      body: JSON.stringify({ opportunity_id: "a0000000-0000-0000-0000-000000000001" })
    });
    const response = await POST(request as unknown as Parameters<typeof POST>[0]);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.saved.opportunity_id).toBe("a0000000-0000-0000-0000-000000000001");
  });

  it("DELETE /api/saved/:opportunityId removes saved item", async () => {
    const authClient: MockSupabaseClient = createMockSupabaseClient();
    const userClient: MockSupabaseClient = createMockSupabaseClient({
      result: { data: null, error: null }
    });
    mockGetSupabaseClient.mockReturnValue(authClient);
    mockCreateUserSupabase.mockReturnValue(userClient);

    const request = new Request("http://localhost/api/saved/opp-100", {
      method: "DELETE",
      headers: { authorization: "Bearer valid-token" }
    });
    const response = await DELETE(
      request as unknown as Parameters<typeof DELETE>[0],
      { params: Promise.resolve({ opportunityId: "opp-100" }) }
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
  });
});
