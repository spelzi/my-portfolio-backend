import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "CRITICAL: Supabase configuration is missing! Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );
}

// service_role key bypasses Row Level Security — that's intentional here.
// This client only ever runs on the server, and the key is never exposed
// to the frontend. All the actual access control (public read, JWT-gated
// write) is enforced in the route handlers, not by Supabase's RLS.
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
