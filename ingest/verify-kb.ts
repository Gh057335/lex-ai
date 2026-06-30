#!/usr/bin/env bun
import Anthropic from "@anthropic-ai/sdk";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { loadAllCards, shouldSkipCard, type Card } from "./lib/parse-cards";
import { fetchSource, runWithConcurrency, type FetchResult } from "./lib/fetch-source";
import { verifyCardWithLLM } from "./lib/verify-card";
import {
  openDb,
  startRun,
  finishRun,
  insertCardRow,
  type CardRow,
} from "./lib/db";
import {
  computeStats,
  rowsToEntries,
  writeJsonReport,
  writeMarkdownReport,
} from "./lib/report";

type Args = {
  kbDir: string;
  outDir: string;
  dbPath: string;
  model: string;
  noLlm: boolean;
  concurrency: number;
  limit: number | null;
  cardKey: string | null;
  cardKeys: string[] | null;
};

function parseFlags(): Args {
  const { values } = parseArgs({
    options: {
      "kb-dir": { type: "string", default: "docs/knowledge-base" },
      "out-dir": { type: "string", default: "docs/knowledge-base/.verification" },
      "db-path": { type: "string", default: "docs/knowledge-base/.verification/state.sqlite" },
      model: { type: "string", default: process.env.ANTHROPIC_MODEL_CLASSIFY ?? "claude-haiku-4-5-20251001" },
      "no-llm": { type: "boolean", default: false },
      concurrency: { type: "string", default: "4" },
      limit: { type: "string" },
      card: { type: "string" },
      cards: { type: "string" },
    },
    allowPositionals: false,
  });
  const cwd = process.cwd();
  return {
    kbDir: resolve(cwd, values["kb-dir"] as string),
    outDir: resolve(cwd, values["out-dir"] as string),
    dbPath: resolve(cwd, values["db-path"] as string),
    model: values.model as string,
    noLlm: Boolean(values["no-llm"]),
    concurrency: Math.max(1, Number(values.concurrency)),
    limit: values.limit ? Number(values.limit) : null,
    cardKey: (values.card as string | undefined) ?? null,
    cardKeys: values.cards ? (values.cards as string).split(",").map((s) => s.trim()).filter(Boolean) : null,
  };
}

async function main() {
  const args = parseFlags();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!args.noLlm && !apiKey) {
    console.error("ANTHROPIC_API_KEY missing. Set it or pass --no-llm to skip the LLM step.");
    process.exit(1);
  }

  console.log(`[verify-kb] kb-dir = ${args.kbDir}`);
  let cards = await loadAllCards(args.kbDir);
  console.log(`[verify-kb] parsed ${cards.length} cards`);
  if (args.cardKey) {
    cards = cards.filter((c) => c.citation_key === args.cardKey);
    if (cards.length === 0) {
      console.error(`[verify-kb] no card with citation_key=${args.cardKey}`);
      process.exit(2);
    }
  }
  if (args.cardKeys && args.cardKeys.length > 0) {
    const wanted = new Set(args.cardKeys);
    cards = cards.filter((c) => wanted.has(c.citation_key));
    const missing = args.cardKeys.filter((k) => !cards.some((c) => c.citation_key === k));
    if (missing.length) console.warn(`[verify-kb] ${missing.length} requested keys not found: ${missing.slice(0, 5).join(",")}${missing.length > 5 ? "..." : ""}`);
  }
  if (args.limit !== null) cards = cards.slice(0, args.limit);
  console.log(`[verify-kb] verifying ${cards.length} cards (concurrency=${args.concurrency}, llm=${!args.noLlm})`);

  const db = openDb(args.dbPath);
  const flags = JSON.stringify({
    no_llm: args.noLlm,
    concurrency: args.concurrency,
    limit: args.limit,
    card: args.cardKey,
  });
  const runId = startRun(db, args.kbDir, args.model, flags);
  console.log(`[verify-kb] run id = ${runId}`);

  const client = !args.noLlm
    ? new Anthropic({ apiKey })
    : null;

  let done = 0;
  await runWithConcurrency(
    cards,
    args.concurrency,
    async (card) => {
      const row = await verifyOne(card, client, args.model, runId, args.noLlm);
      insertCardRow(db, row);
      done++;
      process.stdout.write(
        `\r[verify-kb] ${done}/${cards.length}  last=${card.citation_key.padEnd(38).slice(0, 38)}`,
      );
    },
  );
  process.stdout.write("\n");

  finishRun(db, runId);

  const rows = db
    .query<CardRow, [number]>(`SELECT * FROM card_verifications WHERE run_id = ? ORDER BY citation_key`)
    .all(runId);
  const entries = rowsToEntries(rows);
  const stats = computeStats(entries);

  const jsonPath = join(args.outDir, `report-${runId}.json`);
  const mdPath = join(args.outDir, `report-${runId}.md`);
  const latestJsonPath = join(args.outDir, "report-latest.json");
  const latestMdPath = join(args.outDir, "report-latest.md");

  await writeJsonReport(jsonPath, runId, entries, stats);
  await writeMarkdownReport(mdPath, runId, entries, stats);
  await writeJsonReport(latestJsonPath, runId, entries, stats);
  await writeMarkdownReport(latestMdPath, runId, entries, stats);

  console.log("");
  console.log(`[verify-kb] done — run ${runId}`);
  console.log(`[verify-kb] reports:`);
  console.log(`  ${mdPath}`);
  console.log(`  ${jsonPath}`);
  console.log("");
  console.log(`[verify-kb] summary:`);
  console.log(`  total              ${stats.total}`);
  console.log(`  ✅ verified         ${stats.verified}`);
  console.log(`  ⚠️  partial          ${stats.partial}`);
  console.log(`  ❌ mismatch         ${stats.mismatch}`);
  console.log(`  ❓ inconclusive     ${stats.inconclusive}`);
  console.log(`  🔌 unreachable      ${stats.unreachable}`);
  console.log(`  📄 pdf_skipped      ${stats.pdf_skipped}`);
  console.log(`  🚫 no_url           ${stats.no_url}`);
  console.log(`  🛠  lexai_template   ${stats.lexai_template}`);
  console.log(`  💥 errored          ${stats.errored}`);
}

