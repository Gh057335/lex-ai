import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { getEnv, hasSupabase } from '@/config/env';
import { createMockClient } from './mock';

// Demo mode: when no Supabase credentials are configured, every call returns an
// in-memory mock client that implements the same query-builder surface. Tenancy
// is enforced in app code via the demo org id resolved by `getDemoContext()`.
//
// When credentials ARE present, the real service-role client is returned and the
// identical code paths run against Postgres (RLS-bypassing, by design for the
// server-only data layer).
export function createAdminClient(): SupabaseClient {
  if (!hasSupabase()) {
    return createMockClient() as unknown as SupabaseClient;
  }
  const env = getEnv();
  return createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Synchronous alias used by Server Components and pages. Callers that `await`
// this are safe — awaiting a non-Promise returns the value unchanged.
export function createClient(): SupabaseClient {
  return createAdminClient();
}
