import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// This is a Route Handler, not a Server Action — because, as covered
// earlier, this is a genuine external-redirect case: Supabase sends
// the browser HERE after a Google login, an invite-link click, or a
// registration confirmation. Nothing in our own React tree is calling
// this — it needs a real URL to be redirected to.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // "next" lets the thing that generated the link decide where the
  // user should land afterward — e.g. invite links will set this to
  // /auth/set-password, since a brand-new invited user needs to set
  // one before they can do anything else.
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    // This is the actual handoff: trading the short-lived "code" from
    // the URL for a real, working logged-in session — written into
    // cookies by our server Supabase client automatically.
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If the code is missing or invalid (expired link, tampered URL,
  // etc.), send them somewhere sensible with a visible reason, rather
  // than a broken blank page.
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}