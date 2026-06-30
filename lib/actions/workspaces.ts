'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/auth';
import { createClient } from '@/lib/supabase';
import { recordAudit } from '@/lib/audit';
import { JURISDICTION_BY_KEY, SECTOR_BY_KEY } from '@/lib/taxonomy';

// Zod is not a hard dependency yet — fall back to manual validation.
// This keeps Phase 0 dependency-light; we'll wire zod in Phase 1.
class ValidationError extends Error {}

function parseCreateWorkspace(input: FormData) {
  const name = String(input.get('name') ?? '').trim();
  if (name.length < 2) throw new ValidationError('Workspace name is required.');

  const default_jurisdiction = String(input.get('default_jurisdiction') ?? '').trim();
  if (!JURISDICTION_BY_KEY.has(default_jurisdiction)) {
    throw new ValidationError('Pick a valid default jurisdiction.');
  }

  const default_language = String(input.get('default_language') ?? 'en').trim() || 'en';
  const enabled_jurisdictions = input.getAll('enabled_jurisdictions').map(String).filter(Boolean);
  const enabled_sectors = input.getAll('enabled_sectors').map(String).filter(Boolean);

  for (const j of enabled_jurisdictions) if (!JURISDICTION_BY_KEY.has(j)) {
    throw new ValidationError(`Unknown jurisdiction: ${j}`);
  }
  for (const s of enabled_sectors) if (!SECTOR_BY_KEY.has(s as never)) {
    throw new ValidationError(`Unknown sector: ${s}`);
  }

  if (!enabled_jurisdictions.includes(default_jurisdiction)) {
    enabled_jurisdictions.push(default_jurisdiction);
  }

  return { name, default_jurisdiction, default_language, enabled_jurisdictions, enabled_sectors };
}

export async function createWorkspaceAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission('workspace.create');
  const parsed = parseCreateWorkspace(formData);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workspaces')
    .insert({ org_id: ctx.orgId, ...parsed })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  await recordAudit({
    orgId: ctx.orgId,
    actorId: ctx.userId,
    action: 'workspace.create',
    targetType: 'workspace',
    targetId: data.id,
    metadata: { name: parsed.name },
  });

  revalidatePath('/dashboard');
  redirect(`/dashboard/workspaces/${data.id}`);
}

