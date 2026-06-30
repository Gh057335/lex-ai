import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

export type Card = {
  citation_key: string;
  title: string;
  source_file: string;
  raw: string;
  fields: Record<string, string>;
  official_url: string | null;
  effective_from: string | null;
  effective_to: string | null;
  jurisdiction: string | null;
  type: string | null;
  sector: string | null;
  publisher: string | null;
  license_class: string | null;
  language: string | null;
  key_parts: string | null;
  cross_refs: string | null;
  notes: string | null;
};

const KB_SKIP_FILES = new Set(["README.md"]);
const LEXAI_OWNED_PREFIX = "lexai/";

export async function loadAllCards(kbRoot: string): Promise<Card[]> {
  const files = await walk(kbRoot);
  const cards: Card[] = [];
  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    const base = file.split("/").pop()!;
    if (KB_SKIP_FILES.has(base)) continue;
    const text = await Bun.file(file).text();
    const rel = relative(kbRoot, file);
    cards.push(...parseFile(text, rel));
  }
  return cards;
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

function parseFile(text: string, sourceFile: string): Card[] {
  const cards: Card[] = [];
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const header = line.match(/^###\s+([^\s—]+)\s*(?:—|--)?\s*(.*)$/);
    if (!header) {
      i++;
      continue;
    }
    const citationKey = header[1].trim();
    const title = header[2].trim();
    if (!isLikelyCitationKey(citationKey)) {
      i++;
      continue;
    }
    const start = i;
    i++;
    while (i < lines.length && !/^###\s/.test(lines[i]) && !/^##\s/.test(lines[i])) i++;
    const raw = lines.slice(start, i).join("\n");
    const fields = parseFields(raw);
    cards.push(buildCard(citationKey, title, sourceFile, raw, fields));
  }
  return cards;
}

function isLikelyCitationKey(s: string): boolean {
  return /^[a-z][a-z0-9._/-]+$/.test(s);
}

function parseFields(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = raw.split("\n");
  let current: { key: string; value: string } | null = null;
  const flush = () => {
    if (current && !(current.key in out)) {
      out[current.key] = current.value.trim();
    }
    current = null;
  };
  for (const line of lines) {
    if (/^\s*$/.test(line)) {
      flush();
      continue;
    }
    const bullet = line.match(/^-\s+\*\*([^:*]+):\*\*\s*(.*)$/);
    if (bullet) {
      flush();
      const inlinePairs = extractInlineFieldPairs(line);
      if (inlinePairs.length > 1) {
        for (const p of inlinePairs) {
          if (!(p.key in out)) out[p.key] = p.value.trim();
        }
        continue;
      }
      current = { key: normaliseKey(bullet[1]), value: bullet[2] };
      continue;
    }
    if (current && /^\s+/.test(line)) {
      current.value += " " + line.trim();
      continue;
    }
    if (current) {
      current.value += " " + line.trim();
    }
  }
  flush();
  return out;
}

function extractInlineFieldPairs(line: string): { key: string; value: string }[] {
  const stripped = line.replace(/^-\s+/, "");
  const re = /\*\*([^:*]+):\*\*\s*([^*]*?)(?=\s*\*\*[^:*]+:\*\*|$)/g;
  const out: { key: string; value: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped)) !== null) {
    out.push({ key: normaliseKey(m[1]), value: m[2].trim() });
  }
  return out;
}

function normaliseKey(k: string): string {
  return k
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function buildCard(
  citationKey: string,
  title: string,
  sourceFile: string,
  raw: string,
  fields: Record<string, string>,
): Card {
  const url = extractUrl(fields["official_url"] ?? "");
  return {
    citation_key: citationKey,
    title,
    source_file: sourceFile,
    raw,
    fields,
    official_url: url,
    effective_from: fields["effective_from"] ?? null,
    effective_to: fields["effective_to"] ?? null,
    jurisdiction: fields["jurisdiction"] ?? null,
    type: fields["type"] ?? null,
    sector: fields["sector"] ?? null,
    publisher: fields["publisher"] ?? null,
    license_class: fields["license_class"] ?? null,
    language: fields["language"] ?? null,
    key_parts: fields["key_parts"] ?? null,
    cross_refs: fields["cross_refs"] ?? null,
    notes: fields["notes"] ?? null,
  };
}

function extractUrl(raw: string): string | null {
  if (!raw) return null;
  const m = raw.match(/https?:\/\/[^\s)]+/);
  return m ? m[0].replace(/[.,;]+$/, "") : null;
}

export function shouldSkipCard(card: Card): { skip: boolean; reason?: string } {
  if (card.citation_key.startsWith(LEXAI_OWNED_PREFIX)) {
    return { skip: true, reason: "lexai_owned_template" };
  }
  if (!card.official_url) {
    return { skip: true, reason: "no_official_url" };
  }
  return { skip: false };
}
