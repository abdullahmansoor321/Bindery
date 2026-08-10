import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

// This is the server-side counterpart to the token_hash link we build
// in members.ts. Unlike the fragment-based action_link, token_hash
// arrives as a normal query parameter — the server CAN see it — so
// this whole exchange happens here, with no browser-side fragment
// parsing needed at all.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();
    // verifyOtp does the actual work: confirms the token_hash is
    // real and unexpired, and — because this runs on our server,
    // using our server Supabase client — writes the resulting
    // session straight into cookies via that client's setAll, the
    // same mechanism our proxy relies on everywhere else.
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=invite_link_invalid`
  );
}