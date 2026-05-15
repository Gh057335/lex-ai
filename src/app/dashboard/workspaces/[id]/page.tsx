import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { requireMembership } from '@/lib/auth';
import { JURISDICTION_BY_KEY, SECTOR_BY_KEY, JURISDICTIONS, SECTORS } from '@/lib/taxonomy';
import { formatDate } from '@/lib/utils';
import { createMatterAction } from '@/lib/actions/matters';

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  await requireMembership();
  const { id } = await params;
  const supabase = await createClient();

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name, default_jurisdiction, default_language, enabled_jurisdictions, enabled_sectors')
    .eq('id', id)
    .maybeSingle();
  if (!workspace) notFound();

  const { data: matters } = await supabase
    .from('matters')
    .select('id, name, jurisdictions, sectors, status, created_at')
    .eq('workspace_id', id)
    .order('created_at', { ascending: false });

  const allowedJurisdictions = workspace.enabled_jurisdictions?.length
    ? JURISDICTIONS.filter((j) => workspace.enabled_jurisdictions.includes(j.key))
    : JURISDICTIONS;
  const allowedSectors = workspace.enabled_sectors?.length
    ? SECTORS.filter((s) => (workspace.enabled_sectors as string[]).includes(s.key))
    : SECTORS;

  return (
    <div className="p-8">
      <Link
        href="/dashboard"
        className="text-sm flex items-center gap-1 mb-4"
        style={{ color: '#6b7280' }}
      >
        <ChevronLeft className="w-4 h-4" /> Back to workspaces
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            {workspace.name}
          </h1>
          <div className="text-xs mt-2 flex flex-wrap gap-2" style={{ color: '#111111' }}>
            <span>Default: {JURISDICTION_BY_KEY.get(workspace.default_jurisdiction ?? '')?.label ?? '—'}</span>
            <span>·</span>
            <span>{workspace.default_language?.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Matters</h2>
        <div className="grid gap-3">
          {(matters ?? []).map((m) => (
            <Link
              key={m.id}
              href={`/dashboard/matters/${m.id}`}
              className="block p-4 rounded-md border hover:border-white/20"
              style={{ borderColor: '#ececec', backgroundColor: '#fafaf9' }}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{m.name}</div>
                <div className="text-xs" style={{ color: '#111111' }}>{formatDate(m.created_at)}</div>
              </div>
              <div className="text-xs mt-2 flex flex-wrap gap-1.5" style={{ color: '#6b7280' }}>
                {(m.jurisdictions ?? []).map((j: string) => (
                  <span key={j} className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: '#111111' }}>
                    {JURISDICTION_BY_KEY.get(j)?.label ?? j}
                  </span>
                ))}
                {(m.sectors ?? []).map((s: string) => (
                  <span key={s} className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(107,151,216,0.1)', color: '#111111' }}>
                    {SECTOR_BY_KEY.get(s as never)?.label ?? s}
                  </span>
                ))}
              </div>
            </Link>
          ))}
          {(!matters || matters.length === 0) && (
            <div className="text-sm" style={{ color: '#6b7280' }}>No matters yet. Create one below.</div>
          )}
        </div>
      </section>

      <section className="max-w-2xl">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" style={{ color: '#111111' }} />
          New matter
        </h2>
        <form action={createMatterAction} className="space-y-4">
          <input type="hidden" name="workspace_id" value={workspace.id} />
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#6b7280' }}>Matter name</label>
            <input
              name="name"
              required
              placeholder="e.g. DIFC SaaS distribution agreement — ACME"
              className="w-full px-3 py-2 rounded-md outline-none"
              style={{ backgroundColor: '#fafaf9', border: '1px solid #e5e5e5' }}
            />
          </div>
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#6b7280' }}>Counterparty (optional)</label>
            <input
              name="counterparty"
              placeholder="e.g. ACME Holdings Ltd."
              className="w-full px-3 py-2 rounded-md outline-none"
              style={{ backgroundColor: '#fafaf9', border: '1px solid #e5e5e5' }}
            />
          </div>
          <fieldset>
            <legend className="text-sm mb-2" style={{ color: '#6b7280' }}>Jurisdictions</legend>
            <div className="flex flex-wrap gap-2">
              {allowedJurisdictions.map((j) => (
                <label
                  key={j.key}
                  className="flex items-center gap-2 px-3 py-1.5 rounded text-sm cursor-pointer"
                  style={{ backgroundColor: '#fafaf9', border: '1px solid #ececec' }}
                >
                  <input type="checkbox" name="jurisdictions" value={j.key} />
                  {j.label}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm mb-2" style={{ color: '#6b7280' }}>Sectors</legend>
            <div className="flex flex-wrap gap-2">
              {allowedSectors.map((s) => (
                <label
                  key={s.key}
                  className="flex items-center gap-2 px-3 py-1.5 rounded text-sm cursor-pointer"
                  style={{ backgroundColor: '#fafaf9', border: '1px solid #ececec' }}
                >
                  <input type="checkbox" name="sectors" value={s.key} />
                  {s.label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm" style={{ color: '#6b7280' }}>
            <input type="checkbox" name="is_sharia" />
            Sharia-sensitive matter (flag riba/gharar/haram clauses)
          </label>
          <button
            type="submit"
            className="px-5 py-2 rounded-md font-medium"
            style={{ backgroundColor: '#111111', color: '#ffffff' }}
          >
            Create matter
          </button>
        </form>
      </section>
    </div>
  );
}
