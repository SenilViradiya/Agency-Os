import { auth } from "./lib/auth";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const proxy = auth(async (req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

  // 1. Client Portal Route protection
  if (pathname.startsWith('/portal') || pathname === '/portal-login') {
    const isLoginPage = pathname === '/portal-login';
    const isApiAuth = pathname.startsWith('/api/portal/auth');

    if (isApiAuth) {
      return NextResponse.next();
    }

    // Attempt to read the portal token
    const portalToken = await getToken({
      req,
      secret,
      salt: 'portal-session-token',
      cookieName: 'portal-session-token',
    });

    if (isLoginPage) {
      if (portalToken) {
        return NextResponse.redirect(new URL('/portal', req.url));
      }
      return NextResponse.next();
    }

    if (!portalToken) {
      return NextResponse.redirect(new URL('/portal-login', req.url));
    }

    return NextResponse.next();
  }

  // 2. Internal Dashboard Route protection (existing checks)
  const isLoggedIn = !!req.auth;
  console.log('[PROXY] URL:', nextUrl.pathname, '| LoggedIn:', isLoggedIn);

  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isAuthApiRoute = nextUrl.pathname.startsWith("/api/auth");
  const isAuthPage = nextUrl.pathname.startsWith("/login");
  const isPublicRoute = isAuthPage || isAuthApiRoute || nextUrl.pathname.startsWith("/_next") || nextUrl.pathname === "/favicon.ico" || nextUrl.pathname === "/notification.mp3";

  // Let client portal APIs pass through (handled separately via verifyPortalSession)
  const isPortalApiRoute = nextUrl.pathname.startsWith("/api/portal");
  if (isPortalApiRoute) {
    return NextResponse.next();
  }

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

export default proxy;

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
