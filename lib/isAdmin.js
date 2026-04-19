export function isAdminEmail(email) {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
  if (!email || !adminEmail) return false;
  return String(email).toLowerCase() === String(adminEmail).toLowerCase();
}
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);
