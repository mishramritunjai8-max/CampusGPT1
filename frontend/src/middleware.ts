import { NextResponse, NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const customToken = request.cookies.get("campusgpt_token")?.value;
    
    // Check if any Supabase authentication cookies are present
    const hasSupabaseCookie = request.cookies.getAll().some(
      (cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")
    );

    // If no custom token and no Supabase session cookie, redirect to login
    if (!customToken && !hasSupabaseCookie) {
      const loginUrl = new URL("/login", request.url);
      // Pass the original destination as a search parameter
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    "/dashboard/:path*",
  ],
};
