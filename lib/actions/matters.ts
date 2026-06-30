'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth';
import { createClient } from '@/lib/supabase';
import { recordAudit } from '@/lib/audit';
import { JURISDICTION_BY_KEY, SECTOR_BY_KEY } from '@/lib/taxonomy';

const CreateMatterSchema = z.object({
  workspace_id: z.string().trim().min(1, 'Workspace is required.'),
  name: z.string().trim().min(2, 'Matter name is required.'),
  jurisdictions: z
    .array(z.string())
    .min(1, 'Select at least one jurisdiction.')
    .refine((jurs) => jurs.every((j) => JURISDICTION_BY_KEY.has(j)), {
      message: 'One or more unknown jurisdiction keys.',
    }),
  sectors: z
    .array(z.string())
    .default([])
    .refine((secs) => secs.every((s) => SECTOR_BY_KEY.has(s as never)), {
      message: 'One or more unknown sector keys.',
    }),
  is_sharia: z.boolean().default(false),
  counterparty: z.string().trim().default(''),
});

function parseCreateMatter(input: FormData) {
  const raw = {
    workspace_id: String(input.get('workspace_id') ?? '').trim(),
    name: String(input.get('name') ?? '').trim(),
    jurisdictions: input.getAll('jurisdictions').map(String).filter(Boolean),
    sectors: input.getAll('sectors').map(String).filter(Boolean),
    is_sharia: input.get('is_sharia') === 'on',
    counterparty: String(input.get('counterparty') ?? '').trim(),
  };

  const result = CreateMatterSchema.safeParse(raw);
  if (!result.success) throw new Error(result.error.issues[0].message);
  return result.data;
}

export async function createMatterAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission('matter.create');
  const { workspace_id, name, jurisdictions, sectors, is_sharia, counterparty } =
    parseCreateMatter(formData);

  const parties = counterparty
    ? [{ name: counterparty, role: 'counterparty' as const }]
    : [];

  const supabase = createClient();
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
