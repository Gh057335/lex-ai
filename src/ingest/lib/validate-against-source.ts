import Anthropic from "@anthropic-ai/sdk";
import type { Card } from "./parse-cards";
import type { Chunk } from "./chunker";

/**
 * Source-grounded card validation.
 *
 * Given the structured card metadata + a card's prose claims + chunks of the actual
 * statutory source text, ask Claude to:
 *  1. Enumerate every factual claim in the card (article numbers, dates, status, scope statements)
 *  2. For each claim, look in the source and decide: confirmed | contradicted | absent
 *  3. Where contradicted, propose a replacement quoting the source verbatim
 *
 * Output is structured JSON; downstream patcher can apply approved corrections.
 */

export type ClaimVerdict = "confirmed" | "contradicted" | "absent";

export type Claim = {
  claim: string;              // verbatim or near-verbatim from the card
  type: "article_number" | "effective_date" | "status" | "scope" | "publisher" | "other";
  verdict: ClaimVerdict;
  source_evidence: string | null;  // quote from source supporting verdict (or null if absent)
  source_locator: string | null;   // e.g. "Article 5", "Chapter II"
  suggested_replacement: string | null;  // if contradicted, propose a fix that matches source
  confidence: "high" | "medium" | "low";
};

export type SourceValidation = {
  citation_key: string;
  source_url: string;
  source_chunks_consumed: number;
  source_chars_consumed: number;
  overall_verdict: "verified" | "partial" | "mismatch" | "inconclusive";
  claims: Claim[];
  notes: string[];
  raw_response: string;
};

const SYSTEM_PROMPT = `You are a senior legal-source validator. You read primary statute text and verify whether a knowledge-base entry's specific factual claims are accurate, contradicted, or unmentioned by the source.

You are STRICT. You never hallucinate. If the source does not address a claim, mark it "absent" — do NOT mark "confirmed" without verbatim or near-verbatim textual support.

For each claim you identify in the card, decide:
- "confirmed": the source text clearly supports the claim (quote required in source_evidence)
- "contradicted": the source text disagrees with the claim (quote required + suggested_replacement that matches the source)
- "absent": the source does not address this claim within the chunks provided

Identifiable claim types:
- article_number: "Art. 10", "Section 32", "Chapter III", "Part 6", "Book II"
- effective_date: dates of enactment, entry into force, amendments
- status: in_force, amended, superseded, repealed
- scope: substantive content claims ("covers VA service providers", "applies to processing of personal data")
- publisher: the issuing authority name
- other: anything else worth checking

Be conservative on confidence. "high" requires verbatim textual support. "medium" for paraphrased but clearly supported. "low" for partial / contextual support.

Overall verdict:
- "verified": all article_number + effective_date claims are confirmed; no contradictions
- "partial": some claims absent, but no contradictions; key parts supported
- "mismatch": one or more claims contradicted by source
- "inconclusive": source text too sparse / wrong portion / language barrier — cannot judge

Output strict JSON matching the schema in the user message. No prose, no markdown fences.`;

const SCHEMA = `{
  "overall_verdict": "verified" | "partial" | "mismatch" | "inconclusive",
  "claims": [
    {
      "claim": "verbatim or near-verbatim from the card prose",
      "type": "article_number" | "effective_date" | "status" | "scope" | "publisher" | "other",
      "verdict": "confirmed" | "contradicted" | "absent",
      "source_evidence": "verbatim quote from source, or null",
      "source_locator": "e.g. Article 5 / Chapter II, or null",
      "suggested_replacement": "if contradicted, a replacement that matches source; else null",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "notes": [ "anything else for human reviewer" ]
}`;

const MAX_SOURCE_CHARS = 110_000; // per-batch budget (~28k tokens)
const MAX_BATCHES = 6;             // cap calls per card

