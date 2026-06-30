// Demo mode: authentication is removed. All callers receive a fixed context
// pointing at the seeded demo org. Re-introduce real auth by replacing the
// body of these helpers with the previous Supabase session logic.

import { getDemoContext } from '@/lib/demo';
import type { Permission } from '@/lib/rbac';
import type { Role, UUID } from '@/types/database';

export interface ActiveContext {
  userId: UUID;
  orgId: UUID;
  role: Role;
}

export async function currentMembership(): Promise<ActiveContext> {
  const ctx = await getDemoContext();
  return { userId: ctx.userId, orgId: ctx.orgId, role: ctx.role };
}

export async function requireMembership(): Promise<ActiveContext> {
  return currentMembership();
}

export async function requirePermission(_permission: Permission): Promise<ActiveContext> {
  return currentMembership();
}
