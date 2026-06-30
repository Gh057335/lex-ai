// Provider abstraction. The rest of the codebase depends only on this
// interface, never on a concrete SDK. Swapping or adding a provider (OpenAI,
// Bedrock, a local model) means implementing AIProvider — nothing else changes.

import type { RetrievedChunk } from '@/lib/search';
import type { AssistantAnswer, DraftBrief, DraftedDocument, ReviewResult } from './types';
import { hasAnthropic } from '@/config/env';
import { anthropicProvider } from './providers/anthropic';
import { mockProvider } from './providers/mock';

export interface AIProvider {
  askAssistant(question: string, chunks: RetrievedChunk[]): Promise<AssistantAnswer>;
  draftDocument(brief: DraftBrief, chunks: RetrievedChunk[]): Promise<DraftedDocument>;
  reviewDocument(documentText: string, chunks: RetrievedChunk[]): Promise<ReviewResult>;
  generateDigestSummary(jurisdictions: string[], eventBlock: string): Promise<string>;
}

// Live AI when an Anthropic key is configured; otherwise the deterministic
// mock provider that returns representative, corpus-grounded demo output.
export function getProvider(): AIProvider {
  return hasAnthropic() ? anthropicProvider : mockProvider;
}
