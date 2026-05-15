/**
 * Append-only, hash-chained audit log.
 *
 * Each entry's `entry_hash` is SHA-256 of `prev_hash || canonical_payload`,
 * where `prev_hash` is the previous entry's hash for the same org_id. This lets
 * us detect tampering by recomputing the chain from any known-good checkpoint.
 *
 * Writes always go through the service-role client — audit_log has no RLS
 * INSERT policy, by design.
 */

import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase';
import type { AuditLogEntry, UUID } from '@/types/database';

export interface AuditWrite {
  orgId: UUID | null;
  actorId: UUID | null;
  action: string;
  targetType?: string | null;
  targetId?: UUID | null;
  promptHash?: string | null;
  retrievalHash?: string | null;
  outputHash?: string | null;
  metadata?: Record<string, unknown>;
}

function canonical(payload: Record<string, unknown>): string {
  // Stable JSON serialization: sort keys, ensure deterministic ordering.
  const keys = Object.keys(payload).sort();
  const obj: Record<string, unknown> = {};
  for (const k of keys) obj[k] = payload[k];
  return JSON.stringify(obj);
}

function sha256(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

export async function recordAudit(entry: AuditWrite): Promise<AuditLogEntry> {
  const admin = createAdminClient();

  let prevHash: string | null = null;
  if (entry.orgId) {
    const { data: prev } = await admin
      .from('audit_log')
      .select('entry_hash')
      .eq('org_id', entry.orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    prevHash = prev?.entry_hash ?? null;
  }

  const payload = {
    org_id: entry.orgId,
    actor_id: entry.actorId,
    action: entry.action,
    target_type: entry.targetType ?? null,
    target_id: entry.targetId ?? null,
    prompt_hash: entry.promptHash ?? null,
    retrieval_hash: entry.retrievalHash ?? null,
    output_hash: entry.outputHash ?? null,
    metadata: entry.metadata ?? {},
  };

  const entryHash = sha256((prevHash ?? '') + canonical(payload));

  const { data, error } = await admin
    .from('audit_log')
    .insert({ ...payload, prev_hash: prevHash, entry_hash: entryHash })
    .select('*')
    .single();

  if (error) throw error;
  return data as AuditLogEntry;
}

export function hashContent(s: string): string {
  return sha256(s);
}
