/**
 * Role-based access control.
 *
 * Roles form a strict hierarchy. A user with a higher role implicitly satisfies
 * every permission held by a lower role in the same organisation.
 *
 *   owner  > counsel > reviewer > viewer
 *
 * RLS in the database is the authoritative boundary; this module enforces the
 * same rules at the application layer for UX (hide buttons, fail fast in
 * server actions, etc.). Never rely on this module alone for security.
 */

import type { Role } from '@/types/database';

const ROLE_RANK: Record<Role, number> = {
  owner: 3,
  counsel: 2,
  reviewer: 1,
  viewer: 0,
};

export function roleAtLeast(actual: Role, required: Role): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}

export type Permission =
  | 'workspace.create'
  | 'workspace.update'
  | 'workspace.delete'
  | 'matter.create'
  | 'matter.update'
  | 'matter.archive'
  | 'contract.create'
  | 'contract.generate'
  | 'contract.review'
  | 'contract.approve'
  | 'contract.export'
  | 'contract.delete'
  | 'team.invite'
  | 'team.remove'
  | 'team.update_role'
  | 'billing.manage'
  | 'audit.read'
  | 'source.read';

const PERMISSION_REQUIRES: Record<Permission, Role> = {
  'workspace.create':  'owner',
  'workspace.update':  'counsel',
  'workspace.delete':  'owner',
  'matter.create':     'reviewer',
  'matter.update':     'reviewer',
  'matter.archive':    'counsel',
  'contract.create':   'reviewer',
  'contract.generate': 'reviewer',
  'contract.review':   'counsel',
  'contract.approve':  'counsel',
  'contract.export':   'reviewer',
  'contract.delete':   'counsel',
  'team.invite':       'owner',
  'team.remove':       'owner',
  'team.update_role':  'owner',
  'billing.manage':    'owner',
  'audit.read':        'counsel',
  'source.read':       'viewer',
};

export function can(role: Role, permission: Permission): boolean {
  return roleAtLeast(role, PERMISSION_REQUIRES[permission]);
}

export class ForbiddenError extends Error {
  constructor(public readonly permission: Permission, public readonly role: Role) {
    super(`Role "${role}" lacks permission "${permission}" (requires ${PERMISSION_REQUIRES[permission]}).`);
    this.name = 'ForbiddenError';
  }
}

export function assertCan(role: Role, permission: Permission): void {
  if (!can(role, permission)) throw new ForbiddenError(permission, role);
}
