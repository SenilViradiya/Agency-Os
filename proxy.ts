import { auth } from "./lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  
  console.log('[PROXY] URL:', nextUrl.pathname, '| LoggedIn:', isLoggedIn);

  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isAuthApiRoute = nextUrl.pathname.startsWith("/api/auth");
  const isAuthPage = nextUrl.pathname.startsWith("/login");
  const isPublicRoute = isAuthPage || isAuthApiRoute || nextUrl.pathname.startsWith("/_next") || nextUrl.pathname === "/favicon.ico" || nextUrl.pathname === "/notification.mp3";

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (!isLoggedIn && !isPublicRoute) {
     if (isApiRoute) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
     }
     return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
