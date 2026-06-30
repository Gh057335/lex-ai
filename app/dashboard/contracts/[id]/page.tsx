import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, AlertOctagon, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { requireMembership } from '@/lib/auth';
import { JURISDICTION_BY_KEY } from '@/lib/taxonomy';
import { formatDateTime } from '@/lib/utils';

type ClauseRow = {
  id: string;
  ordinal: number;
  clause_type: string;
  heading: string | null;
  body_md: string;
  risk_level: 'ok' | 'attention' | 'high' | 'blocking' | null;
  confidence: 'high' | 'medium' | 'low';
  rationale: string | null;
  clause_citations: Array<{
    id: string;
    locator: string | null;
    quote: string | null;
    legal_sources: { key: string; title: string; official_url: string | null; effective_from: string | null } | null;
  }>;
};

type VersionShape = {
  id: string;
  version_no: number;
  generated_by: string;
  clauses: ClauseRow[];
};

export default async function ContractPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ review?: string }>;
}) {
  await requireMembership();
  const { id } = await params;
  const { review } = await searchParams;
  const supabase = await createClient();

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, title, language, jurisdictions, contract_type, status, matter_id, current_version_id, source_file_path, created_at, updated_at, matters(name, workspace_id)')
    .eq('id', id)
    .maybeSingle();
  if (!contract) notFound();

  let version: VersionShape | null = null;
  if (contract.current_version_id) {
    const { data } = await supabase
      .from('contract_versions')
      .select('id, version_no, generated_by, clauses(id, ordinal, clause_type, heading, body_md, risk_level, confidence, rationale, clause_citations(id, locator, quote, legal_sources(key, title, official_url, effective_from)))')
      .eq('id', contract.current_version_id)
      .maybeSingle();
    version = data as unknown as VersionShape | null;
  }

  const matterName = (contract.matters as unknown as { name: string } | null)?.name ?? 'Matter';
  const clauses = [...(version?.clauses ?? [])].sort((a, b) => a.ordinal - b.ordinal);

  const counts = {
    blocking: clauses.filter((c) => c.risk_level === 'blocking').length,
    high:     clauses.filter((c) => c.risk_level === 'high').length,
    attention: clauses.filter((c) => c.risk_level === 'attention').length,
    ok:       clauses.filter((c) => c.risk_level === 'ok').length,
  };
  const isReview = review === '1' || version?.generated_by === 'review_merge';

  return (
    <div className="p-8 max-w-5xl">
      <Link
        href={`/dashboard/matters/${contract.matter_id}`}
        className="text-sm flex items-center gap-1 mb-4"
        style={{ color: '#6b7280' }}
      >
        <ChevronLeft className="w-4 h-4" /> {matterName}
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] mb-2" style={{ color: '#111111' }}>
            {isReview ? 'Document review' : 'AI-drafted contract'}
          </div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            {contract.title}
          </h1>
          <div className="text-xs mt-2 flex flex-wrap gap-2" style={{ color: '#6b7280' }}>
            <span>{contract.contract_type ?? 'untyped'}</span>
            <span>·</span>
            <span>{contract.language?.toUpperCase()}</span>
            {(contract.jurisdictions ?? []).map((j: string) => (
              <span key={j} className="px-2 py-0.5 rounded"
                style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: '#111111' }}>
                {JURISDICTION_BY_KEY.get(j)?.label ?? j}
              </span>
            ))}
            {contract.source_file_path && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{contract.source_file_path}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {isReview && clauses.length > 0 && <RiskBanner counts={counts} />}

      {version == null && (
        <div className="p-10 rounded-md text-center"
          style={{ border: '1px dashed #d4d4d4', color: '#6b7280' }}>
          No version yet.
          <div className="text-xs mt-2" style={{ color: '#111111' }}>
            Updated {formatDateTime(contract.updated_at)}
          </div>
        </div>
      )}

      {version && (
        <article className="space-y-4 mt-6">
          {clauses.map((cl) => (
            <ClauseCard key={cl.id} clause={cl} />
          ))}
        </article>
      )}
    </div>
  );
}

