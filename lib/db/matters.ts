// Shared DB helpers for automatically creating system-managed matters
// (e.g. "AI-drafted documents", "AI-reviewed documents") on first use.
// Both assistant and review flows need this — centralised here to avoid
// duplicate SQL across action files.

import { createAdminClient } from '@/lib/supabase';

export async function ensureAutoMatter(orgId: string, matterName: string): Promise<string> {
  const admin = createAdminClient();

  const { data: ws } = await admin
    .from('workspaces')
    .select('id')
    .eq('org_id', orgId)
    .limit(1)
    .maybeSingle();
  if (!ws) throw new Error('No workspace available for organisation');

  const { data: existing } = await admin
    .from('matters')
    .select('id')
    .eq('workspace_id', ws.id)
    .eq('name', matterName)
    .maybeSingle();
  if (existing) return existing.id as string;

  const { data: created, error } = await admin
    .from('matters')
    .insert({ workspace_id: ws.id, name: matterName, status: 'active' })
    .select('id')
    .single();
  if (error || !created) throw error ?? new Error('Matter insert failed');
  return created.id as string;
}
