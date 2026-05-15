#!/usr/bin/env bun
/**
 * Source-grounded ingestion + card correction orchestrator.
 *
 * For each requested card:
 *  1. Look up its source URL (override via --source-overrides JSON file when needed)
 *  2. Fetch the source (HTML/PDF via existing fetch-source.ts)
 *  3. Heading-aware chunk
 *  4. Send (card + chunks) to Claude for source-grounded validation
 *  5. Apply auditable patches to the card markdown
 *  6. Emit summary
 *
 * Usage:
 *   bun src/ingest/ingest-cards.ts --cards=un/ny-conv-1958,un/uncac-2003 [--dry-run]
 *   bun src/ingest/ingest-cards.ts --cards-file=/tmp/seed-batch.txt
 *   bun src/ingest/ingest-cards.ts --source-overrides=/tmp/source-urls.json --cards=un/ny-conv-1958
 *
 * Notes:
 *  - This is the "real" ingestion the build prompt calls Phase 1.
 *  - Costs real $: Sonnet 4.6 for validation, ~$0.05-0.15 per card depending on source size.
 */
import Anthropic from "@anthropic-ai/sdk";
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { loadAllCards, type Card } from "./lib/parse-cards";
import { fetchSource, type FetchResult } from "./lib/fetch-source";
import { chunkText, type Chunk } from "./lib/chunker";
import { validateCardAgainstSource, type SourceValidation } from "./lib/validate-against-source";
import { applyValidationToCard, type PatchOutcome } from "./lib/apply-patches";

type Args = {
  kbDir: string;
  cardKeys: string[];
  sourceOverrides: Record<string, string>;
  dryRun: boolean;
  model: string;
  minConfidence: "high" | "medium";
};

