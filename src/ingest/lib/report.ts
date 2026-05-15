import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { CardRow } from "./db";

export type ReportEntry = {
  citation_key: string;
  source_file: string;
  url: string | null;
  verdict: string;
  http_status: number | null;
  is_pdf: boolean;
  skipped_reason: string | null;
  evidence: string[];
  concerns: string[];
  criteria: Record<string, string>;
  error: string | null;
};

export function rowsToEntries(rows: CardRow[]): ReportEntry[] {
  return rows.map((r) => ({
    citation_key: r.citation_key,
    source_file: r.source_file,
    url: r.url,
    verdict: r.verdict,
    http_status: r.http_status,
    is_pdf: r.is_pdf === 1,
    skipped_reason: r.skipped_reason,
    evidence: safeJson<string[]>(r.evidence, []),
    concerns: safeJson<string[]>(r.concerns, []),
    criteria: safeJson<Record<string, string>>(r.criteria, {}),
    error: r.error,
  }));
}

function safeJson<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export type ReportStats = {
  total: number;
  verified: number;
  partial: number;
  mismatch: number;
  inconclusive: number;
  unreachable: number;
  pdf_skipped: number;
  lexai_template: number;
  no_url: number;
  errored: number;
};

export function computeStats(entries: ReportEntry[]): ReportStats {
  const counts: ReportStats = {
    total: entries.length,
    verified: 0,
    partial: 0,
    mismatch: 0,
    inconclusive: 0,
    unreachable: 0,
    pdf_skipped: 0,
    lexai_template: 0,
    no_url: 0,
    errored: 0,
  };
  for (const e of entries) {
    switch (e.verdict) {
      case "verified":
        counts.verified++;
        break;
      case "partial":
        counts.partial++;
        break;
      case "mismatch":
        counts.mismatch++;
        break;
      case "inconclusive":
        counts.inconclusive++;
        break;
      case "unreachable":
        counts.unreachable++;
        break;
      case "pdf_skipped":
        counts.pdf_skipped++;
        break;
      case "skipped_lexai_template":
        counts.lexai_template++;
        break;
      case "skipped_no_url":
        counts.no_url++;
        break;
      case "errored":
        counts.errored++;
        break;
    }
  }
  return counts;
}

export async function writeJsonReport(
  path: string,
  runId: number,
  entries: ReportEntry[],
  stats: ReportStats,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const payload = {
    run_id: runId,
    generated_at: new Date().toISOString(),
    stats,
    entries,
  };
  await writeFile(path, JSON.stringify(payload, null, 2), "utf-8");
}

export async function writeMarkdownReport(
  path: string,
  runId: number,
  entries: ReportEntry[],
  stats: ReportStats,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const totalActioned = stats.verified + stats.partial + stats.mismatch + stats.inconclusive;
  const denom = Math.max(totalActioned, 1);
  const pct = (n: number) => `${Math.round((n / denom) * 100)}%`;

  const lines: string[] = [];
  lines.push(`# Knowledge Base — Verification Report`);
  lines.push(``);
  lines.push(`- **Run ID:** ${runId}`);
  lines.push(`- **Generated:** ${new Date().toISOString()}`);
  lines.push(`- **Total cards:** ${stats.total}`);
  lines.push(``);
  lines.push(`## Stats`);
  lines.push(``);
  lines.push(`| Verdict | Count | % of LLM-checked |`);
  lines.push(`|---|---|---|`);
  lines.push(`| ✅ verified | ${stats.verified} | ${pct(stats.verified)} |`);
  lines.push(`| ⚠️ partial | ${stats.partial} | ${pct(stats.partial)} |`);
  lines.push(`| ❌ mismatch | ${stats.mismatch} | ${pct(stats.mismatch)} |`);
  lines.push(`| ❓ inconclusive | ${stats.inconclusive} | ${pct(stats.inconclusive)} |`);
  lines.push(`| 🔌 unreachable | ${stats.unreachable} | — |`);
  lines.push(`| 📄 pdf_skipped | ${stats.pdf_skipped} | — |`);
  lines.push(`| 🚫 no_url | ${stats.no_url} | — |`);
  lines.push(`| 🛠️ lexai_template | ${stats.lexai_template} | — |`);
  lines.push(`| 💥 errored | ${stats.errored} | — |`);
  lines.push(``);

  const groups: Record<string, ReportEntry[]> = {
    "❌ Mismatch — needs human review now": [],
    "⚠️ Partial — facts to confirm": [],
    "❓ Inconclusive — page unreadable, need different source": [],
    "🔌 Unreachable": [],
    "📄 PDF — needs PDF parser": [],
    "🚫 No URL — orphan cards": [],
    "✅ Verified": [],
    "Other": [],
  };
  for (const e of entries) {
    if (e.verdict === "mismatch") groups["❌ Mismatch — needs human review now"].push(e);
    else if (e.verdict === "partial") groups["⚠️ Partial — facts to confirm"].push(e);
    else if (e.verdict === "inconclusive")
      groups["❓ Inconclusive — page unreadable, need different source"].push(e);
    else if (e.verdict === "unreachable") groups["🔌 Unreachable"].push(e);
    else if (e.verdict === "pdf_skipped") groups["📄 PDF — needs PDF parser"].push(e);
    else if (e.verdict === "skipped_no_url") groups["🚫 No URL — orphan cards"].push(e);
    else if (e.verdict === "verified") groups["✅ Verified"].push(e);
    else groups["Other"].push(e);
  }

  for (const [name, list] of Object.entries(groups)) {
    if (list.length === 0) continue;
    lines.push(`## ${name} (${list.length})`);
    lines.push(``);
    for (const e of list) {
      lines.push(`### \`${e.citation_key}\``);
      lines.push(``);
      lines.push(`- **Source file:** \`${e.source_file}\``);
      if (e.url) lines.push(`- **URL:** ${e.url}`);
      if (e.http_status !== null) lines.push(`- **HTTP status:** ${e.http_status}`);
      if (e.error) lines.push(`- **Error:** \`${e.error}\``);
      if (Object.keys(e.criteria).length > 0) {
        lines.push(`- **Criteria:** ${formatCriteria(e.criteria)}`);
      }
      if (e.evidence.length > 0) {
        lines.push(`- **Evidence:**`);
        for (const ev of e.evidence) lines.push(`  - "${ev}"`);
      }
      if (e.concerns.length > 0) {
        lines.push(`- **Concerns:**`);
        for (const c of e.concerns) lines.push(`  - ${c}`);
      }
      lines.push(``);
    }
  }

  await writeFile(path, lines.join("\n"), "utf-8");
}

function formatCriteria(c: Record<string, string>): string {
  return Object.entries(c)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
}
