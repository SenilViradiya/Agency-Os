import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
  const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard") || 
                          req.nextUrl.pathname.startsWith("/users") || 
                          req.nextUrl.pathname.startsWith("/roles");
  const isApiRoute = req.nextUrl.pathname.startsWith("/api") && 
                      !req.nextUrl.pathname.startsWith("/api/auth") &&
                      !req.nextUrl.pathname.startsWith("/api/test-db-auth");


  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  if ((isDashboardPage || isApiRoute) && !isLoggedIn) {
     if (isApiRoute) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
     }
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
