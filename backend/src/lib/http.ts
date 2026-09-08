import { NextResponse } from "next/server";
import { ZodError } from "zod";

// SECTION: API error envelope
// Every protected route funnels its failures through `jsonError`, which
// produces a consistent JSON shape:
//
//   { error: { code: string, message: string, details?: unknown } }
//
// The `code` is a stable machine-readable identifier (`UNAUTHENTICATED`,
// `VALIDATION_ERROR`, ...); `message` is human-readable; `details` carries
// per-error context (Zod issues, SQL constraint names) when available.
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}
// End of section: a single typed error class keeps route handlers free
// of ad-hoc `Response` construction.

// SECTION: Error mapper
// Maps every recognised error type to a stable JSON envelope. Unknown
// errors fall through to a 500 with a generic message so we never leak
// internal stack traces or Supabase SQL fragments to clients.
export const jsonError = (error: unknown): NextResponse => {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message
          }))
        }
      },
      { status: 400 }
    );
  }
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {})
        }
      },
      { status: error.status }
    );
  }
  // Unknown error: log it server-side but never expose the message.
  console.error("[nextpath-api] unhandled error:", error);
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred"
      }
    },
    { status: 500 }
  );
};
// End of section: the same shape the second reference backend uses,
// kept here so the route handlers in both projects can share a client
// decoder if the frontend is rewritten to use one.