async function verifyOne(
  card: Card,
  client: Anthropic | null,
  model: string,
  runId: number,
  noLlm: boolean,
): Promise<CardRow> {
  const skip = shouldSkipCard(card);
  if (skip.skip) {
    return baseRow(card, runId, {
      verdict: skip.reason === "lexai_owned_template" ? "skipped_lexai_template" : "skipped_no_url",
      skipped_reason: skip.reason ?? null,
    });
  }
  const url = card.official_url!;
  let fetched: FetchResult;
  try {
    fetched = await fetchSource(url);
  } catch (err) {
    return baseRow(card, runId, {
      url,
      verdict: "errored",
      error: err instanceof Error ? err.message : String(err),
    });
  }
  if (!fetched.ok || fetched.error) {
    return baseRow(card, runId, {
      url,
      http_status: fetched.status,
      content_type: fetched.content_type,
      body_sha256: fetched.body_sha256,
      body_size: fetched.body_size,
      is_pdf: fetched.is_pdf ? 1 : 0,
      via_archive: fetched.via_archive ? 1 : 0,
      attempts: fetched.attempts,
      verdict: "unreachable",
      error: fetched.error,
    });
  }
  // PDFs now have text extracted via unpdf — pass to LLM same as HTML.
  // Only skip if extraction failed badly.
  if (fetched.is_pdf && fetched.text.startsWith("[pdf-extract-error")) {
    return baseRow(card, runId, {
      url,
      http_status: fetched.status,
      content_type: fetched.content_type,
      body_sha256: fetched.body_sha256,
      body_size: fetched.body_size,
      is_pdf: 1,
      via_archive: fetched.via_archive ? 1 : 0,
      attempts: fetched.attempts,
      verdict: "pdf_skipped",
      error: fetched.text,
    });
  }
  if (noLlm || !client) {
    return baseRow(card, runId, {
      url,
      http_status: fetched.status,
      content_type: fetched.content_type,
      body_sha256: fetched.body_sha256,
      body_size: fetched.body_size,
      is_pdf: fetched.is_pdf ? 1 : 0,
      via_archive: fetched.via_archive ? 1 : 0,
      attempts: fetched.attempts,
      verdict: "inconclusive",
      concerns: ["fetched only — LLM step skipped"],
    });
  }
  let llm;
  try {
    llm = await verifyCardWithLLM(client, model, card, fetched);
  } catch (err) {
    return baseRow(card, runId, {
      url,
      http_status: fetched.status,
      content_type: fetched.content_type,
      body_sha256: fetched.body_sha256,
      body_size: fetched.body_size,
      is_pdf: fetched.is_pdf ? 1 : 0,
      via_archive: fetched.via_archive ? 1 : 0,
      attempts: fetched.attempts,
      verdict: "errored",
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return baseRow(card, runId, {
    url,
    http_status: fetched.status,
    content_type: fetched.content_type,
    body_sha256: fetched.body_sha256,
    body_size: fetched.body_size,
    is_pdf: fetched.is_pdf ? 1 : 0,
    via_archive: fetched.via_archive ? 1 : 0,
    attempts: fetched.attempts,
    verdict: llm.verdict,
    evidence: llm.evidence,
    concerns: llm.concerns,
    criteria: llm.criteria,
    raw_llm_response: llm.raw_response,
  });
}

type RowOverrides = Partial<{
  url: string | null;
  http_status: number | null;
  content_type: string | null;
  body_sha256: string | null;
  body_size: number | null;
  is_pdf: number;
  via_archive: number;
  attempts: number;
  skipped_reason: string | null;
  verdict: string;
  evidence: string[];
  concerns: string[];
  criteria: Record<string, string>;
  raw_llm_response: string | null;
  error: string | null;
}>;

function baseRow(card: Card, runId: number, overrides: RowOverrides): CardRow {
  return {
    citation_key: card.citation_key,
    run_id: runId,
    fetched_at: new Date().toISOString(),
    source_file: card.source_file,
    url: overrides.url ?? null,
    http_status: overrides.http_status ?? null,
    content_type: overrides.content_type ?? null,
    body_sha256: overrides.body_sha256 ?? null,
    body_size: overrides.body_size ?? null,
    is_pdf: overrides.is_pdf ?? 0,
    via_archive: overrides.via_archive ?? 0,
    attempts: overrides.attempts ?? 1,
    skipped_reason: overrides.skipped_reason ?? null,
    verdict: overrides.verdict ?? "inconclusive",
    evidence: JSON.stringify(overrides.evidence ?? []),
    concerns: JSON.stringify(overrides.concerns ?? []),
    criteria: JSON.stringify(overrides.criteria ?? {}),
    raw_llm_response: overrides.raw_llm_response ?? null,
    error: overrides.error ?? null,
  };
}

main().catch((err) => {
  console.error("[verify-kb] fatal:", err);
  process.exit(1);
});
