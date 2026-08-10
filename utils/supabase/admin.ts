import { createClient } from "@supabase/supabase-js";

// This client uses the SERVICE ROLE key, not the anon key — it can
// bypass all normal auth rules, including creating user accounts
// directly. This is exactly what inviting a brand-new user requires
// (Situation B: no account exists yet).
//
// SECURITY: this file must only ever be imported inside Server
// Actions / Route Handlers — never in a "use client" component, and
// the key itself must never be prefixed with NEXT_PUBLIC_.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}