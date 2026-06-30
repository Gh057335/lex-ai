import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getEnv } from '@/config/env';

// Demo mode: auth is removed. Every server call uses the service-role client,
// which bypasses RLS. Tenancy is enforced in app code via the demo org id
// resolved by `getDemoContext()` in @/lib/demo.
export function createAdminClient() {
  const env = getEnv();
  return createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Synchronous alias used by Server Components and pages. Callers that `await`
// this are safe — awaiting a non-Promise returns the value unchanged.
export function createClient() {
  return createAdminClient();
}
