import { handlers } from "@/auth";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function wrap(req: NextRequest, handler: (request: NextRequest) => Promise<Response>) {
  try {
    return await handler(req);
  } catch (error) {
    console.error("[shabetzti:auth-route]", error instanceof Error ? error.name : "error");
    return Response.redirect(new URL("/login?error=Configuration", req.url), 302);
  }
}

export async function GET(req: NextRequest) {
  return wrap(req, handlers.GET);
}

export async function POST(req: NextRequest) {
  return wrap(req, handlers.POST);
}
