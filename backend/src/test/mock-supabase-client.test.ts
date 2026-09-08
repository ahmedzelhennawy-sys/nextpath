import { describe, expect, it } from "vitest";

import {
  createMockSupabaseClient,
  type MockSupabaseClient
} from "./mock-supabase-client";

// SECTION: Mock Supabase client tests
describe("createMockSupabaseClient", () => {
  it("records from() and chain methods and returns the default result", async () => {
    const client: MockSupabaseClient = createMockSupabaseClient();
    await client.from("opportunities").select("*").eq("id", "abc");
    expect(client.__calls).toContainEqual({ method: "from", args: ["opportunities"] });
    expect(client.__calls).toContainEqual({ method: "select", args: ["*"] });
    expect(client.__calls).toContainEqual({ method: "eq", args: ["id", "abc"] });
  });

  it("returns the table-specific canned result when provided", async () => {
    const client = createMockSupabaseClient({
      tableResults: {
        opportunities: { data: [{ id: "opp-1", title: "Scholarship" }], error: null }
      }
    });
    const { data } = await client.from("opportunities").select("*");
    expect(data).toEqual([{ id: "opp-1", title: "Scholarship" }]);
  });

  it("falls back to the default result for tables without an override", async () => {
    const client = createMockSupabaseClient({
      result: { data: null, error: null }
    });
    const { data } = await client.from("anything").select("*");
    expect(data).toBeNull();
  });

  it("supports thenable awaits on chain methods", async () => {
    const client = createMockSupabaseClient({
      result: { data: [{ id: "opp-2" }], error: null }
    });
    // `await client.from(...).select(...)` should resolve to the
    // configured result, not undefined.
    const awaited = await client.from("opportunities").select("*");
    expect(awaited.data).toEqual([{ id: "opp-2" }]);
  });

  it("supports maybeSingle and single terminal calls", async () => {
    const client = createMockSupabaseClient({
      result: { data: { id: "opp-3" }, error: null }
    });
    const single = await client.from("opportunities").select("*").single();
    expect(single.data).toEqual({ id: "opp-3" });
    const maybe = await client.from("opportunities").select("*").maybeSingle();
    expect(maybe.data).toEqual({ id: "opp-3" });
  });

  it("exposes an injectable auth.getUser when configured", async () => {
    const client = createMockSupabaseClient({
      authGetUser: async (jwt: string) => ({
        data: { user: jwt === "good" ? { id: "u-1", email: "s@example.com" } : null },
        error: null
      })
    });
    const good = await (client as unknown as { auth: { getUser: (jwt: string) => Promise<{ data: { user: { id: string } | null } }> } }).auth.getUser("good");
    expect(good.data.user?.id).toBe("u-1");
    const bad = await (client as unknown as { auth: { getUser: (jwt: string) => Promise<{ data: { user: { id: string } | null } }> } }).auth.getUser("bad");
    expect(bad.data.user).toBeNull();
  });
});
// End of section: every behaviour the repositories rely on has a
// dedicated test so a future refactor of the mock client fails loudly.