function RiskBanner({ counts }: { counts: { blocking: number; high: number; attention: number; ok: number } }) {
  const total = counts.blocking + counts.high + counts.attention + counts.ok;
  const summary = counts.blocking > 0
    ? `${counts.blocking} blocking finding${counts.blocking === 1 ? '' : 's'} — do not sign without remediation.`
    : counts.high > 0
      ? `${counts.high} high-risk finding${counts.high === 1 ? '' : 's'} — counsel review required.`
      : counts.attention > 0
        ? `${counts.attention} minor improvements suggested.`
        : 'No material issues — document is consistent with the corpus.';

  return (
    <div className="rounded-md p-4 mb-2 flex items-start gap-4"
      style={{
        backgroundColor: counts.blocking > 0 ? 'rgba(239,68,68,0.06)' : counts.high > 0 ? 'rgba(245,158,11,0.06)' : 'rgba(34,197,94,0.06)',
        border: '1px solid ' + (counts.blocking > 0 ? 'rgba(239,68,68,0.25)' : counts.high > 0 ? 'rgba(245,158,11,0.25)' : 'rgba(34,197,94,0.25)'),
      }}>
      <div className="flex-1">
        <div className="text-sm font-semibold mb-2" style={{ color: '#111111' }}>{summary}</div>
        <div className="flex flex-wrap gap-3 text-xs" style={{ color: '#6b7280' }}>
          {counts.blocking > 0 && <span><b style={{ color: '#ef4444' }}>{counts.blocking}</b> blocking</span>}
          {counts.high > 0     && <span><b style={{ color: '#ef4444' }}>{counts.high}</b> high</span>}
          {counts.attention > 0 && <span><b style={{ color: '#f59e0b' }}>{counts.attention}</b> attention</span>}
          {counts.ok > 0       && <span><b style={{ color: '#22c55e' }}>{counts.ok}</b> ok</span>}
          <span style={{ color: '#9ca3af' }}>· {total} clauses analysed</span>
        </div>
      </div>
    </div>
  );
}

function ClauseCard({ clause }: { clause: ClauseRow }) {
  const risk = clause.risk_level ?? 'ok';
  const tone = TONE[risk];
  const Icon = tone.icon;

  return (
    <section className="rounded-md overflow-hidden"
      style={{ border: '1px solid ' + tone.border, backgroundColor: tone.bg }}>
      <header className="px-4 py-3 flex items-center gap-3"
        style={{ borderBottom: '1px solid #ececec' }}>
        <Icon className="w-4 h-4" style={{ color: tone.icon_color }} />
        <div className="flex-1">
          <div className="text-sm font-semibold" style={{ color: '#111111' }}>
            {clause.heading ?? clauseTypeLabel(clause.clause_type)}
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] mt-0.5" style={{ color: '#9ca3af' }}>
            {clauseTypeLabel(clause.clause_type)}
          </div>
        </div>
        <RiskBadge level={risk} />
      </header>

      <div className="px-4 py-3">
        <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#d1d6e0' }}>
          {clause.body_md}
        </div>

        {clause.rationale && (
          <div className="mt-4 rounded-md p-3 text-sm leading-relaxed"
            style={{ backgroundColor: '#fafaf9', border: '1px solid #ececec', color: '#111111' }}>
            <RenderRationale text={clause.rationale} />
          </div>
        )}

        {clause.clause_citations?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {clause.clause_citations.map((cit) => {
              const src = cit.legal_sources;
              return (
                <a key={cit.id}
                  href={src?.official_url ?? '#'}
                  target="_blank" rel="noopener"
                  title={cit.quote ?? src?.title}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(201,168,76,0.10)', color: '#111111', border: '1px solid rgba(201,168,76,0.18)' }}>
                  {src?.key ?? 'source'}{cit.locator ? ` · ${cit.locator}` : ''}
                </a>
              );
            })}
          </div>
        )}

        {clause.confidence === 'low' && (
          <div className="text-[11px] mt-3" style={{ color: '#f59e0b' }}>
            ⚠ Low confidence — verify with human counsel.
          </div>
        )}
      </div>
    </section>
  );
}

function RiskBadge({ level }: { level: 'ok' | 'attention' | 'high' | 'blocking' }) {
  const t = TONE[level];
  return (
    <span className="text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded"
      style={{ color: t.icon_color, backgroundColor: t.badge_bg, border: '1px solid ' + t.border }}>
      {level}
    </span>
  );
}

const TONE = {
  ok:        { icon: ShieldCheck,   icon_color: '#22c55e', border: 'rgba(34,197,94,0.18)',  bg: 'rgba(34,197,94,0.025)',  badge_bg: 'rgba(34,197,94,0.10)' },
  attention: { icon: AlertTriangle, icon_color: '#f59e0b', border: 'rgba(245,158,11,0.22)', bg: 'rgba(245,158,11,0.025)', badge_bg: 'rgba(245,158,11,0.12)' },
  high:      { icon: AlertOctagon,  icon_color: '#ef4444', border: 'rgba(239,68,68,0.22)',  bg: 'rgba(239,68,68,0.025)',  badge_bg: 'rgba(239,68,68,0.12)' },
  blocking:  { icon: AlertOctagon,  icon_color: '#ef4444', border: 'rgba(239,68,68,0.35)',  bg: 'rgba(239,68,68,0.05)',   badge_bg: 'rgba(239,68,68,0.20)' },
} as const;

function clauseTypeLabel(t: string): string {
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function RenderRationale({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/);
  return (
    <div className="space-y-2">
      {blocks.map((b, i) => {
        const headerMatch = b.match(/^\*\*(.+?)\.\*\*\s*([\s\S]*)$/);
        if (headerMatch) {
          return (
            <div key={i}>
              <span className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: '#111111' }}>
                {headerMatch[1]}
              </span>
              <div className="mt-1 whitespace-pre-wrap">{headerMatch[2]}</div>
            </div>
          );
        }
        return <div key={i} className="whitespace-pre-wrap">{b}</div>;
      })}
    </div>
  );
}
