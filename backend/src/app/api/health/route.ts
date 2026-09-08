import { NextResponse } from "next/server";
import { setCorsHeaders } from "@/lib/cors";

export function GET() {
  const resp = NextResponse.json({ status: "ok", service: "nextpath-api" });
  return setCorsHeaders(resp);
}

export function OPTIONS() {
  const resp = new Response(null, { status: 204 });
  return setCorsHeaders(resp);
}