/**
 * Source-grounded validation that handles long statutes by splitting chunks
 * into multiple sequential validator calls and merging results per-claim.
 *
 * Strategy:
 *  - If total source chars fit in MAX_SOURCE_CHARS → single call (legacy path).
 *  - Else → split into N batches (≤ MAX_BATCHES); each batch runs a standalone
 *    validate call against the same card + a slice of chunks; results are
 *    merged claim-by-claim (precedence: contradicted > confirmed > absent).
 */
export async function validateCardAgainstSource(
  client: Anthropic,
  model: string,
  card: Card,
  chunks: Chunk[],
): Promise<SourceValidation> {
  const totalChars = chunks.reduce((a, c) => a + c.body.length, 0);
  const batches = totalChars <= MAX_SOURCE_CHARS ? [chunks] : sliceIntoBatches(chunks, MAX_SOURCE_CHARS, MAX_BATCHES);

  if (batches.length === 1) {
    return await runSingleBatch(client, model, card, batches[0], chunks.length, 1, 1);
  }

  const partials: SourceValidation[] = [];
  for (let i = 0; i < batches.length; i++) {
    const part = await runSingleBatch(client, model, card, batches[i], chunks.length, i + 1, batches.length);
    partials.push(part);
  }
  return mergePartialValidations(card, partials, chunks.length);
}

function sliceIntoBatches(chunks: Chunk[], budgetChars: number, maxBatches: number): Chunk[][] {
  const batches: Chunk[][] = [];
  let cur: Chunk[] = [];
  let curChars = 0;
  for (const c of chunks) {
    if (curChars + c.body.length > budgetChars && cur.length > 0) {
      batches.push(cur);
      cur = [];
      curChars = 0;
      if (batches.length >= maxBatches) break;
    }
    cur.push(c);
    curChars += c.body.length;
  }
  if (cur.length > 0 && batches.length < maxBatches) batches.push(cur);
  return batches;
}

