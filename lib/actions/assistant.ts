'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireMembership } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { askAssistant, draftDocument, type CitationRef } from '@/lib/ai';
import { searchLaws, browseLaws, getWorkspaceJurisdictions } from '@/lib/search';
import { recordAudit, hashContent } from '@/lib/audit';
import { ensureAutoMatter } from '@/lib/db/matters';

export interface AssistantResponse {
  answer: string;
  citations: CitationRef[];
  retrievedCount: number;
  jurisdictions: string[];
}

export async function askLegalAssistantAction(formData: FormData): Promise<AssistantResponse> {
  const ctx = await requireMembership();
  const question = String(formData.get('question') ?? '').trim();
  if (!question) throw new Error('Question is required');

  const jurisdictions = await getWorkspaceJurisdictions(ctx.orgId);

  let chunks = await searchLaws(question, { jurisdictions, limit: 20 });
  if (chunks.length === 0) {
    chunks = await browseLaws({ jurisdictions, limit: 30 });
  }

  const { answer, citations } = await askAssistant(question, chunks);

  await recordAudit({
    orgId: ctx.orgId,
    actorId: ctx.userId,
    action: 'assistant.ask',
    promptHash: hashContent(question),
    outputHash: hashContent(answer),
    retrievalHash: hashContent(chunks.map((c) => c.chunkId).join(',')),
    metadata: { jurisdictions, retrieved: chunks.length, cited: citations.length },
  });

  return { answer, citations, retrievedCount: chunks.length, jurisdictions };
}

export async function generateDocumentAction(formData: FormData): Promise<void> {
  const ctx = await requireMembership();
  const documentType = String(formData.get('documentType') ?? '').trim();
  const jurisdiction = String(formData.get('jurisdiction') ?? '').trim();
  const parties = String(formData.get('parties') ?? '').trim();
  const context = String(formData.get('context') ?? '').trim() || undefined;

  if (!documentType) throw new Error('documentType is required');
  if (!jurisdiction) throw new Error('jurisdiction is required');
  if (!parties) throw new Error('parties are required');

  const admin = createAdminClient();
  const retrievalQuery = [documentType, jurisdiction, context].filter(Boolean).join(' ');
  let chunks = await searchLaws(retrievalQuery, { jurisdictions: [jurisdiction], limit: 25 });
  if (chunks.length === 0) {
    chunks = await browseLaws({ jurisdictions: [jurisdiction], limit: 30 });
  }

  const drafted = await draftDocument({ documentType, jurisdiction, parties, context }, chunks);
  const matterId = await ensureAutoMatter(ctx.orgId, 'AI-drafted documents');

  const { data: contract, error: contractErr } = await admin
    .from('contracts')
    .insert({
      matter_id: matterId,
      title: drafted.title,
      language: 'en',
      jurisdictions: [jurisdiction],
      contract_type: documentType,
      status: 'review',
      created_by: ctx.userId,
    })
    .select('id')
    .single();
  if (contractErr || !contract) throw contractErr ?? new Error('contract insert failed');

  const promptHash = hashContent(`${documentType}|${jurisdiction}|${parties}|${context ?? ''}`);
  const retrievalHash = hashContent(chunks.map((c) => c.chunkId).join(','));
  const outputHash = hashContent(drafted.bodyMd);

  const { data: version, error: versionErr } = await admin
    .from('contract_versions')
    .insert({
      contract_id: contract.id,
      version_no: 1,
      body_md: drafted.bodyMd,
      generated_by: 'ai',
      prompt_hash: promptHash,
      retrieval_hash: retrievalHash,
      model_id: drafted.modelId,
      created_by: ctx.userId,
    })
    .select('id')
    .single();
  if (versionErr || !version) throw versionErr ?? new Error('contract_version insert failed');

  await admin
    .from('contracts')
    .update({ current_version_id: version.id })
    .eq('id', contract.id);

  if (drafted.citations.length > 0) {
    await persistCitations(admin, version.id, drafted);
  }

  await recordAudit({
    orgId: ctx.orgId,
    actorId: ctx.userId,
    action: 'contract.generate',
    targetType: 'contract',
    targetId: contract.id,
    promptHash,
    retrievalHash,
    outputHash,
    metadata: { documentType, jurisdiction, model: drafted.modelId, cited: drafted.citations.length },
  });

  revalidatePath('/dashboard/contracts');
  redirect(`/dashboard/contracts/${contract.id}`);
}

async function persistCitations(
  admin: ReturnType<typeof createAdminClient>,
  versionId: string,
  drafted: { bodyMd: string; citations: CitationRef[] },
) {
  const rows = drafted.citations.map((c, i) => ({
    contract_version_id: versionId,
    ordinal: i,
    clause_type: 'cited_law',
    heading: c.sourceTitle,
    body_md: c.snippet,
    jurisdiction: c.jurisdiction,
    language: 'en',
    confidence: 'high' as const,
    rationale: c.locator ? `Cited: ${c.locator}` : null,
  }));
  const { data: clauseRows, error } = await admin
    .from('clauses')
    .insert(rows)
    .select('id, ordinal');
  if (error || !clauseRows) return;

  const citationRows = drafted.citations
    .map((c, i) => {
      const clause = clauseRows.find((r) => r.ordinal === i);
      if (!clause) return null;
      return { clause_id: clause.id, source_id: null, chunk_id: c.chunkId, locator: c.locator, quote: c.snippet };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (citationRows.length > 0) {
    const chunkIds = citationRows.map((r) => r.chunk_id).filter((id): id is string => !!id);
    const { data: chunks } = await admin
      .from('legal_chunks')
      .select('id, source_id')
      .in('id', chunkIds);
    const sourceByChunk = new Map((chunks ?? []).map((c) => [c.id as string, c.source_id as string]));
    const finalRows = citationRows
      .map((r) => ({ ...r, source_id: r.chunk_id ? sourceByChunk.get(r.chunk_id) ?? null : null }))
      .filter((r) => r.source_id !== null);
    if (finalRows.length > 0) {
      await admin.from('clause_citations').insert(finalRows);
    }
  }
}
