import { createBrowserClient } from "@supabase/ssr";

// Used inside Client Components ("use client" files) — e.g. the
// login form, or anywhere you need auth state reactively in the browser.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}