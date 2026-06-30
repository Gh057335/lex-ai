// Anthropic SDK wrapper. Centralises model choice, prompt caching, and the
// formatting of retrieved legal chunks into the system prompt.

import Anthropic from '@anthropic-ai/sdk';
import type { RetrievedChunk } from '@/lib/search';

export const MODELS = {
  chat: 'claude-sonnet-4-6',
  draft: 'claude-opus-4-7',
} as const;

let _client: Anthropic | null = null;
export function anthropic(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set in .env.local');
  _client = new Anthropic({ apiKey });
  return _client;
}

export interface CitationRef {
  chunkId: string;
  sourceTitle: string;
  locator: string | null;
  jurisdiction: string;
  effectiveFrom: string | null;
  officialUrl: string | null;
  snippet: string;
}

export interface AssistantAnswer {
  answer: string;
  citations: CitationRef[];
}

const ASSISTANT_SYSTEM = `You are LEXAI, an AI legal assistant for emerging-markets corporate counsel.

You answer in plain English, grounded ONLY in the legal corpus passages provided below. Each passage is tagged like:
  [C1] DIFC Contract Law (DIFC Law No. 6 of 2004) — Art. 13 (effective 2004-09-13)
  <body of the passage>

Rules:
- Cite passages inline as [C1], [C2], etc. EVERY claim about black-letter law must carry a citation.
- If the answer is not in the corpus, say so explicitly: "Not in the available corpus." Do NOT invent statute numbers or article references.
- Be concise: 4–10 sentences for most questions. Use bullet lists when listing requirements.
- When the user asks to draft a clause or document, draft it directly and inline-cite the supporting passages.
- Always note the jurisdiction the answer applies to.`;

export async function askAssistant(question: string, chunks: RetrievedChunk[]): Promise<AssistantAnswer> {
  const indexed = chunks.map((c, i) => ({ tag: `C${i + 1}`, chunk: c }));
  const corpus = indexed
    .map(({ tag, chunk }) => formatChunkForPrompt(tag, chunk))
    .join('\n\n');

  const resp = await anthropic().messages.create({
    model: MODELS.chat,
    max_tokens: 1500,
    system: [
      { type: 'text', text: ASSISTANT_SYSTEM },
      // Cache the corpus block — same corpus across consecutive questions
      // means the second request only pays for the user delta.
      {
        type: 'text',
        text: `LEGAL CORPUS — passages available for citation:\n\n${corpus}`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: question }],
  });

  const answer = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  const citedTags = new Set<string>();
  for (const m of answer.matchAll(/\[C(\d+)\]/g)) citedTags.add(`C${m[1]}`);

  const citations: CitationRef[] = indexed
    .filter(({ tag }) => citedTags.has(tag))
    .map(({ chunk }) => ({
      chunkId: chunk.chunkId,
      sourceTitle: chunk.sourceTitle,
      locator: chunk.locator,
      jurisdiction: chunk.jurisdiction,
      effectiveFrom: chunk.effectiveFrom,
      officialUrl: chunk.officialUrl,
      snippet: chunk.body.slice(0, 280),
    }));

  return { answer, citations };
}

const DRAFT_SYSTEM = `You are LEXAI, drafting a binding legal document for emerging-markets corporate counsel.

The retrieved corpus below is your ONLY source of black-letter law. Draft the document in clean markdown with numbered clauses. Every substantive clause that reflects a statutory rule must end with a citation like [C3]. If the corpus is silent on a point, use a reasonable commercial default and mark the clause "[drafting note: not derived from corpus]" so the reviewer can verify.

Output structure:
  # <Document Title>
  **Parties.** ...
  **Recitals.** ...

  ## 1. <Clause heading>
  <clause body> [C1]

  ## 2. <Clause heading>
  ...

  Signature block at the end.

Do NOT invent statutes, articles or case names not present in the corpus.`;

export interface DraftedDocument {
  title: string;
  bodyMd: string;
  citations: CitationRef[];
  modelId: string;
}

export interface DraftBrief {
  documentType: string;
  jurisdiction: string;
  parties: string;
  context?: string;
}

export async function draftDocument(brief: DraftBrief, chunks: RetrievedChunk[]): Promise<DraftedDocument> {
  const indexed = chunks.map((c, i) => ({ tag: `C${i + 1}`, chunk: c }));
  const corpus = indexed
    .map(({ tag, chunk }) => formatChunkForPrompt(tag, chunk))
    .join('\n\n');

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
      {
        type: 'text',
        text: `LEGAL CORPUS — passages available for citation:\n\n${corpus}`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userMessage }],
  });

  const bodyMd = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  const citedTags = new Set<string>();
  for (const m of bodyMd.matchAll(/\[C(\d+)\]/g)) citedTags.add(`C${m[1]}`);
  const citations: CitationRef[] = indexed
    .filter(({ tag }) => citedTags.has(tag))
    .map(({ chunk }) => ({
      chunkId: chunk.chunkId,
      sourceTitle: chunk.sourceTitle,
      locator: chunk.locator,
      jurisdiction: chunk.jurisdiction,
      effectiveFrom: chunk.effectiveFrom,
      officialUrl: chunk.officialUrl,
      snippet: chunk.body.slice(0, 280),
    }));

  const titleMatch = bodyMd.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1].trim() ?? `${brief.documentType} — ${brief.jurisdiction}`;

  return { title, bodyMd, citations, modelId: MODELS.draft };
}

function formatChunkForPrompt(tag: string, c: RetrievedChunk): string {
  const head = [
    `[${tag}]`,
    c.sourceTitle,
    c.locator ? `— ${c.locator}` : '',
    c.effectiveFrom ? `(effective ${c.effectiveFrom})` : '',
  ]
    .filter(Boolean)
    .join(' ');
  return `${head}\n${c.body}`;
}
