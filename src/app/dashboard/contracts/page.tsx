import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { requireMembership } from '@/lib/auth';
import { JURISDICTION_BY_KEY } from '@/lib/taxonomy';
import { formatDate, truncate } from '@/lib/utils';

export default async function AllContractsPage() {
  await requireMembership();
  const supabase = await createClient();

  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, title, contract_type, language, jurisdictions, status, updated_at, matters(name)')
    .order('updated_at', { ascending: false })
    .limit(100);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
        All contracts
      </h1>
      <div className="grid gap-3">
        {(contracts ?? []).map((c) => {
          const m = (c.matters as unknown as { name: string } | null)?.name ?? '—';
          return (
            <Link
              key={c.id}
              href={`/dashboard/contracts/${c.id}`}
              className="block p-4 rounded-md border hover:border-white/20"
              style={{ borderColor: '#ececec', backgroundColor: '#fafaf9' }}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{truncate(c.title, 90)}</div>
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
              <div className="text-xs mt-1" style={{ color: '#6b7280' }}>
                {m} · {c.contract_type ?? 'untyped'} · {c.language?.toUpperCase()} ·
                {(c.jurisdictions ?? []).map((j: string) => JURISDICTION_BY_KEY.get(j)?.label ?? j).join(', ')}
              </div>
            </Link>
          );
        })}
        {(!contracts || contracts.length === 0) && (
          <div className="text-sm" style={{ color: '#6b7280' }}>No contracts yet.</div>
        )}
      </div>
    </div>
  );
}
