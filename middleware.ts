import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookieValue, SESSION_COOKIE } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE.name)?.value;
  const session = await verifySessionCookieValue(cookie);

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*"],
};