async function runSingleBatch(
  client: Anthropic,
  model: string,
  card: Card,
  chunks: Chunk[],
  totalChunksInDoc: number,
  batchIndex: number,
  batchCount: number,
): Promise<SourceValidation> {
  let charsUsed = 0;
  const parts: string[] = [];
  for (const c of chunks) {
    const headingPath = c.heading_path.join(" > ");
    const block = `\n\n[#${c.ordinal} | ${headingPath}]\n${c.body}`;
    if (charsUsed + block.length > MAX_SOURCE_CHARS) break;
    parts.push(block);
    charsUsed += block.length;
  }
  const sourceText = parts.join("");

  const cardSnapshot = {
    citation_key: card.citation_key,
    declared_title: card.title,
    declared: {
      type: card.type,
      jurisdiction: card.jurisdiction,
      effective_from: card.effective_from,
      effective_to: card.effective_to,
      publisher: card.publisher,
      language: card.language,
      key_parts: card.key_parts,
      notes: card.notes,
    },
    card_body_md: card.raw,
  };

  const batchHint =
    batchCount > 1
      ? `\nNOTE: This is batch ${batchIndex} of ${batchCount}. The source you see is a SLICE of the full statute. Mark a claim "absent" only if you cannot find it in THIS slice — it may be confirmed by another batch. Be conservative: do not mark "contradicted" unless the slice clearly disagrees.`
      : "";

  const userMessage = [
    "Validate the knowledge-base CARD against the SOURCE text.",
    "",
    "Output JSON exactly matching this schema:",
    SCHEMA,
    batchHint,
    "",
    "CARD:",
    JSON.stringify(cardSnapshot),
    "",
    `SOURCE (chunks ${chunks[0]?.ordinal ?? "?"}–${chunks[chunks.length - 1]?.ordinal ?? "?"} of ${totalChunksInDoc}, ${charsUsed} chars):`,
    sourceText || "[empty source]",
  ].join("\n");

  const response = await client.messages.create({
    model,
    max_tokens: 4000,
    system: [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return parseValidation(card, text, chunks.length, charsUsed);
}

function mergePartialValidations(
  card: Card,
  partials: SourceValidation[],
  totalChunks: number,
): SourceValidation {
  // Group claims by normalised claim text.
  const groups = new Map<string, Claim[]>();
  for (const p of partials) {
    for (const c of p.claims) {
      const key = normaliseClaim(c.claim);
      const list = groups.get(key) ?? [];
      list.push(c);
      groups.set(key, list);
    }
  }

  const merged: Claim[] = [];
  for (const [, list] of groups) {
    merged.push(reduceClaimGroup(list));
  }

  // Compute overall verdict from merged.
  const hasContradiction = merged.some((c) => c.verdict === "contradicted");
  const allCounts = {
    confirmed: merged.filter((c) => c.verdict === "confirmed").length,
    contradicted: merged.filter((c) => c.verdict === "contradicted").length,
    absent: merged.filter((c) => c.verdict === "absent").length,
  };
  let overall: SourceValidation["overall_verdict"];
  if (hasContradiction) overall = "mismatch";
  else if (allCounts.confirmed > 0 && allCounts.absent === 0) overall = "verified";
  else if (allCounts.confirmed > 0) overall = "partial";
  else overall = "inconclusive";

  const charsConsumed = partials.reduce((a, p) => a + p.source_chars_consumed, 0);
  const chunksConsumed = partials.reduce((a, p) => a + p.source_chunks_consumed, 0);

  return {
    citation_key: card.citation_key,
    source_url: card.official_url ?? "",
    source_chunks_consumed: chunksConsumed,
    source_chars_consumed: charsConsumed,
    overall_verdict: overall,
    claims: merged,
    notes: [
      `merged from ${partials.length} batch validations (${chunksConsumed}/${totalChunks} chunks, ${charsConsumed} chars total)`,
      ...partials.flatMap((p, i) => p.notes.map((n) => `[batch ${i + 1}] ${n}`)),
    ],
    raw_response: partials.map((p, i) => `=== batch ${i + 1} ===\n${p.raw_response}`).join("\n\n"),
  };
}

function normaliseClaim(claim: string): string {
  return claim
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 120);
}

function reduceClaimGroup(group: Claim[]): Claim {
  // Precedence: contradicted > confirmed > absent
  const byPrec = (v: ClaimVerdict): number =>
    v === "contradicted" ? 3 : v === "confirmed" ? 2 : 1;
  const sorted = [...group].sort((a, b) => {
    const pv = byPrec(b.verdict) - byPrec(a.verdict);
    if (pv !== 0) return pv;
    // tiebreak by confidence high>med>low
    const cv = confLevel(b.confidence) - confLevel(a.confidence);
    if (cv !== 0) return cv;
    return (b.source_evidence?.length ?? 0) - (a.source_evidence?.length ?? 0);
  });
  return sorted[0];
}

function confLevel(c: Claim["confidence"]): number {
  return c === "high" ? 3 : c === "medium" ? 2 : 1;
}

function parseValidation(
  card: Card,
  raw: string,
  chunksConsumed: number,
  charsConsumed: number,
): SourceValidation {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const fallback: SourceValidation = {
    citation_key: card.citation_key,
    source_url: card.official_url ?? "",
    source_chunks_consumed: chunksConsumed,
    source_chars_consumed: charsConsumed,
    overall_verdict: "inconclusive",
    claims: [],
    notes: ["could not parse JSON response"],
    raw_response: raw,
  };
  try {
    const parsed = JSON.parse(stripped);
    return {
      citation_key: card.citation_key,
      source_url: card.official_url ?? "",
      source_chunks_consumed: chunksConsumed,
      source_chars_consumed: charsConsumed,
      overall_verdict: parsed.overall_verdict ?? "inconclusive",
      claims: Array.isArray(parsed.claims) ? parsed.claims : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      raw_response: raw,
    };
  } catch {
    return fallback;
  }
}
