import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const NO_STORE = "private, no-store, max-age=0, must-revalidate";

function withNoStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", NO_STORE);
  response.headers.set("CDN-Cache-Control", "private, no-store");
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const appPage = pathname === "/" || pathname === "/mine" || pathname === "/manage";
  if (appPage) {
    const hasSession = request.cookies
      .getAll()
      .some((cookie) => cookie.name.includes("authjs.session-token") && cookie.value);
    if (!hasSession) {
      const login = new URL("/login", request.url);
      return withNoStore(NextResponse.redirect(login));
    }
  }
  return withNoStore(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
