import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // This call is what actually refreshes the session — it must run
  // on every request, even ones that don't look auth-related, or
  // the access token silently expires.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route protection: FR-4.1 — every workspace-scoped route requires
  // an authenticated user. A few routes must stay open even without
  // a session:
  //   /login            — obviously, or nobody could ever log in
  //   /register          — same reasoning, for brand-new signups
  //   /p/                — public page routes (FR-4.3)
  //   /auth/callback     — the OAuth ?code= exchange happens here,
  //                        BEFORE a session exists — gating it would
  //                        make login itself impossible
  //   /auth/set-password — invite links land here carrying session
  //                        tokens in the URL FRAGMENT, which the
  //                        server can never see (fragments never
  //                        reach the server at all) — so getUser()
  //                        will always report "no user" on the very
  //                        first hit here, even on a valid link. The
  //                        browser's Supabase client establishes the
  //                        real session client-side once this page
  //                        is allowed to load.
  const isPublicRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register") ||
    request.nextUrl.pathname.startsWith("/p/") ||
    request.nextUrl.pathname.startsWith("/auth/");

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Run on all paths except static assets and Next.js internals,
     * so the session refresh actually applies to every real page.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};