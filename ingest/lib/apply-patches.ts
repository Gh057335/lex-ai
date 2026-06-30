import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { createHash } from "node:crypto";
import type { Card } from "./parse-cards";
import type { SourceValidation, Claim } from "./validate-against-source";

/**
 * Apply source-grounded patches to a card markdown file.
 *
 * Strategy:
 *  - For "contradicted" claims with high|medium confidence + a suggested_replacement,
 *    perform a literal substring substitution on the card's raw markdown.
 *  - Add a "Source-grounded notes" footer with the audit pointer + scoreboard.
 *  - Append an entry to .verification/audit/<key>.json with full claim list + before/after hashes.
 *
 * NEVER touch frontmatter or headings. NEVER apply a patch if old_string isn't unique in the file.
 */

export type PatchOutcome = {
  citation_key: string;
  source_file: string;
  patches_applied: number;
  patches_skipped: number;
  skipped_reasons: string[];
  before_sha256: string;
  after_sha256: string;
  audit_path: string;
};

const AUDIT_DIR = "docs/knowledge-base/.verification/audit";

export async function applyValidationToCard(
  kbDir: string,
  card: Card,
  validation: SourceValidation,
  options: { dryRun?: boolean; minConfidence?: "high" | "medium" } = {},
): Promise<PatchOutcome> {
  const minConf = options.minConfidence ?? "medium";
  const fullPath = resolve(kbDir, card.source_file);
  const originalRaw = await readFile(fullPath, "utf-8");
  const beforeHash = createHash("sha256").update(originalRaw).digest("hex");

  // Locate the card block: from `### <citation_key>` until next `### ` or `## ` or `# `
  const cardBlock = extractCardBlock(originalRaw, card.citation_key);
  if (!cardBlock) {
    return {
      citation_key: card.citation_key,
      source_file: card.source_file,
      patches_applied: 0,
      patches_skipped: 0,
      skipped_reasons: ["card block not found in source file"],
      before_sha256: beforeHash,
      after_sha256: beforeHash,
      audit_path: "",
    };
  }

  // Build patch list from validation claims
  let newBlock = cardBlock.block;
  let applied = 0;
  let skipped = 0;
  const skipReasons: string[] = [];

  for (const claim of validation.claims) {
    if (claim.verdict !== "contradicted") continue;
    if (!claim.suggested_replacement || !claim.suggested_replacement.trim()) {
      skipped++;
      skipReasons.push(`no replacement for: ${truncate(claim.claim, 80)}`);
      continue;
    }
    if (minConf === "high" && claim.confidence !== "high") {
      skipped++;
      skipReasons.push(`low conf: ${truncate(claim.claim, 80)}`);
      continue;
    }
    if (claim.confidence === "low") {
      skipped++;
      skipReasons.push(`low conf: ${truncate(claim.claim, 80)}`);
      continue;
    }
    // Locate the old claim in the card block (case-sensitive substring)
    const occurrences = countOccurrences(newBlock, claim.claim);
    if (occurrences === 0) {
      skipped++;
      skipReasons.push(`old_string not found: ${truncate(claim.claim, 80)}`);
      continue;
    }
    if (occurrences > 1) {
      skipped++;
      skipReasons.push(`old_string not unique (${occurrences}×): ${truncate(claim.claim, 80)}`);
      continue;
    }
    newBlock = newBlock.replace(claim.claim, claim.suggested_replacement);
    applied++;
  }

  // Append a single source-grounded annotation line at the end of the card block,
  // before its trailing blank line.
  if (applied > 0) {
    const stamp = new Date().toISOString().slice(0, 10);
    const evidenceLine = `\n- **Source-grounded:** ${stamp} (${applied} patches applied from \`${validation.source_url}\`; audit log in \`.verification/audit/${safeFilename(card.citation_key)}.json\`)`;
    newBlock = newBlock.replace(/\s*$/, evidenceLine + "\n");
  }

  const updatedRaw =
    originalRaw.slice(0, cardBlock.start) + newBlock + originalRaw.slice(cardBlock.end);
  const afterHash = createHash("sha256").update(updatedRaw).digest("hex");

  // Always write audit log (even if dry-run, to give visibility)
  const auditPath = await writeAudit(kbDir, card, validation, {
    before_sha256: beforeHash,
    after_sha256: afterHash,
    patches_applied: applied,
    patches_skipped: skipped,
    skipped_reasons: skipReasons,
    dry_run: !!options.dryRun,
  });

  if (!options.dryRun && applied > 0) {
    await writeFile(fullPath, updatedRaw, "utf-8");
  }

  return {
    citation_key: card.citation_key,
    source_file: card.source_file,
    patches_applied: applied,
    patches_skipped: skipped,
    skipped_reasons: skipReasons,
    before_sha256: beforeHash,
    after_sha256: afterHash,
    audit_path: auditPath,
  };
}

function extractCardBlock(raw: string, citationKey: string): { start: number; end: number; block: string } | null {
  const headerRe = new RegExp(`^###\\s+${escapeRe(citationKey)}\\b[^\\n]*\\n`, "m");
  const m = raw.match(headerRe);
  if (!m) return null;
  const start = m.index!;
  const rest = raw.slice(start + m[0].length);
  // Stop at next `### ` heading (any), or `## ` heading, or `# ` heading, or end-of-file
  const stopRe = /^(?:###?\s|#\s)/m;
  const stopMatch = rest.match(stopRe);
  const endRelative = stopMatch ? stopMatch.index! : rest.length;
  const end = start + m[0].length + endRelative;
  return { start, end, block: raw.slice(start, end) };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countOccurrences(s: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let i = 0;
  while ((i = s.indexOf(needle, i)) !== -1) {
    count++;
    i += needle.length;
  }
  return count;
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function safeFilename(s: string): string {
  return s.replace(/[\/\\]/g, "__");
}

async function writeAudit(
  kbDir: string,
  card: Card,
  validation: SourceValidation,
  meta: {
    before_sha256: string;
    after_sha256: string;
    patches_applied: number;
    patches_skipped: number;
    skipped_reasons: string[];
    dry_run: boolean;
  },
): Promise<string> {
  const auditDir = resolve(kbDir, "..", AUDIT_DIR.replace(/^docs\/knowledge-base\//, ""));
  // The above is fragile; build by going up from kbDir one level (kbDir is .../knowledge-base)
  const dir = join(dirname(kbDir), "knowledge-base", ".verification", "audit");
  await mkdir(dir, { recursive: true });
  const filename = `${safeFilename(card.citation_key)}.json`;
  const path = join(dir, filename);

  const payload = {
    citation_key: card.citation_key,
    source_file: card.source_file,
    source_url: validation.source_url,
    timestamp: new Date().toISOString(),
    chunks_consumed: validation.source_chunks_consumed,
    chars_consumed: validation.source_chars_consumed,
    overall_verdict: validation.overall_verdict,
    claims_count: validation.claims.length,
    claims: validation.claims,
    notes: validation.notes,
    patches_applied: meta.patches_applied,
    patches_skipped: meta.patches_skipped,
    skipped_reasons: meta.skipped_reasons,
    before_sha256: meta.before_sha256,
    after_sha256: meta.after_sha256,
    dry_run: meta.dry_run,
  };
  await writeFile(path, JSON.stringify(payload, null, 2), "utf-8");
  return path;
}
