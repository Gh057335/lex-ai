import { ScrollText } from 'lucide-react';
import { requireMembership } from '@/lib/auth';
import { createClient } from '@/lib/supabase';
import { formatDateTime } from '@/lib/utils';
import { can } from '@/lib/rbac';

export default async function AuditPage() {
  const ctx = await requireMembership();
  if (!can(ctx.role, 'audit.read')) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-2">Audit log</h1>
        <div className="text-sm" style={{ color: '#6b7280' }}>
          You don&apos;t have permission to view the audit log.
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: entries } = await supabase
    .from('audit_log')
    .select('id, action, target_type, target_id, metadata, created_at, prev_hash, entry_hash, actor_id')
    .eq('org_id', ctx.orgId)
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-2 flex items-center gap-2" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
        <ScrollText className="w-5 h-5" style={{ color: '#111111' }} />
        Audit log
      </h1>
      <p className="text-sm mb-8" style={{ color: '#6b7280' }}>
        Append-only, hash-chained. Each entry&apos;s hash includes the previous entry&apos;s hash —
        tampering breaks the chain.
      </p>

      <div className="rounded-md border overflow-hidden" style={{ borderColor: '#ececec' }}>
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: '#fafaf9', color: '#6b7280' }}>
            <tr className="text-left text-xs uppercase tracking-wider">
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Target</th>
              <th className="px-4 py-2">Hash (preview)</th>
            </tr>
          </thead>
          <tbody>
            {(entries ?? []).map((e) => (
              <tr key={e.id} className="border-t" style={{ borderColor: '#fafaf9' }}>
                <td className="px-4 py-2 whitespace-nowrap" style={{ color: '#6b7280' }}>
                  {formatDateTime(e.created_at)}
                </td>
                <td className="px-4 py-2 font-mono text-xs">{e.action}</td>
                <td className="px-4 py-2 text-xs" style={{ color: '#6b7280' }}>
                  {e.target_type ?? '—'}
                </td>
                <td className="px-4 py-2 font-mono text-xs" style={{ color: '#111111' }}>
                  {e.entry_hash?.slice(0, 12)}…
                </td>
              </tr>
            ))}
            {(!entries || entries.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center" style={{ color: '#6b7280' }}>
                  No audit events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
