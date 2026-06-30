import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { requireMembership } from '@/lib/auth';
import { JURISDICTION_BY_KEY, SECTOR_BY_KEY } from '@/lib/taxonomy';
import { formatDate, truncate } from '@/lib/utils';

export default async function MatterPage({ params }: { params: Promise<{ id: string }> }) {
  await requireMembership();
  const { id } = await params;
  const supabase = await createClient();

  const { data: matter } = await supabase
    .from('matters')
    .select('id, name, parties, jurisdictions, sectors, is_sharia, status, workspace_id, created_at, workspaces(name)')
    .eq('id', id)
    .maybeSingle();
  if (!matter) notFound();

  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, title, contract_type, language, jurisdictions, status, updated_at')
    .eq('matter_id', id)
    .order('updated_at', { ascending: false });

  const wsName = (matter.workspaces as unknown as { name: string } | null)?.name ?? 'Workspace';

  return (
    <div className="p-8">
      <Link
        href={`/dashboard/workspaces/${matter.workspace_id}`}
        className="text-sm flex items-center gap-1 mb-4"
        style={{ color: '#6b7280' }}
      >
        <ChevronLeft className="w-4 h-4" /> {wsName}
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            {matter.name}
          </h1>
          <div className="text-xs mt-2 flex flex-wrap gap-2" style={{ color: '#6b7280' }}>
            {(matter.jurisdictions ?? []).map((j: string) => (
              <span key={j} className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: '#111111' }}>
                {JURISDICTION_BY_KEY.get(j)?.label ?? j}
              </span>
            ))}
            {(matter.sectors ?? []).map((s: string) => (
              <span key={s} className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(107,151,216,0.1)', color: '#111111' }}>
                {SECTOR_BY_KEY.get(s as never)?.label ?? s}
              </span>
            ))}
            {matter.is_sharia && (
              <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                Sharia-sensitive
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/dashboard/matters/${matter.id}/contracts/new`}
          className="px-4 py-2 rounded-md font-medium text-sm"
          style={{ backgroundColor: '#111111', color: '#ffffff' }}
        >
          Draft a contract
        </Link>
      </div>

      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4" style={{ color: '#111111' }} />
        Contracts
      </h2>
      <div className="grid gap-3">
        {(contracts ?? []).map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/contracts/${c.id}`}
            className="block p-4 rounded-md border hover:border-white/20"
            style={{ borderColor: '#ececec', backgroundColor: '#fafaf9' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{truncate(c.title, 80)}</div>
                <div className="text-xs mt-1" style={{ color: '#6b7280' }}>
                  {c.contract_type ?? 'untyped'} · {c.language?.toUpperCase()} ·
                  {c.jurisdictions?.map((j: string) => JURISDICTION_BY_KEY.get(j)?.label ?? j).join(', ')}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: '#fafaf9', color: '#6b7280' }}
                >
                  {c.status}
                </span>
                <span className="text-xs" style={{ color: '#111111' }}>{formatDate(c.updated_at)}</span>
              </div>
            </div>
          </Link>
        ))}
        {(!contracts || contracts.length === 0) && (
          <div
            className="p-10 rounded-md text-center"
            style={{ border: '1px dashed #d4d4d4', color: '#6b7280' }}
          >
            No contracts in this matter yet. Drafting flow ships in Phase 2 (DIFC services agreement first).
          </div>
        )}
      </div>
    </div>
  );
}
