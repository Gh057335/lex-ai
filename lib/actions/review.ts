'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireMembership } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { extractPdfText } from '@/lib/pdf';
import { reviewDocument } from '@/lib/review';
import { searchLaws, browseLaws, getWorkspaceJurisdictions } from '@/lib/search';
import { recordAudit, hashContent } from '@/lib/audit';
import { ensureAutoMatter } from '@/lib/db/matters';

export async function reviewUploadedDocumentAction(formData: FormData): Promise<void> {
  const ctx = await requireMembership();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('No file uploaded');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('PDF too large (max 10 MB for demo)');
  }

  const buffer = await file.arrayBuffer();
  const { text, totalPages } = await extractPdfText(buffer);

  if (text.trim().length < 200) {
    throw new Error('Could not extract text from this PDF — is it scanned?');
  }

  const jurisdictions = await getWorkspaceJurisdictions(ctx.orgId);

  const retrievalQuery = text.slice(0, 1500);
  let chunks = await searchLaws(retrievalQuery, { jurisdictions, limit: 25 });
  if (chunks.length < 5) {
    chunks = await browseLaws({ jurisdictions, limit: 30 });
  }

  const review = await reviewDocument(text, chunks);

  const admin = createAdminClient();
  const matterId = await ensureAutoMatter(ctx.orgId, 'AI-reviewed documents');

  const { data: contract, error: contractErr } = await admin
    .from('contracts')
    .insert({
      matter_id: matterId,
      title: review.documentTitle,
      language: 'en',
      jurisdictions: jurisdictions,
      contract_type: review.documentType,
      source_file_path: file.name,
      status: 'review',
      created_by: ctx.userId,
    })
    .select('id')
    .single();
  if (contractErr || !contract) throw contractErr ?? new Error('contract insert failed');

  const promptHash = hashContent(text);
  const retrievalHash = hashContent(chunks.map((c) => c.chunkId).join(','));
  const outputHash = hashContent(JSON.stringify(review.clauses));

  const { data: version, error: versionErr } = await admin
    .from('contract_versions')
    .insert({
      contract_id: contract.id,
      version_no: 1,
      body_md: text,
      generated_by: 'review_merge',
      prompt_hash: promptHash,
      retrieval_hash: retrievalHash,
      model_id: review.modelId,
      created_by: ctx.userId,
    })
    .select('id')
    .single();
  if (versionErr || !version) throw versionErr ?? new Error('contract_version insert failed');

  await admin.from('contracts').update({ current_version_id: version.id }).eq('id', contract.id);

  const clauseRows = review.clauses.map((c) => ({
    contract_version_id: version.id,
    ordinal: c.ordinal,
    clause_type: c.clauseType,
    heading: c.heading,
    body_md: c.body,
    jurisdiction: jurisdictions[0] ?? null,
    language: 'en',
    risk_level: c.riskLevel,
    confidence: c.confidence,
    rationale: formatRationale(c.issue, c.suggestedRedline),
  }));

  if (clauseRows.length > 0) {
    const { data: inserted, error: clauseErr } = await admin
      .from('clauses')
      .insert(clauseRows)
      .select('id, ordinal');
    if (clauseErr) throw clauseErr;

    const clauseIdByOrdinal = new Map((inserted ?? []).map((r) => [r.ordinal as number, r.id as string]));
    const citationRows: Array<{
      clause_id: string;
      source_id: string;
      chunk_id: string;
      locator: string | null;
      quote: string;
    }> = [];

    const chunkIds = Array.from(new Set(
      review.clauses.flatMap((c) => c.citations.map((cit) => cit.chunkId)),
    ));
    if (chunkIds.length > 0) {
      const { data: chunkRows } = await admin
        .from('legal_chunks')
        .select('id, source_id, locator, body')
        .in('id', chunkIds);
      const byChunk = new Map((chunkRows ?? []).map((r) => [r.id as string, r]));

      for (const c of review.clauses) {
        const clauseId = clauseIdByOrdinal.get(c.ordinal);
        if (!clauseId) continue;
        for (const cit of c.citations) {
          const chunk = byChunk.get(cit.chunkId);
          if (!chunk) continue;
          citationRows.push({
            clause_id: clauseId,
            source_id: chunk.source_id as string,
            chunk_id: chunk.id as string,
            locator: (chunk.locator as string | null) ?? null,
            quote: (chunk.body as string).slice(0, 400),
          });
        }
      }

      if (citationRows.length > 0) {
        await admin.from('clause_citations').insert(citationRows);
      }
    }
  }

  await recordAudit({
    orgId: ctx.orgId,
    actorId: ctx.userId,
    action: 'contract.review',
    targetType: 'contract',
    targetId: contract.id,
    promptHash,
    retrievalHash,
    outputHash,
    metadata: {
      filename: file.name,
      pages: totalPages,
      clauses: review.clauses.length,
      blocking: review.clauses.filter((c) => c.riskLevel === 'blocking').length,
      high: review.clauses.filter((c) => c.riskLevel === 'high').length,
    },
  });

  revalidatePath('/dashboard/contracts');
  redirect(`/dashboard/contracts/${contract.id}?review=1`);
}

function formatRationale(issue: string | null, redline: string | null): string | null {
  if (!issue && !redline) return null;
  const parts: string[] = [];
  if (issue) parts.push(`**Issue.** ${issue}`);
  if (redline) parts.push(`**Suggested redline.**\n${redline}`);
  return parts.join('\n\n');
}
