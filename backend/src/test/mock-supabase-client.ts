// SECTION: Mock Supabase client
// A minimal stand-in for Supabase's chainable PostgrestQueryBuilder that
// covers the methods the repositories actually call: from, select, eq,
// in, ilike, gte, lte, order, range, insert, update, delete, upsert,
// single, maybeSingle, and `await builder` (the thenable form). It
// resolves every terminal call (or being awaited directly) to a
// caller-supplied result, and records every call so a test can assert
// how the query was built.
//
// The same client exposes an injectable `auth.getUser` so route tests
// can simulate authenticated requests without contacting a real
// Supabase project.

import type { SupabaseClient } from "@supabase/supabase-js";

export interface MockQueryResult<T = unknown> {
  data: T;
  error: { message: string } | null;
}

export interface MockCall {
  method: string;
  args: unknown[];
}

export interface MockSupabaseClientOptions {
  authGetUser?: (jwt: string) => Promise<{ data: { user: { id: string; email: string | null } | null }; error: { message: string } | null }>;
  /**
   * Optional table-by-table canned result. When provided, queries
   * against `tableName` resolve to `results[tableName]`. When the
   * specific table isn't is missing, the client falls back to the
   * top-level `result` (or `{ data: null, error: null }`).
   */
  tableResults?: Record<string, MockQueryResult>;
  /** Default result applied to any table without a specific canned result. */
  result?: MockQueryResult;
}

export interface MockSupabaseClient extends SupabaseClient {
  __calls: MockCall[];
}

const CHAIN_METHODS = [
  "select",
  "eq",
  "in",
  "ilike",
  "gte",
  "lte",
  "order",
  "range",
  "insert",
  "update",
  "delete",
  "upsert"
] as const;

export function createMockSupabaseClient(options: MockSupabaseClientOptions = {}): MockSupabaseClient {
  const calls: MockCall[] = [];

  function record(method: string, args: unknown[]): void {
    calls.push({ method, args });
  }

  // SECTION: Per-table result resolution
  // The client's `from(...)` decides which canned result the chained
  // query resolves to. Storing the table on the builder lets any
  // terminal call look up the right result without re-traversing the
  // chain.
  let activeTable: string | null = null;

  function resolveResult(): MockQueryResult {
    if (activeTable && options.tableResults && activeTable in options.tableResults) {
      return options.tableResults[activeTable]!;
    }
    return options.result ?? { data: null, error: null };
  }
  // End of section: one source of truth for which canned result a
  // given chain resolves to. Tests can override `tableResults` to
  // cover each table a route touches in one mock.

  const builder: Record<string, unknown> = {};
  for (const method of CHAIN_METHODS) {
    builder[method] = (...args: unknown[]) => {
      record(method, args);
      return builder;
    };
  }
  builder["single"] = () => {
    record("single", []);
    return Promise.resolve(resolveResult());
  };
  builder["maybeSingle"] = () => {
    record("maybeSingle", []);
    return Promise.resolve(resolveResult());
  };
  // SECTION: Thenable builder
  // Supports `await client.from(...).select(...)` with no terminal
  // call, matching how real Postgrest query builders resolve when
  // awaited directly.
  builder["then"] = (
    onFulfilled: (value: MockQueryResult) => unknown,
    onRejected?: (reason: unknown) => unknown
  ) => Promise.resolve(resolveResult()).then(onFulfilled, onRejected);
  // End of section: the only thenable behaviour Postgrest builders
  // rely on; a real client returns the query result on `await`.

  const client: Record<string, unknown> = {
    from: (table: string) => {
      record("from", [table]);
      activeTable = table;
      return builder;
    },
    __calls: calls
  };

  client["auth"] = {
    getUser: (jwt: string) => {
      record("auth.getUser", [jwt]);
      if (options.authGetUser) return options.authGetUser(jwt);
      return Promise.resolve({
        data: { user: { id: "user-1", email: "user@example.com" } },
        error: null
      });
    }
  };

  return client as unknown as MockSupabaseClient;
}
// End of section: every test that talks to Supabase goes through this
// factory so a future refactor of the repositories can keep the same
// test seam.