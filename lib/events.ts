// Regulatory events: surface what changed in the workspace's watched jurisdictions.

import { createAdminClient } from '@/lib/supabase';

export type ChangeType = 'new' | 'amended' | 'superseded' | 'withdrawn';
export type Severity = 'info' | 'attention' | 'high' | 'blocking';

export interface RegulatoryEventRow {
  id: string;
  changeType: ChangeType;
  summary: string;
  detectedAt: string;
  effectiveAt: string | null;
  daysSinceDetected: number;
  daysToEffective: number | null;
  severity: Severity;
  action: string | null;
  areas: string[];
  source: {
    id: string;
    key: string;
    title: string;
    jurisdiction: string;
    publisher: string | null;
    officialUrl: string | null;
  };
}

interface ListOptions {
  jurisdictions?: string[];
  sinceDays?: number;
  limit?: number;
}

export async function listEvents(opts: ListOptions = {}): Promise<RegulatoryEventRow[]> {
  const admin = createAdminClient();
  const sinceDays = opts.sinceDays ?? 60;
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();

  let q = admin
    .from('regulatory_events')
    .select(`
      id, change_type, summary, diff, detected_at, effective_at,
      legal_sources!inner ( id, key, title, jurisdiction, publisher, official_url )
    `)
    .gte('detected_at', since)
    .order('detected_at', { ascending: false })
    .limit(opts.limit ?? 50);

  if (opts.jurisdictions && opts.jurisdictions.length > 0) {
    q = q.in('legal_sources.jurisdiction', opts.jurisdictions);
  }

  const { data, error } = await q;
  if (error) throw error;

  const now = Date.now();
  return (data ?? []).map((row): RegulatoryEventRow => {
    const src = (row as unknown as { legal_sources: {
      id: string; key: string; title: string; jurisdiction: string;
      publisher: string | null; official_url: string | null;
    } }).legal_sources;
    const diff = (row.diff as { severity?: Severity; action?: string; areas?: string[] } | null) ?? {};
    const detectedMs = new Date(row.detected_at as string).getTime();
    const effectiveMs = row.effective_at ? new Date(row.effective_at as string).getTime() : null;
    return {
      id: row.id as string,
      changeType: row.change_type as ChangeType,
      summary: row.summary as string,
      detectedAt: row.detected_at as string,
      effectiveAt: (row.effective_at as string | null) ?? null,
      daysSinceDetected: Math.floor((now - detectedMs) / (1000 * 60 * 60 * 24)),
      daysToEffective: effectiveMs !== null ? Math.floor((effectiveMs - now) / (1000 * 60 * 60 * 24)) : null,
      severity: diff.severity ?? 'info',
      action: diff.action ?? null,
      areas: diff.areas ?? [],
      source: {
        id: src.id,
        key: src.key,
        title: src.title,
        jurisdiction: src.jurisdiction,
        publisher: src.publisher,
        officialUrl: src.official_url,
      },
    };
  });
}

export interface EventStats {
  total: number;
  byChangeType: Record<ChangeType, number>;
  bySeverity: Record<Severity, number>;
  upcomingEffective30d: number;
  blockingOrHigh: number;
}

export function computeStats(events: RegulatoryEventRow[]): EventStats {
  const byChangeType: Record<ChangeType, number> = { new: 0, amended: 0, superseded: 0, withdrawn: 0 };
  const bySeverity: Record<Severity, number> = { info: 0, attention: 0, high: 0, blocking: 0 };
  let upcoming = 0;
  for (const e of events) {
    byChangeType[e.changeType]++;
    bySeverity[e.severity]++;
    if (e.daysToEffective !== null && e.daysToEffective >= 0 && e.daysToEffective <= 30) upcoming++;
  }
  return {
    total: events.length,
    byChangeType,
    bySeverity,
    upcomingEffective30d: upcoming,
    blockingOrHigh: bySeverity.high + bySeverity.blocking,
  };
}
