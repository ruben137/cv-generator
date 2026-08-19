import { type NextRequest, NextResponse } from "next/server";

const localizedPath = /^\/(es|en)(\/.*)?$/;

export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(localizedPath);
  if (!match) return NextResponse.next();

  const locale = match[1];
  const internalPath = match[2] || "/";
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-cv-locale", locale);
  requestHeaders.set("x-cv-public-path", request.nextUrl.pathname);

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = internalPath;

  const response = NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  response.cookies.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/es", "/es/:path*", "/en", "/en/:path*"],
};
