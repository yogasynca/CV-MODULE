import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl &&
    (supabaseServiceRoleKey || supabaseAnonKey) &&
    !supabaseUrl.includes("your-project-id")
);

// Server-side admin client (SAFE: strictly server-side, never bundled to client)
export function createServerSupabaseClient() {
  if (!isServerSupabaseConfigured) {
    return null;
  }
  const keyToUse = supabaseServiceRoleKey || supabaseAnonKey;
  return createClient(supabaseUrl, keyToUse, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
