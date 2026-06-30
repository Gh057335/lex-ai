'use client';

import { useState, useMemo } from 'react';
import {
  Sparkles, AlertOctagon, AlertTriangle, Info, ShieldCheck, ExternalLink, Calendar, ChevronDown,
} from 'lucide-react';
import { generateDigestAction, type DigestResponse } from '@/lib/actions/digest';
import type { RegulatoryEventRow, EventStats, Severity, ChangeType } from '@/lib/events';

interface Props {
  events: RegulatoryEventRow[];
  stats: EventStats;
  jurisdictions: string[];
}

export function AlertsClient({ events, stats, jurisdictions }: Props) {
  const [digest, setDigest] = useState<DigestResponse | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);
  const [digestError, setDigestError] = useState<string | null>(null);
  const [jurFilter, setJurFilter] = useState<string | null>(null);
  const [sevFilter, setSevFilter] = useState<Severity | null>(null);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (jurFilter && e.source.jurisdiction !== jurFilter) return false;
      if (sevFilter && e.severity !== sevFilter) return false;
      return true;
    });
  }, [events, jurFilter, sevFilter]);

  async function generateDigest() {
    setDigestLoading(true);
    setDigestError(null);
    try {
      const r = await generateDigestAction();
      setDigest(r);
    } catch (err) {
      setDigestError(err instanceof Error ? err.message : 'Digest failed');
    } finally {
      setDigestLoading(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-8 py-8">
        <StatsBar stats={stats} />

        <DigestPanel
          digest={digest}
          loading={digestLoading}
          error={digestError}
          onGenerate={generateDigest}
          eventCount={events.length}
        />

        <FilterBar
          events={events}
          jurisdictions={jurisdictions}
          jurFilter={jurFilter}
          sevFilter={sevFilter}
          onJurChange={setJurFilter}
          onSevChange={setSevFilter}
        />

        <div className="space-y-3 mt-4">
          {filtered.length === 0 ? (
            <div className="p-10 rounded-md text-center" style={{ border: '1px dashed #d4d4d4', color: '#6b7280' }}>
              No events matching these filters.
            </div>
          ) : (
            filtered.map((e) => <EventCard key={e.id} event={e} />)
          )}
        </div>
      </div>
    </div>
  );
}

function StatsBar({ stats }: { stats: EventStats }) {
  const cells = [
    { label: 'Events (90d)',          value: stats.total,                tone: '#111111' },
    { label: 'High / blocking',       value: stats.blockingOrHigh,       tone: stats.blockingOrHigh > 0 ? '#ef4444' : '#9ca3af' },
    { label: 'Effective ≤ 30d',       value: stats.upcomingEffective30d, tone: stats.upcomingEffective30d > 0 ? '#f59e0b' : '#9ca3af' },
    { label: 'New regulations',       value: stats.byChangeType.new,     tone: '#6b7280' },
    { label: 'Amendments',            value: stats.byChangeType.amended, tone: '#6b7280' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {cells.map((c) => (
        <div key={c.label} className="rounded-md p-4" style={{ border: '1px solid #ececec' }}>
          <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: '#9ca3af' }}>
            {c.label}
          </div>
          <div className="text-2xl font-semibold mt-1" style={{ color: c.tone, fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function DigestPanel({
  digest, loading, error, onGenerate, eventCount,
}: {
  digest: DigestResponse | null;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
  eventCount: number;
}) {
  return (
    <div className="rounded-md p-5 mb-6"
      style={{ border: '1px solid rgba(201,168,76,0.22)', backgroundColor: 'rgba(201,168,76,0.04)' }}>
      <div className="flex items-start justify-between mb-3 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] flex items-center gap-1.5" style={{ color: '#111111' }}>
            <Sparkles className="w-3 h-3" /> AI Executive briefing
          </div>
          <div className="text-sm mt-1" style={{ color: '#6b7280' }}>
            One-paragraph synthesis of what changed and what to do this week.
          </div>
        </div>
        <button
          onClick={onGenerate}
          disabled={loading || eventCount === 0}
          className="text-xs uppercase tracking-[0.18em] px-3 py-2 rounded disabled:opacity-50"
          style={{ backgroundColor: '#111111', color: '#ffffff' }}>
          {loading ? 'Generating…' : digest ? 'Regenerate' : 'Generate briefing'}
        </button>
      </div>

      {error && (
        <div className="text-sm mt-2 px-3 py-2 rounded"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }}>
          {error}
        </div>
      )}

      {digest ? (
        <div className="mt-2 text-sm leading-[1.7]" style={{ color: '#111111' }}>
          <DigestMarkdown text={digest.digest} />
          <div className="text-[10px] uppercase tracking-[0.18em] mt-3" style={{ color: '#9ca3af' }}>
            Generated {new Date(digest.generatedAt).toLocaleString()} · {digest.eventCount} events analysed
          </div>
        </div>
      ) : (
        <div className="text-xs mt-2" style={{ color: '#9ca3af' }}>
          Click "Generate briefing" to summarise the last 60 days for {eventCount > 0 ? `${eventCount} events` : 'this workspace'}.
        </div>
      )}
    </div>
  );
}

function DigestMarkdown({ text }: { text: string }) {
  // Minimal markdown: **bold** and double-newline paragraphs.
  const paragraphs = text.split(/\n\n+/);
  return (
    <div className="space-y-2">
      {paragraphs.map((p, i) => (
        <p key={i}>
          {p.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={j} style={{ color: '#111111' }}>{part.slice(2, -2)}</strong>
            ) : (
              <span key={j}>{part}</span>
            )
          )}
        </p>
      ))}
    </div>
  );
}

function FilterBar({
  events, jurisdictions, jurFilter, sevFilter, onJurChange, onSevChange,
}: {
  events: RegulatoryEventRow[];
  jurisdictions: string[];
  jurFilter: string | null;
  sevFilter: Severity | null;
  onJurChange: (j: string | null) => void;
  onSevChange: (s: Severity | null) => void;
}) {
  const jurCounts = new Map<string, number>();
  for (const e of events) jurCounts.set(e.source.jurisdiction, (jurCounts.get(e.source.jurisdiction) ?? 0) + 1);
  const sevs: Severity[] = ['blocking', 'high', 'attention', 'info'];

  return (
    <div className="flex items-center justify-between flex-wrap gap-2 pb-3 mt-2"
      style={{ borderBottom: '1px solid #ececec' }}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-[0.18em] mr-1" style={{ color: '#9ca3af' }}>Jurisdiction</span>
        <FilterChip active={jurFilter === null} onClick={() => onJurChange(null)} label={`All (${events.length})`} />
        {jurisdictions.map((j) => (
          <FilterChip key={j}
            active={jurFilter === j}
            onClick={() => onJurChange(j === jurFilter ? null : j)}
            label={`${j} (${jurCounts.get(j) ?? 0})`} />
        ))}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-[0.18em] mr-1" style={{ color: '#9ca3af' }}>Severity</span>
        <FilterChip active={sevFilter === null} onClick={() => onSevChange(null)} label="All" />
        {sevs.map((s) => (
          <FilterChip key={s}
            active={sevFilter === s}
            onClick={() => onSevChange(s === sevFilter ? null : s)}
            label={s}
            tone={SEV_TONE[s].text} />
        ))}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label, tone }: { active: boolean; onClick: () => void; label: string; tone?: string }) {
  return (
    <button onClick={onClick}
      className="text-xs px-2.5 py-1 rounded-full uppercase tracking-[0.14em]"
      style={{
        backgroundColor: active ? 'rgba(201,168,76,0.16)' : 'transparent',
        color: active ? (tone ?? '#111111') : '#6b7280',
        border: '1px solid ' + (active ? 'rgba(201,168,76,0.4)' : '#e5e5e5'),
      }}>
      {label}
    </button>
  );
}

function EventCard({ event }: { event: RegulatoryEventRow }) {
  const sev = SEV_TONE[event.severity];
  const Icon = sev.icon;
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="rounded-md overflow-hidden"
      style={{ border: '1px solid ' + sev.border, backgroundColor: sev.bg }}>
      <header className="px-4 py-3 flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: sev.text }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap text-[10px] uppercase tracking-[0.18em] mb-1">
            <span className="px-1.5 py-0.5 rounded" style={{ color: sev.text, backgroundColor: sev.badge, border: '1px solid ' + sev.border }}>
              {event.severity}
            </span>
            <span className="px-1.5 py-0.5 rounded" style={{ color: '#6b7280', border: '1px solid #e5e5e5' }}>
              {event.changeType}
            </span>
            <span style={{ color: '#9ca3af' }}>{event.source.jurisdiction}</span>
            <span style={{ color: '#9ca3af' }}>·</span>
            <span style={{ color: '#9ca3af' }}>{event.daysSinceDetected === 0 ? 'today' : `${event.daysSinceDetected}d ago`}</span>
          </div>
          <div className="text-sm font-semibold" style={{ color: '#111111' }}>{event.source.title}</div>
          <p className="text-sm mt-1 leading-[1.55]" style={{ color: '#d1d6e0' }}>{event.summary}</p>
          {event.effectiveAt && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-[11px]" style={{ color: event.daysToEffective !== null && event.daysToEffective <= 30 && event.daysToEffective >= 0 ? '#f59e0b' : '#6b7280' }}>
              <Calendar className="w-3 h-3" />
              <span>Effective {event.effectiveAt}</span>
              {event.daysToEffective !== null && (
                <span style={{ color: '#9ca3af' }}>
                  ({event.daysToEffective < 0 ? `${-event.daysToEffective}d ago` : event.daysToEffective === 0 ? 'today' : `in ${event.daysToEffective}d`})
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {event.source.officialUrl && (
            <a href={event.source.officialUrl} target="_blank" rel="noreferrer"
              className="text-[10px] uppercase tracking-[0.18em] inline-flex items-center gap-1"
              style={{ color: '#9ca3af' }}>
              Source <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button onClick={() => setExpanded(!expanded)}
            className="text-[10px] uppercase tracking-[0.18em] inline-flex items-center gap-1"
            style={{ color: event.action ? '#111111' : '#9ca3af' }}>
            {expanded ? 'Less' : 'Details'} <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </header>

      {expanded && (
        <div className="px-4 pb-4 pt-1" style={{ borderTop: '1px solid #fafaf9' }}>
          {event.areas.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 mt-3">
              {event.areas.map((a) => (
                <span key={a} className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: '#fafaf9', color: '#6b7280' }}>{a}</span>
              ))}
            </div>
          )}
          {event.action && (
            <div className="mt-2">
              <div className="text-[10px] uppercase tracking-[0.18em] mb-1" style={{ color: '#111111' }}>
                Suggested action
              </div>
              <p className="text-sm leading-[1.55]" style={{ color: '#111111' }}>{event.action}</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

const SEV_TONE: Record<Severity, { icon: typeof ShieldCheck; text: string; border: string; bg: string; badge: string }> = {
  info:      { icon: Info,            text: '#7aa6e0', border: 'rgba(122,166,224,0.18)', bg: 'rgba(122,166,224,0.025)', badge: 'rgba(122,166,224,0.12)' },
  attention: { icon: AlertTriangle,   text: '#f59e0b', border: 'rgba(245,158,11,0.22)',  bg: 'rgba(245,158,11,0.025)',  badge: 'rgba(245,158,11,0.12)' },
  high:      { icon: AlertOctagon,    text: '#ef4444', border: 'rgba(239,68,68,0.22)',   bg: 'rgba(239,68,68,0.025)',   badge: 'rgba(239,68,68,0.12)' },
  blocking:  { icon: AlertOctagon,    text: '#ef4444', border: 'rgba(239,68,68,0.35)',   bg: 'rgba(239,68,68,0.05)',    badge: 'rgba(239,68,68,0.20)' },
};
