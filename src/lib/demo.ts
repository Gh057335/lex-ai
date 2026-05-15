// Demo mode: lazy-seed a single auth user + org + workspace + membership the
// first time anything touches the DB. Subsequent calls return memoized IDs.
// Replaces all real authentication while keeping the data model intact.

import { createAdminClient } from '@/lib/supabase';
import type { Role, UUID } from '@/types/database';

const DEMO_EMAIL = 'demo@lexai.local';
const DEMO_ORG_SLUG = 'demo-org';
const DEMO_ORG_NAME = 'Demo Organisation';

let cached: { userId: UUID; orgId: UUID } | null = null;
let inflight: Promise<{ userId: UUID; orgId: UUID }> | null = null;

export interface DemoContext {
  userId: UUID;
  orgId: UUID;
  role: Role;
  email: string;
  orgName: string;
}

export async function getDemoContext(): Promise<DemoContext> {
  const { userId, orgId } = await ensureDemo();
  return { userId, orgId, role: 'owner', email: DEMO_EMAIL, orgName: DEMO_ORG_NAME };
}

async function ensureDemo() {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    const admin = createAdminClient();

    const userId = await ensureUser(admin);
    await ensureProfile(admin, userId);
    const orgId = await ensureOrg(admin);
    await ensureMembership(admin, orgId, userId);
    await ensureWorkspace(admin, orgId);

    cached = { userId, orgId };
    return cached;
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

async function ensureUser(admin: ReturnType<typeof createAdminClient>): Promise<UUID> {
  const { data: list, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  const found = list?.users?.find((u) => u.email === DEMO_EMAIL);
  if (found) return found.id;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    email_confirm: true,
    user_metadata: { full_name: 'Demo User' },
  });
  if (createErr || !created.user) throw createErr ?? new Error('demo user creation failed');
  return created.user.id;
}

async function ensureProfile(admin: ReturnType<typeof createAdminClient>, userId: UUID) {
  await admin
    .from('profiles')
    .upsert(
      { id: userId, email: DEMO_EMAIL, full_name: 'Demo User' },
      { onConflict: 'id' },
    );
}

async function ensureOrg(admin: ReturnType<typeof createAdminClient>): Promise<UUID> {
  const { data: existing } = await admin
    .from('organizations')
    .select('id')
    .eq('slug', DEMO_ORG_SLUG)
    .maybeSingle();
  if (existing) return existing.id as UUID;

  const { data: created, error } = await admin
    .from('organizations')
    .insert({ name: DEMO_ORG_NAME, slug: DEMO_ORG_SLUG })
    .select('id')
    .single();
  if (error || !created) throw error ?? new Error('demo org creation failed');
  return created.id as UUID;
}

async function ensureMembership(
  admin: ReturnType<typeof createAdminClient>,
  orgId: UUID,
  userId: UUID,
) {
  await admin
    .from('memberships')
    .upsert(
      { org_id: orgId, user_id: userId, role: 'owner' },
      { onConflict: 'org_id,user_id' },
    );
}

const DEMO_JURISDICTIONS = ['ae-difc', 'ae-adgm', 'ae', 'qa', 'qa-qfc', 'sa', 'bh', 'intl'];
const DEMO_SECTORS = ['corporate', 'data_protection', 'commercial', 'construction', 'employment', 'financial', 'oil_gas'];

async function ensureWorkspace(admin: ReturnType<typeof createAdminClient>, orgId: UUID) {
  const { data: existing } = await admin
    .from('workspaces')
    .select('id, enabled_jurisdictions')
    .eq('org_id', orgId)
    .limit(1)
    .maybeSingle();
  if (existing) {
    const current = (existing.enabled_jurisdictions as string[] | null) ?? [];
    const missing = DEMO_JURISDICTIONS.filter((j) => !current.includes(j));
    if (missing.length > 0) {
      await admin
        .from('workspaces')
        .update({ enabled_jurisdictions: [...new Set([...current, ...DEMO_JURISDICTIONS])] })
        .eq('id', existing.id);
    }
    return;
  }
  await admin.from('workspaces').insert({
    org_id: orgId,
    name: 'Default workspace',
    default_jurisdiction: 'ae-difc',
    default_language: 'en',
    enabled_jurisdictions: DEMO_JURISDICTIONS,
    enabled_sectors: DEMO_SECTORS,
  });
}
