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
import { PATCH, DELETE } from "./[id]/route";
import { createMockSupabaseClient } from "@/test/mock-supabase-client";
import type { MockSupabaseClient } from "@/test/mock-supabase-client";

beforeEach(() => {
  mockGetSupabaseClient.mockReset();
  mockCreateUserSupabase.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("Applications routes", () => {
  it("GET /api/applications returns 401 when unauthenticated", async () => {
    const request = new Request("http://localhost/api/applications");
    const response = await GET(request as unknown as Parameters<typeof GET>[0]);
    expect(response.status).toBe(401);
  });

  it("GET /api/applications returns 200 with list for authenticated user", async () => {
    const authClient: MockSupabaseClient = createMockSupabaseClient();
    const userClient: MockSupabaseClient = createMockSupabaseClient({
      tableResults: {
        applications: {
          data: [
            {
              id: "app-1",
              profile_id: "user-1",
              opportunity_id: "opp-1",
              status: "draft",
              readiness_pct: 20,
              notes: "Needs CV",
              opportunities: {
                id: "opp-1",
                title: "Tech Scholarship",
                type: "scholarship"
              }
            }
          ],
          error: null
        }
      }
    });
    mockGetSupabaseClient.mockReturnValue(authClient);
    mockCreateUserSupabase.mockReturnValue(userClient);

    const request = new Request("http://localhost/api/applications", {
      headers: { authorization: "Bearer valid-token" }
    });
    const response = await GET(request as unknown as Parameters<typeof GET>[0]);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.count).toBe(1);
    expect(body.items[0].id).toBe("app-1");
  });

  it("POST /api/applications creates a new application in draft status", async () => {
    const authClient: MockSupabaseClient = createMockSupabaseClient();
    const userClient: MockSupabaseClient = createMockSupabaseClient({
      result: {
        data: {
          id: "app-2",
          profile_id: "user-1",
          opportunity_id: "a0000000-0000-0000-0000-000000000002",
          status: "draft",
          readiness_pct: 0,
          created_at: "2026-09-08T12:00:00Z"
        },
        error: null
      }
    });
    mockGetSupabaseClient.mockReturnValue(authClient);
    mockCreateUserSupabase.mockReturnValue(userClient);

    const request = new Request("http://localhost/api/applications", {
      method: "POST",
      headers: {
        authorization: "Bearer valid-token",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        opportunity_id: "a0000000-0000-0000-0000-000000000002",
        initial_status: "draft"
      })
    });
    const response = await POST(request as unknown as Parameters<typeof POST>[0]);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.application.id).toBe("app-2");
    expect(body.application.status).toBe("draft");
  });

  it("PATCH /api/applications/:id moves application through allowed transitions", async () => {
    const authClient: MockSupabaseClient = createMockSupabaseClient();
    const userClient: MockSupabaseClient = createMockSupabaseClient({
      result: {
        data: {
          id: "app-1",
          profile_id: "user-1",
          opportunity_id: "opp-1",
          status: "ready"
        },
        error: null
      }
    });
    mockGetSupabaseClient.mockReturnValue(authClient);
    mockCreateUserSupabase.mockReturnValue(userClient);

    const request = new Request("http://localhost/api/applications/app-1", {
      method: "PATCH",
      headers: {
        authorization: "Bearer valid-token",
        "content-type": "application/json"
      },
      body: JSON.stringify({ status: "ready" })
    });
    const response = await PATCH(
      request as unknown as Parameters<typeof PATCH>[0],
      { params: Promise.resolve({ id: "app-1" }) }
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.application.status).toBe("ready");
  });

  it("DELETE /api/applications/:id removes an application", async () => {
    const authClient: MockSupabaseClient = createMockSupabaseClient();
    const userClient: MockSupabaseClient = createMockSupabaseClient({
      result: { data: null, error: null }
    });
    mockGetSupabaseClient.mockReturnValue(authClient);
    mockCreateUserSupabase.mockReturnValue(userClient);

    const request = new Request("http://localhost/api/applications/app-1", {
      method: "DELETE",
      headers: { authorization: "Bearer valid-token" }
    });
    const response = await DELETE(
      request as unknown as Parameters<typeof DELETE>[0],
      { params: Promise.resolve({ id: "app-1" }) }
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
  });
});
