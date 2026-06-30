'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/auth';
import { createClient } from '@/lib/supabase';
import { recordAudit } from '@/lib/audit';
import { JURISDICTION_BY_KEY, SECTOR_BY_KEY } from '@/lib/taxonomy';

export async function createMatterAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission('matter.create');

  const workspace_id = String(formData.get('workspace_id') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const jurisdictions = formData.getAll('jurisdictions').map(String).filter(Boolean);
  const sectors = formData.getAll('sectors').map(String).filter(Boolean);
  const is_sharia = formData.get('is_sharia') === 'on';
  const counterparty = String(formData.get('counterparty') ?? '').trim();

  if (!workspace_id) throw new Error('Workspace is required.');
  if (name.length < 2) throw new Error('Matter name is required.');
  if (jurisdictions.length === 0) throw new Error('Select at least one jurisdiction.');

  for (const j of jurisdictions) if (!JURISDICTION_BY_KEY.has(j)) {
    throw new Error(`Unknown jurisdiction: ${j}`);
  }
  for (const s of sectors) if (!SECTOR_BY_KEY.has(s as never)) {
    throw new Error(`Unknown sector: ${s}`);
  }

  const parties = counterparty
    ? [{ name: counterparty, role: 'counterparty' as const }]
    : [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('matters')
    .insert({
      workspace_id,
      name,
      parties,
      jurisdictions,
      sectors,
      is_sharia,
      created_by: ctx.userId,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  await recordAudit({
    orgId: ctx.orgId,
    actorId: ctx.userId,
    action: 'matter.create',
    targetType: 'matter',
    targetId: data.id,
    metadata: { name, jurisdictions, sectors, is_sharia },
  });

  revalidatePath(`/dashboard/workspaces/${workspace_id}`);
  redirect(`/dashboard/matters/${data.id}`);
}
