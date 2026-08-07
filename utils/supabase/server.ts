import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Used inside Server Components, Server Actions, and Route Handlers.
// Reads the auth session from the incoming request's cookies.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll was called from a Server Component, where cookies
            // can't be written. Safe to ignore IF middleware.ts is also
            // refreshing the session on every request (it is, below) —
            // that's what actually keeps the session alive.
          }
        },
      },
    }
  );
}