async function parseFlags(): Promise<Args> {
  const { values } = parseArgs({
    options: {
      "kb-dir": { type: "string", default: "docs/knowledge-base" },
      cards: { type: "string" },
      "cards-file": { type: "string" },
      "source-overrides": { type: "string" },
      "dry-run": { type: "boolean", default: false },
      model: { type: "string", default: process.env.ANTHROPIC_MODEL_DRAFTING ?? "claude-sonnet-4-6" },
      "min-confidence": { type: "string", default: "medium" },
    },
  });
  const kbDir = resolve(process.cwd(), values["kb-dir"] as string);
  let cardKeys: string[] = [];
  if (values.cards) cardKeys = (values.cards as string).split(",").map((s) => s.trim()).filter(Boolean);
  if (values["cards-file"]) {
    const text = await readFile(resolve(values["cards-file"] as string), "utf-8");
    cardKeys.push(...text.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")));
  }
  let sourceOverrides: Record<string, string> = {};
  if (values["source-overrides"]) {
    const text = await readFile(resolve(values["source-overrides"] as string), "utf-8");
    sourceOverrides = JSON.parse(text);
  }
  return {
    kbDir,
    cardKeys: Array.from(new Set(cardKeys)),
    sourceOverrides,
    dryRun: !!values["dry-run"],
    model: values.model as string,
    minConfidence: (values["min-confidence"] as "high" | "medium") ?? "medium",
  };
}

async function main() {
  const args = await parseFlags();
  if (args.cardKeys.length === 0) {
    console.error("Specify --cards=key1,key2 or --cards-file=path");
    process.exit(1);
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY missing");
    process.exit(1);
  }

  console.log(`[ingest] loading all cards from ${args.kbDir}`);
  const allCards = await loadAllCards(args.kbDir);
  const byKey = new Map(allCards.map((c) => [c.citation_key, c] as const));
  const targets: Card[] = [];
  for (const k of args.cardKeys) {
    const c = byKey.get(k);
    if (!c) {
      console.warn(`  [skip] card not found: ${k}`);
      continue;
    }
    targets.push(c);
  }
  console.log(`[ingest] ${targets.length} cards to ingest. model=${args.model} dry_run=${args.dryRun}`);

  const client = new Anthropic({ apiKey });
  const outcomes: { card: Card; fetched?: FetchResult; chunks?: number; validation?: SourceValidation; patches?: PatchOutcome; error?: string }[] = [];

  for (const card of targets) {
    const sourceUrl = args.sourceOverrides[card.citation_key] ?? card.official_url;
    if (!sourceUrl) {
      console.log(`\n✗ ${card.citation_key}: no source URL`);
      outcomes.push({ card, error: "no source URL" });
      continue;
    }
    console.log(`\n→ ${card.citation_key}`);
    console.log(`   fetching ${sourceUrl}`);
    const fetched = await fetchSource(sourceUrl);
    if (!fetched.ok || !fetched.text || fetched.text.startsWith("[pdf-extract-error")) {
      console.log(`   ✗ fetch failed: status=${fetched.status} error=${fetched.error}`);
      outcomes.push({ card, fetched, error: `fetch_failed:${fetched.error ?? fetched.status}` });
      continue;
    }
    console.log(`   ✓ fetched ${(fetched.body_size / 1024).toFixed(1)} KB, ${fetched.text.length} chars text${fetched.is_pdf ? " (PDF)" : ""}${fetched.via_archive ? " (via archive.org)" : ""}`);

    const chunks = chunkText(fetched.text);
    console.log(`   ✓ ${chunks.length} chunks`);

    console.log(`   ✓ validating with ${args.model}...`);
    let validation: SourceValidation;
    try {
      validation = await validateCardAgainstSource(client, args.model, card, chunks);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`   ✗ validation error: ${msg}`);
      outcomes.push({ card, fetched, chunks: chunks.length, error: `validation:${msg}` });
      continue;
    }

    const claims = validation.claims;
    const counts = {
      total: claims.length,
      confirmed: claims.filter((c) => c.verdict === "confirmed").length,
      contradicted: claims.filter((c) => c.verdict === "contradicted").length,
      absent: claims.filter((c) => c.verdict === "absent").length,
    };
    console.log(`   ✓ ${validation.overall_verdict.toUpperCase()} — ${counts.confirmed}✓ ${counts.contradicted}✗ ${counts.absent}? (of ${counts.total} claims)`);

    const patches = await applyValidationToCard(args.kbDir, card, validation, {
      dryRun: args.dryRun,
      minConfidence: args.minConfidence,
    });
    if (patches.patches_applied > 0) {
      console.log(`   ${args.dryRun ? "(dry)" : "✓"} ${patches.patches_applied} patches applied${patches.patches_skipped > 0 ? `, ${patches.patches_skipped} skipped` : ""}`);
    } else if (patches.patches_skipped > 0) {
      console.log(`   ⚠ 0 applied / ${patches.patches_skipped} skipped: ${patches.skipped_reasons.slice(0, 2).join("; ")}`);
    } else {
      console.log(`   ✓ no contradictions found — card already source-grounded`);
    }
    console.log(`   📝 audit: ${patches.audit_path}`);
    outcomes.push({ card, fetched, chunks: chunks.length, validation, patches });
  }

  // Final summary
  console.log("\n" + "=".repeat(70));
  console.log("INGESTION SUMMARY");
  console.log("=".repeat(70));
  const summary = {
    targeted: targets.length,
    fetched_ok: outcomes.filter((o) => o.fetched?.ok && !o.error?.startsWith("fetch_failed")).length,
    validated: outcomes.filter((o) => o.validation).length,
    verified_overall: outcomes.filter((o) => o.validation?.overall_verdict === "verified").length,
    partial_overall: outcomes.filter((o) => o.validation?.overall_verdict === "partial").length,
    mismatch_overall: outcomes.filter((o) => o.validation?.overall_verdict === "mismatch").length,
    inconclusive_overall: outcomes.filter((o) => o.validation?.overall_verdict === "inconclusive").length,
    total_patches_applied: outcomes.reduce((a, o) => a + (o.patches?.patches_applied ?? 0), 0),
    total_patches_skipped: outcomes.reduce((a, o) => a + (o.patches?.patches_skipped ?? 0), 0),
    errored: outcomes.filter((o) => o.error).length,
  };
  for (const [k, v] of Object.entries(summary)) console.log(`  ${k.padEnd(22)} ${v}`);
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
