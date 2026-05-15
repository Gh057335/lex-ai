import Link from 'next/link';
import { Plus, Globe, Briefcase } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { requireMembership } from '@/lib/auth';
import { JURISDICTION_BY_KEY } from '@/lib/taxonomy';
import { formatDate } from '@/lib/utils';

export default async function MarketsPage() {
  const ctx = await requireMembership();
  const supabase = await createClient();

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name, default_jurisdiction, default_language, enabled_jurisdictions, created_at, matters(count)')
    .eq('org_id', ctx.orgId)
    .order('created_at', { ascending: true });

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight" style={{ color: '#111111', letterSpacing: '-0.02em' }}>
            Markets
          </h1>
          <p className="text-[13px] mt-1" style={{ color: '#6b7280' }}>
            Each workspace scopes a set of jurisdictions, sectors and matters.
          </p>
        </div>
        <Link
          href="/dashboard/workspaces/new"
          className="px-3.5 py-2 rounded-md text-[13px] font-medium flex items-center gap-2"
          style={{ backgroundColor: '#111111', color: '#ffffff' }}
        >
          <Plus className="w-4 h-4" strokeWidth={1.75} />
          New market
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {(workspaces ?? []).map((w) => {
          const jurLabel = JURISDICTION_BY_KEY.get(w.default_jurisdiction ?? '')?.label ?? '—';
          const matterCount =
            Array.isArray(w.matters) && w.matters[0] && 'count' in w.matters[0]
              ? (w.matters[0] as { count: number }).count
              : 0;
          return (
            <Link
              key={w.id}
              href={`/dashboard/workspaces/${w.id}`}
              className="block p-4 rounded-xl transition-colors hover:bg-[#fafaf9]"
              style={{ border: '1px solid #ececec', backgroundColor: '#ffffff' }}
            >
              <div className="font-medium text-[14px] mb-2" style={{ color: '#111111' }}>{w.name}</div>
              <div className="text-[12px] flex items-center gap-3" style={{ color: '#6b7280' }}>
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" strokeWidth={1.75} /> {jurLabel}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" strokeWidth={1.75} /> {matterCount} matters
                </span>
              </div>
              <div className="text-[11px] mt-3" style={{ color: '#9ca3af' }}>
                Created {formatDate(w.created_at)}
              </div>
            </Link>
          );
        })}

        {(!workspaces || workspaces.length === 0) && (
          <div
            className="col-span-full p-10 rounded-xl text-center text-[13px]"
            style={{ border: '1px dashed #d4d4d4', color: '#6b7280', backgroundColor: '#fafaf9' }}
          >
            <p className="mb-4">No markets yet.</p>
            <Link
              href="/dashboard/workspaces/new"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-medium"
              style={{ backgroundColor: '#111111', color: '#ffffff' }}
            >
              <Plus className="w-4 h-4" strokeWidth={1.75} /> Create the first market
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
