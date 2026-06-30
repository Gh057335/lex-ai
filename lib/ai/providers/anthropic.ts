// Anthropic (Claude) provider — the live implementation of AIProvider.
// This is the ONLY module that imports the Anthropic SDK.

import Anthropic from '@anthropic-ai/sdk';
import { getEnv } from '@/config/env';
import type { RetrievedChunk } from '@/lib/search';
import type { AIProvider } from '../provider';
import type {
  AssistantAnswer, CitationRef, DraftBrief, DraftedDocument,
  ReviewResult, ReviewedClause, ReviewedClauseCitation, RiskLevel, Confidence,
} from '../types';
import { MODELS } from '../models';
import {
  ASSISTANT_SYSTEM, DRAFT_SYSTEM, DIGEST_SYSTEM, REVIEW_SYSTEM, REVIEW_TOOL,
  formatChunkForPrompt,
} from '../prompts';

let _client: Anthropic | null = null;
export function anthropic(): Anthropic {
  if (_client) return _client;
  const apiKey = getEnv().ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set — cannot use the live Anthropic provider');
  _client = new Anthropic({ apiKey });
  return _client;
}

function citationsFromCited(
  indexed: Array<{ tag: string; chunk: RetrievedChunk }>,
  text: string,
): CitationRef[] {
  const cited = new Set<string>();
  for (const m of text.matchAll(/\[C(\d+)\]/g)) cited.add(`C${m[1]}`);
  return indexed
    .filter(({ tag }) => cited.has(tag))
    .map(({ chunk }) => ({
      chunkId: chunk.chunkId,
      sourceTitle: chunk.sourceTitle,
      locator: chunk.locator,
      jurisdiction: chunk.jurisdiction,
      effectiveFrom: chunk.effectiveFrom,
      officialUrl: chunk.officialUrl,
      snippet: chunk.body.slice(0, 280),
    }));
}

async function askAssistant(question: string, chunks: RetrievedChunk[]): Promise<AssistantAnswer> {
  const indexed = chunks.map((c, i) => ({ tag: `C${i + 1}`, chunk: c }));
  const corpus = indexed.map(({ tag, chunk }) => formatChunkForPrompt(tag, chunk)).join('\n\n');

  const resp = await anthropic().messages.create({
    model: MODELS.chat,
    max_tokens: 1500,
    system: [
      { type: 'text', text: ASSISTANT_SYSTEM },
      { type: 'text', text: `LEGAL CORPUS — passages available for citation:\n\n${corpus}`, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: question }],
  });

  const answer = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  return { answer, citations: citationsFromCited(indexed, answer) };
}

async function draftDocument(brief: DraftBrief, chunks: RetrievedChunk[]): Promise<DraftedDocument> {
  const indexed = chunks.map((c, i) => ({ tag: `C${i + 1}`, chunk: c }));
  const corpus = indexed.map(({ tag, chunk }) => formatChunkForPrompt(tag, chunk)).join('\n\n');

  const userMessage = [
    `Draft a ${brief.documentType} under ${brief.jurisdiction}.`,
    `Parties: ${brief.parties}.`,
    brief.context ? `Additional context: ${brief.context}` : null,
    '',
    `Return only the document body in markdown. Do not include any preamble or post-script outside the document.`,
  ]
    .filter(Boolean)
    .join('\n');

  const resp = await anthropic().messages.create({
    model: MODELS.draft,
    max_tokens: 4000,
    system: [
      { type: 'text', text: DRAFT_SYSTEM },
      { type: 'text', text: `LEGAL CORPUS — passages available for citation:\n\n${corpus}`, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: userMessage }],
  });

  const bodyMd = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  const titleMatch = bodyMd.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1].trim() ?? `${brief.documentType} — ${brief.jurisdiction}`;

  return { title, bodyMd, citations: citationsFromCited(indexed, bodyMd), modelId: MODELS.draft };
}

interface RawReviewInput {
  document_title: string;
  document_type: string;
  overall_summary: string;
  top_risks: string[];
  clauses: Array<{
    ordinal: number; clause_type: string; heading: string; body: string;
    risk_level: RiskLevel; confidence: Confidence;
    issue: string | null; suggested_redline: string | null; citations: string[];
  }>;
}

async function reviewDocument(documentText: string, chunks: RetrievedChunk[]): Promise<ReviewResult> {
  const indexed = chunks.map((c, i) => ({ tag: `C${i + 1}`, chunk: c }));
  const corpus = indexed.map(({ tag, chunk }) => formatChunkForPrompt(tag, chunk)).join('\n\n');

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
      { type: 'text', text: `LEGAL CORPUS — passages available for citation:\n\n${corpus}`, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: `DOCUMENT TO REVIEW (full text):\n\n${truncated}\n\nReview this document now using the submit_review tool.` }],
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
      .filter((x): x is ReviewedClauseCitation => !!x.chunkId),
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

async function generateDigestSummary(jurisdictions: string[], eventBlock: string): Promise<string> {
  const resp = await anthropic().messages.create({
    model: MODELS.chat,
    max_tokens: 700,
    system: [{ type: 'text', text: DIGEST_SYSTEM }],
    messages: [
      {
        role: 'user',
        content: `Workspace jurisdictions: ${jurisdictions.join(', ')}.\n\nRecent events (most recent first):\n\n${eventBlock}\n\nWrite the briefing now.`,
      },
    ],
  });

  return resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

export const anthropicProvider: AIProvider = {
  askAssistant,
  draftDocument,
  reviewDocument,
  generateDigestSummary,
};
