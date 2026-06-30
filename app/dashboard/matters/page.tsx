import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { requireMembership } from '@/lib/auth';
import { JURISDICTION_BY_KEY } from '@/lib/taxonomy';
import { formatDate, truncate } from '@/lib/utils';

export default async function AllMattersPage() {
  await requireMembership();
  const supabase = await createClient();

  const { data: matters } = await supabase
    .from('matters')
    .select('id, name, jurisdictions, status, created_at, workspaces(name)')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
        All matters
      </h1>
      <div className="grid gap-3">
        {(matters ?? []).map((m) => {
          const ws = (m.workspaces as unknown as { name: string } | null)?.name ?? '—';
          return (
            <Link
              key={m.id}
              href={`/dashboard/matters/${m.id}`}
              className="block p-4 rounded-md border hover:border-white/20"
              style={{ borderColor: '#ececec', backgroundColor: '#fafaf9' }}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{truncate(m.name, 90)}</div>
                <div className="text-xs" style={{ color: '#111111' }}>{formatDate(m.created_at)}</div>
              </div>
              <div className="text-xs mt-1" style={{ color: '#6b7280' }}>
                {ws} ·
                {(m.jurisdictions ?? []).map((j: string) => JURISDICTION_BY_KEY.get(j)?.label ?? j).join(', ')}
              </div>
            </Link>
          );
        })}
        {(!matters || matters.length === 0) && (
          <div className="text-sm" style={{ color: '#6b7280' }}>No matters across your workspaces yet.</div>
        )}
      </div>
    </div>
  );
}
