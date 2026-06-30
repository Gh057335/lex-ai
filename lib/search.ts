// Full-text search over legal_chunks using PostgreSQL tsvector.
// Returns ranked passages with their parent source metadata for use as
// retrieval context for the AI assistant.

import { createAdminClient } from '@/lib/supabase';

export interface RetrievedChunk {
  chunkId: string;
  sourceId: string;
  sourceKey: string;
  sourceTitle: string;
  jurisdiction: string;
  publisher: string | null;
  officialUrl: string | null;
  effectiveFrom: string | null;
  locator: string | null;
  headingPath: string[];
  body: string;
}

interface SearchOptions {
  jurisdictions?: string[];
  limit?: number;
}

export async function searchLaws(query: string, opts: SearchOptions = {}): Promise<RetrievedChunk[]> {
  const admin = createAdminClient();
  const limit = opts.limit ?? 20;
  const tsQuery = toTsQuery(query);

  let q = admin
    .from('legal_chunks')
    .select(`
      id, source_id, locator, heading_path, body,
      legal_sources!inner ( key, title, jurisdiction, publisher, official_url, effective_from )
    `)
    .textSearch('tsv', tsQuery, { type: 'plain', config: 'simple' })
    .limit(limit);

  if (opts.jurisdictions && opts.jurisdictions.length > 0) {
    q = q.in('legal_sources.jurisdiction', opts.jurisdictions);
  }

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((row): RetrievedChunk => {
    const src = (row as unknown as { legal_sources: {
      key: string; title: string; jurisdiction: string;
      publisher: string | null; official_url: string | null; effective_from: string | null;
    } }).legal_sources;
    return {
      chunkId: row.id as string,
      sourceId: row.source_id as string,
      sourceKey: src.key,
      sourceTitle: src.title,
      jurisdiction: src.jurisdiction,
      publisher: src.publisher,
      officialUrl: src.official_url,
      effectiveFrom: src.effective_from,
      locator: (row.locator as string | null) ?? null,
      headingPath: (row.heading_path as string[]) ?? [],
      body: row.body as string,
    };
  });
}

// Fallback: if no query is provided or text-search returns nothing, return a
// broad slice of the workspace's corpus so the assistant can still answer
// general questions. Helps a lot with very short queries ("NDA?").
export async function browseLaws(opts: SearchOptions = {}): Promise<RetrievedChunk[]> {
  const admin = createAdminClient();
  let q = admin
    .from('legal_chunks')
    .select(`
      id, source_id, locator, heading_path, body,
      legal_sources!inner ( key, title, jurisdiction, publisher, official_url, effective_from )
    `)
    .limit(opts.limit ?? 30);
  if (opts.jurisdictions && opts.jurisdictions.length > 0) {
    q = q.in('legal_sources.jurisdiction', opts.jurisdictions);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((row): RetrievedChunk => {
    const src = (row as unknown as { legal_sources: {
      key: string; title: string; jurisdiction: string;
      publisher: string | null; official_url: string | null; effective_from: string | null;
    } }).legal_sources;
    return {
      chunkId: row.id as string,
      sourceId: row.source_id as string,
      sourceKey: src.key,
      sourceTitle: src.title,
      jurisdiction: src.jurisdiction,
      publisher: src.publisher,
      officialUrl: src.official_url,
      effectiveFrom: src.effective_from,
      locator: (row.locator as string | null) ?? null,
      headingPath: (row.heading_path as string[]) ?? [],
      body: row.body as string,
    };
  });
}

// Sanitize a user query into a tsquery-safe plain string. Postgres' plainto_tsquery
// already handles operators; we just strip control chars and very long input.
function toTsQuery(q: string): string {
  return q.replace(/[\x00-\x1f]/g, ' ').slice(0, 500).trim();
}

export async function getWorkspaceJurisdictions(orgId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('workspaces')
    .select('enabled_jurisdictions')
    .eq('org_id', orgId)
    .limit(1)
    .maybeSingle();
  const raw = (data?.enabled_jurisdictions as string[] | null) ?? [];
  // Normalize "ae:difc" → "ae-difc" to match legal_sources.jurisdiction format.
  return raw.map((j) => j.replace(':', '-'));
}
