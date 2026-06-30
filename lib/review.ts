// Document review: send an uploaded contract + corpus to Claude and return
// a structured clause-by-clause review with risk levels, rationales, and
// suggested redlines, anchored to corpus citations.
//
// Uses Anthropic tool_use to force a JSON output that matches our schema.

import Anthropic from '@anthropic-ai/sdk';
import { anthropic, MODELS } from '@/lib/ai';
import type { RetrievedChunk } from '@/lib/search';

export type RiskLevel = 'ok' | 'attention' | 'high' | 'blocking';
export type Confidence = 'high' | 'medium' | 'low';

export interface ReviewedClauseCitation {
  citationTag: string;        // "C3" — references the corpus tag passed in
  chunkId: string;            // resolved server-side from tag
}

export interface ReviewedClause {
  ordinal: number;
  clauseType: string;
  heading: string;
  body: string;
  riskLevel: RiskLevel;
  confidence: Confidence;
  issue: string | null;            // what's wrong (null if ok)
  suggestedRedline: string | null; // proposed replacement text
  citations: ReviewedClauseCitation[];
}

export interface ReviewResult {
  documentTitle: string;
  documentType: string;
  overallSummary: string;
  topRisks: string[];
  clauses: ReviewedClause[];
  modelId: string;
}

const REVIEW_SYSTEM = `You are LEXAI, reviewing a draft contract on behalf of an in-house counsel in an emerging-markets jurisdiction.

Your job is to:
1. Segment the document into atomic clauses (definitions, governing law, term, confidentiality, indemnity, IP, termination, dispute resolution, etc.).
2. For each clause, judge it against the LEGAL CORPUS provided.
3. Produce a structured review with risk level, rationale, and (when applicable) a redline.

Risk levels:
- "ok": clause is sound, consistent with corpus, no action needed.
- "attention": minor improvement (clarity, drafting tightness), not a legal risk.
- "high": material legal gap or weakness vs the corpus or market standard.
- "blocking": unenforceable, conflicts with mandatory statute, or exposes the client to liability the corpus disallows.

Citations: when a finding rests on a corpus passage, include the corpus tag(s) (e.g. "C3") in the citations array. Do NOT invent statute references not present in the corpus.

Be terse and specific. A counsel reads this in 60 seconds.

Always call the submit_review tool exactly once.`;

const REVIEW_TOOL: Anthropic.Tool = {
  name: 'submit_review',
  description: 'Submit the structured clause-by-clause review of the contract.',
  input_schema: {
    type: 'object',
    required: ['document_title', 'document_type', 'overall_summary', 'top_risks', 'clauses'],
    properties: {
      document_title: { type: 'string', description: 'Short title for the document (e.g. "Mutual NDA — Acme/Beta").' },
      document_type: { type: 'string', description: 'Best-guess type: NDA, Employment, Services, DPA, SHA, etc.' },
      overall_summary: { type: 'string', description: '2-3 sentences summarising the document and its overall quality.' },
      top_risks: {
        type: 'array',
        items: { type: 'string' },
        description: 'Up to 5 short bullets — the most material issues a counsel must address.',
      },
      clauses: {
        type: 'array',
        items: {
          type: 'object',
          required: ['ordinal', 'clause_type', 'heading', 'body', 'risk_level', 'confidence', 'citations'],
          properties: {
            ordinal: { type: 'integer', minimum: 0 },
            clause_type: { type: 'string', description: 'e.g. "governing_law", "confidentiality", "indemnity"' },
            heading: { type: 'string', description: 'Short human heading for the clause.' },
            body: { type: 'string', description: 'The clause text as extracted (may be lightly cleaned).' },
            risk_level: { type: 'string', enum: ['ok', 'attention', 'high', 'blocking'] },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
            issue: { type: ['string', 'null'], description: 'Null if risk_level is "ok". Otherwise 1-2 sentences on what is wrong.' },
            suggested_redline: { type: ['string', 'null'], description: 'Null if risk_level is "ok". Otherwise the proposed replacement clause text.' },
            citations: {
              type: 'array',
              items: { type: 'string', pattern: '^C\\d+$' },
              description: 'Corpus tags this finding rests on, e.g. ["C3", "C7"]. Empty array if no corpus passage applies.',
            },
          },
        },
      },
    },
  } as unknown as Anthropic.Tool['input_schema'],
};

export async function reviewDocument(
  documentText: string,
  chunks: RetrievedChunk[],
): Promise<ReviewResult> {
  const indexed = chunks.map((c, i) => ({ tag: `C${i + 1}`, chunk: c }));
  const corpus = indexed
    .map(({ tag, chunk }) => {
      const head = [
        `[${tag}]`,
        chunk.sourceTitle,
        chunk.locator ? `— ${chunk.locator}` : '',
        chunk.effectiveFrom ? `(effective ${chunk.effectiveFrom})` : '',
      ].filter(Boolean).join(' ');
      return `${head}\n${chunk.body}`;
    })
    .join('\n\n');

  const truncated = documentText.length > 60_000
    ? documentText.slice(0, 60_000) + '\n[…document truncated for length…]'
    : documentText;

  const resp = await anthropic().messages.create({
    model: MODELS.chat,
    max_tokens: 8000,
    tools: [REVIEW_TOOL],
    tool_choice: { type: 'tool', name: 'submit_review' },
    system: [
      { type: 'text', text: REVIEW_SYSTEM },
      {
        type: 'text',
        text: `LEGAL CORPUS — passages available for citation:\n\n${corpus}`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `DOCUMENT TO REVIEW (full text):\n\n${truncated}\n\nReview this document now using the submit_review tool.`,
      },
    ],
  });

  const toolBlock = resp.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'submit_review',
  );
  if (!toolBlock) throw new Error('Claude did not return a submit_review tool call');

  const raw = toolBlock.input as RawReviewInput;
  const tagToChunkId = new Map(indexed.map(({ tag, chunk }) => [tag, chunk.chunkId]));

  const clauses: ReviewedClause[] = (raw.clauses ?? []).map((c) => ({
    ordinal: c.ordinal,
    clauseType: c.clause_type,
    heading: c.heading,
    body: c.body,
    riskLevel: c.risk_level,
    confidence: c.confidence,
    issue: c.issue ?? null,
    suggestedRedline: c.suggested_redline ?? null,
    citations: (c.citations ?? [])
      .map((tag) => ({ citationTag: tag, chunkId: tagToChunkId.get(tag) }))
      .filter((c): c is ReviewedClauseCitation => !!c.chunkId),
  }));

  return {
    documentTitle: raw.document_title,
    documentType: raw.document_type,
    overallSummary: raw.overall_summary,
    topRisks: raw.top_risks ?? [],
    clauses,
    modelId: MODELS.chat,
  };
}

interface RawReviewInput {
  document_title: string;
  document_type: string;
  overall_summary: string;
  top_risks: string[];
  clauses: Array<{
    ordinal: number;
    clause_type: string;
    heading: string;
    body: string;
    risk_level: RiskLevel;
    confidence: Confidence;
    issue: string | null;
    suggested_redline: string | null;
    citations: string[];
  }>;
}
