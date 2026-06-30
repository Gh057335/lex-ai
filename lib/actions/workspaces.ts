'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth';
import { createClient } from '@/lib/supabase';
import { recordAudit } from '@/lib/audit';
import { JURISDICTION_BY_KEY, SECTOR_BY_KEY } from '@/lib/taxonomy';

const CreateWorkspaceSchema = z
  .object({
    name: z.string().trim().min(2, 'Workspace name is required.'),
    default_jurisdiction: z
      .string()
      .trim()
      .refine((j) => JURISDICTION_BY_KEY.has(j), 'Pick a valid default jurisdiction.'),
    default_language: z.string().trim().default('en'),
    enabled_jurisdictions: z
      .array(z.string())
      .default([])
      .refine((jurs) => jurs.every((j) => JURISDICTION_BY_KEY.has(j)), {
        message: 'One or more unknown jurisdiction keys.',
      }),
    enabled_sectors: z
      .array(z.string())
      .default([])
      .refine((secs) => secs.every((s) => SECTOR_BY_KEY.has(s as never)), {
        message: 'One or more unknown sector keys.',
      }),
  })
  .transform((data) => {
    // Ensure the default jurisdiction is always included in enabled list.
    const enabled = data.enabled_jurisdictions.includes(data.default_jurisdiction)
      ? data.enabled_jurisdictions
      : [...data.enabled_jurisdictions, data.default_jurisdiction];
    return { ...data, enabled_jurisdictions: enabled };
  });

function parseCreateWorkspace(input: FormData) {
  const raw = {
    name: String(input.get('name') ?? '').trim(),
    default_jurisdiction: String(input.get('default_jurisdiction') ?? '').trim(),
    default_language: String(input.get('default_language') ?? '').trim() || 'en',
    enabled_jurisdictions: input.getAll('enabled_jurisdictions').map(String).filter(Boolean),
    enabled_sectors: input.getAll('enabled_sectors').map(String).filter(Boolean),
  };

  const result = CreateWorkspaceSchema.safeParse(raw);
  if (!result.success) throw new Error(result.error.issues[0].message);
  return result.data;
}

export async function createWorkspaceAction(formData: FormData): Promise<void> {
  const ctx = await requirePermission('workspace.create');
  const parsed = parseCreateWorkspace(formData);

  const supabase = createClient();
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
