// Mock AI provider — the demo implementation of AIProvider.
//
// Returns deterministic output that is grounded in the actual retrieved corpus
// chunks (real citations, real source titles), so the demo is representative of
// the live product lifecycle without any network call or API key. No randomness,
// so the same input always yields the same output.

import type { RetrievedChunk } from '@/lib/search';
import type { AIProvider } from '../provider';
import type {
  AssistantAnswer, CitationRef, DraftBrief, DraftedDocument,
  ReviewResult, ReviewedClause, RiskLevel, Confidence,
} from '../types';
import { MODELS } from '../models';

const DEMO_NOTE = '_Demo mode — representative output generated without a live model; connect an `ANTHROPIC_API_KEY` for real analysis._';

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const dot = trimmed.indexOf('. ');
  return dot === -1 ? trimmed : trimmed.slice(0, dot + 1);
}

function toCitation(chunk: RetrievedChunk): CitationRef {
  return {
    chunkId: chunk.chunkId,
    sourceTitle: chunk.sourceTitle,
    locator: chunk.locator,
    jurisdiction: chunk.jurisdiction,
    effectiveFrom: chunk.effectiveFrom,
    officialUrl: chunk.officialUrl,
    snippet: chunk.body.slice(0, 280),
  };
}

async function askAssistant(question: string, chunks: RetrievedChunk[]): Promise<AssistantAnswer> {
  if (chunks.length === 0) {
    return { answer: 'Not in the available corpus.', citations: [] };
  }
  const picks = chunks.slice(0, 3).map((chunk, i) => ({ tag: `C${i + 1}`, chunk }));
  const jurisdiction = picks[0].chunk.jurisdiction;

  const synthesis = picks
    .map(({ tag, chunk }) => `${firstSentence(chunk.body)} [${tag}]`)
    .join(' ');

  const answer = [
    `Under **${jurisdiction}**, the corpus addresses your question as follows: ${synthesis}`,
    '',
    `In short, the cited primary sources above govern this point for ${jurisdiction}. Always confirm against the current consolidated text before relying on it.`,
    '',
    DEMO_NOTE,
  ].join('\n');

  return { answer, citations: picks.map(({ chunk }) => toCitation(chunk)) };
}

async function draftDocument(brief: DraftBrief, chunks: RetrievedChunk[]): Promise<DraftedDocument> {
  const picks = chunks.slice(0, 3).map((chunk, i) => ({ tag: `C${i + 1}`, chunk }));
  const title = `${brief.documentType} — ${brief.jurisdiction}`;

  const clauseBlocks = picks.map(({ tag, chunk }, i) => {
    const heading = chunk.locator ? `${chunk.sourceTitle} (${chunk.locator})` : chunk.sourceTitle;
    return `## ${i + 1}. ${heading}\n${firstSentence(chunk.body)} [${tag}]`;
  });

  const bodyMd = [
    `# ${title}`,
    '',
    `**Parties.** ${brief.parties}.`,
    `**Recitals.** This ${brief.documentType} is entered into under the laws of ${brief.jurisdiction}${brief.context ? `, in the context of ${brief.context}` : ''}.`,
    '',
    ...clauseBlocks,
    '',
    `## ${clauseBlocks.length + 1}. Governing Law`,
    `This agreement is governed by, and construed in accordance with, the laws of ${brief.jurisdiction}.`,
    '',
    '**Signed** for and on behalf of the parties.',
    '',
    DEMO_NOTE,
  ].join('\n');

  return { title, bodyMd, citations: picks.map(({ chunk }) => toCitation(chunk)), modelId: MODELS.draft };
}

