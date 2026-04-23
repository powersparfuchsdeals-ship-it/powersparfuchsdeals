import { NextResponse } from "next/server";

export function middleware(req) {
  const host = req.headers.get("host") || "";
  const url = req.nextUrl.clone();

  if (host.startsWith("deals.")) {
    if (url.pathname === "/") {
      url.pathname = "/deals";
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"]
};
