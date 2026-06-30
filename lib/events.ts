// Regulatory events: surface what changed in the workspace's watched jurisdictions.

import { createAdminClient } from '@/lib/supabase';
import type { ChangeType, Severity } from '@/types/database';

// Re-export for consumers that import these types from this module.
export type { ChangeType, Severity };

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

// Supabase join shape returned by the regulatory_events query.
interface RegulatoryEventJoin {
  id: string;
  change_type: string;
  summary: string;
  diff: { severity?: Severity; action?: string; areas?: string[] } | null;
  detected_at: string;
  effective_at: string | null;
  legal_sources: {
    id: string;
    key: string;
    title: string;
    jurisdiction: string;
    publisher: string | null;
    official_url: string | null;
  };
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
    const r = row as unknown as RegulatoryEventJoin;
    const diff = r.diff ?? {};
    const detectedMs = new Date(r.detected_at).getTime();
    const effectiveMs = r.effective_at ? new Date(r.effective_at).getTime() : null;
    return {
      id: r.id,
      changeType: r.change_type as ChangeType,
      summary: r.summary,
      detectedAt: r.detected_at,
      effectiveAt: r.effective_at,
      daysSinceDetected: Math.floor((now - detectedMs) / (1000 * 60 * 60 * 24)),
      daysToEffective: effectiveMs !== null ? Math.floor((effectiveMs - now) / (1000 * 60 * 60 * 24)) : null,
      severity: diff.severity ?? 'info',
      action: diff.action ?? null,
      areas: diff.areas ?? [],
      source: {
        id: r.legal_sources.id,
        key: r.legal_sources.key,
        title: r.legal_sources.title,
        jurisdiction: r.legal_sources.jurisdiction,
        publisher: r.legal_sources.publisher,
        officialUrl: r.legal_sources.official_url,
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
