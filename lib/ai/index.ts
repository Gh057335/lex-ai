// Public entry point for the AI layer.
//
// Components and server actions import from '@/lib/ai' only — never from a
// provider or the Anthropic SDK directly. The active provider (live Anthropic
// or demo mock) is selected at call time based on configuration.

import type { RetrievedChunk } from '@/lib/search';
import type { AssistantAnswer, DraftBrief, DraftedDocument, ReviewResult } from './types';
import { getProvider } from './provider';

export { MODELS } from './models';
export { formatChunkForPrompt } from './prompts';
export { anthropic } from './providers/anthropic';
export type {
  CitationRef, AssistantAnswer, DraftBrief, DraftedDocument,
  ReviewResult, ReviewedClause, ReviewedClauseCitation, RiskLevel, Confidence,
} from './types';

export function askAssistant(question: string, chunks: RetrievedChunk[]): Promise<AssistantAnswer> {
  return getProvider().askAssistant(question, chunks);
}

export function draftDocument(brief: DraftBrief, chunks: RetrievedChunk[]): Promise<DraftedDocument> {
  return getProvider().draftDocument(brief, chunks);
}

export function reviewDocument(documentText: string, chunks: RetrievedChunk[]): Promise<ReviewResult> {
  return getProvider().reviewDocument(documentText, chunks);
}

export function generateDigestSummary(jurisdictions: string[], eventBlock: string): Promise<string> {
  return getProvider().generateDigestSummary(jurisdictions, eventBlock);
}
