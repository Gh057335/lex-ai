import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Demo mode: auth is removed. Every server call uses the service-role client,
// which bypasses RLS. Tenancy is enforced in app code via the demo org id
// resolved by `getDemoContext()` in @/lib/demo.
export async function createClient() {
  return createAdminClient();
}

export function createAdminClient() {
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
