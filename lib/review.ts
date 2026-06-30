// Backward-compatible facade. The document-review implementation now lives in
// the provider-abstracted AI layer (`lib/ai`). Kept so existing imports of
// `@/lib/review` continue to resolve.

export { reviewDocument } from '@/lib/ai';
export type {
  RiskLevel, Confidence, ReviewedClause, ReviewedClauseCitation, ReviewResult,
} from '@/lib/ai';
