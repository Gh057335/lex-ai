// Shared AI domain types. Single source of truth for the AI layer's public
// shapes — consumed by both providers (anthropic, mock) and the action layer.

import type { RiskLevel, Confidence } from '@/types/database';

export type { RiskLevel, Confidence };

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

export interface DraftBrief {
  documentType: string;
  jurisdiction: string;
  parties: string;
  context?: string;
}

export interface DraftedDocument {
  title: string;
  bodyMd: string;
  citations: CitationRef[];
  modelId: string;
}

export interface ReviewedClauseCitation {
  citationTag: string; // "C3" — references the corpus tag passed in
  chunkId: string;     // resolved server-side from tag
}

export interface ReviewedClause {
  ordinal: number;
  clauseType: string;
  heading: string;
  body: string;
  riskLevel: RiskLevel;
  confidence: Confidence;
  issue: string | null;
  suggestedRedline: string | null;
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