async function reviewDocument(documentText: string, chunks: RetrievedChunk[]): Promise<ReviewResult> {
  const firstLine = documentText.split('\n').map((l) => l.trim()).find(Boolean) ?? 'Uploaded contract';
  const documentTitle = firstLine.slice(0, 80);

  // A representative spread of risk levels anchored to whatever corpus came back.
  const templates: Array<{
    clauseType: string; heading: string; riskLevel: RiskLevel; confidence: Confidence;
    issue: string | null; suggestedRedline: string | null; useChunk: number | null;
  }> = [
    { clauseType: 'governing_law', heading: 'Governing Law & Jurisdiction', riskLevel: 'ok', confidence: 'high', issue: null, suggestedRedline: null, useChunk: 0 },
    { clauseType: 'confidentiality', heading: 'Confidentiality', riskLevel: 'attention', confidence: 'high',
      issue: 'The confidentiality definition lacks standard carve-outs (public domain, independently developed, required by law).',
      suggestedRedline: 'Add carve-outs so that Confidential Information excludes information that is or becomes public other than by breach, or is independently developed.', useChunk: 1 },
    { clauseType: 'indemnity', heading: 'Indemnification & Liability', riskLevel: 'high', confidence: 'medium',
      issue: 'The indemnity is uncapped and does not exclude indirect or consequential loss, exposing the client to disproportionate liability.',
      suggestedRedline: 'Cap aggregate liability and exclude indirect, consequential and punitive damages, consistent with the cited remedies regime.', useChunk: 2 },
    { clauseType: 'data_protection', heading: 'Data Protection', riskLevel: 'blocking', confidence: 'high',
      issue: 'Unrestricted processing of personal data conflicts with the applicable data-protection regime, which requires a lawful basis and transfer safeguards. As drafted the clause is unenforceable.',
      suggestedRedline: 'Restrict processing to the agreement’s purpose, require a lawful basis, and add standard contractual clauses for cross-border transfers.', useChunk: 3 },
  ];

  const clauses: ReviewedClause[] = templates.map((t, ordinal) => {
    const chunk = t.useChunk != null ? chunks[t.useChunk] : undefined;
    return {
      ordinal,
      clauseType: t.clauseType,
      heading: t.heading,
      body: chunk ? firstSentence(chunk.body) : `${t.heading} clause as extracted from the document.`,
      riskLevel: t.riskLevel,
      confidence: t.confidence,
      issue: t.issue,
      suggestedRedline: t.suggestedRedline,
      citations: chunk ? [{ citationTag: `C${(t.useChunk ?? 0) + 1}`, chunkId: chunk.chunkId }] : [],
    };
  });

  return {
    documentTitle,
    documentType: 'Reviewed contract',
    overallSummary: `The document is broadly serviceable but carries one blocking data-protection issue and one high-risk liability gap that must be resolved before signature. ${DEMO_NOTE}`,
    topRisks: [
      'Blocking: data-protection clause is unenforceable as drafted.',
      'High: uncapped indemnity with no exclusion of consequential loss.',
      'Attention: confidentiality definition missing standard carve-outs.',
    ],
    clauses,
    modelId: MODELS.chat,
  };
}

async function generateDigestSummary(jurisdictions: string[], eventBlock: string): Promise<string> {
  // Pull a real source title out of the formatted event block for specificity.
  const titleMatch = eventBlock.match(/\]\s(.+?)\s—/);
  const lead = titleMatch?.[1] ?? 'the most recent regulatory update';

  return [
    `**What changed (last 60 days)**: The most urgent item is ${lead}, which tightens compliance obligations in ${jurisdictions.join(', ')}. Several data-protection updates affect breach-notification timelines and cross-border transfer conditions, and there are employment-law changes to end-of-service calculations. Group remediation by theme rather than by jurisdiction to avoid duplicated effort.`,
    '',
    '**Action this week**: Review your breach runbook and standard contractual clauses against the amended requirements, and confirm any cross-border data flows remain compliant.',
    '',
    DEMO_NOTE,
  ].join('\n');
}

export const mockProvider: AIProvider = {
  askAssistant,
  draftDocument,
  reviewDocument,
  generateDigestSummary,
};
