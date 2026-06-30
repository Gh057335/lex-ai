/**
 * Heading-aware chunker for statute text.
 * Targets §5 of the build prompt: 800-1,200 token chunks, 100-token overlap,
 * preserves article/section numbers in heading_path.
 *
 * Token estimation uses ~4 chars/token heuristic (good enough for English/French).
 */
export type Chunk = {
  ordinal: number;
  heading_path: string[];
  body: string;
  token_count: number;
  start_char: number;
  end_char: number;
};

const TARGET_TOKENS = 1000;
const MAX_TOKENS = 1400;
const OVERLAP_TOKENS = 100;
const CHARS_PER_TOKEN = 4;

// Detect statutory headings: Chapter, Title, Part, Section, Article, Art.
// English / French / Italian variants.
const HEADING_RE =
  /^(?:\s{0,4})((?:CHAPTER|Chapter|TITLE|Title|TITRE|Titre|PART|Part|PARTIE|Partie|BOOK|Book|LIVRE|Livre|SECTION|Section|SUBSECTION|Subsection|ARTICLE|Article|ARTICOLO|Articolo|Art\.|ART\.|§)\s+[A-Za-z0-9IVXLCDM\-.]+\.?)(?::|\.|—|-|–)?\s*(.{0,160})?$/;

export function chunkText(raw: string): Chunk[] {
  const text = normalise(raw);
  if (!text) return [];

  const lines = text.split("\n");
  const segments: { heading: string | null; body: string; start: number }[] = [];
  let buf: string[] = [];
  let curHeading: string | null = null;
  let cursor = 0;
  let segStart = 0;

  const flushSeg = () => {
    const body = buf.join("\n").trim();
    if (body || curHeading) {
      segments.push({ heading: curHeading, body, start: segStart });
    }
    buf = [];
    segStart = cursor;
  };

  for (const line of lines) {
    const m = line.match(HEADING_RE);
    if (m) {
      flushSeg();
      curHeading = (m[1] + (m[2] ? " " + m[2] : "")).trim();
    } else {
      buf.push(line);
    }
    cursor += line.length + 1;
  }
  flushSeg();

  // Now group segments into chunks targeting TARGET_TOKENS, hard cap MAX_TOKENS.
  const chunks: Chunk[] = [];
  const stack: string[] = [];
  let ord = 0;
  let acc: { headings: string[]; body: string; start: number } | null = null;

  const updateStack = (h: string | null) => {
    if (!h) return;
    const level = headingLevel(h);
    while (stack.length && headingLevel(stack[stack.length - 1]) >= level) stack.pop();
    stack.push(h);
  };

  const pushChunk = () => {
    if (!acc) return;
    const body = acc.body.trim();
    if (!body) {
      acc = null;
      return;
    }
    const tok = Math.ceil(body.length / CHARS_PER_TOKEN);
    chunks.push({
      ordinal: ord++,
      heading_path: [...acc.headings],
      body,
      token_count: tok,
      start_char: acc.start,
      end_char: acc.start + body.length,
    });
    acc = null;
  };

  for (const seg of segments) {
    updateStack(seg.heading);
    const headingsSnapshot = [...stack];
    const segContent = (seg.heading ? seg.heading + "\n" : "") + seg.body;
    const segTokens = Math.ceil(segContent.length / CHARS_PER_TOKEN);

    if (!acc) {
      acc = { headings: headingsSnapshot, body: segContent, start: seg.start };
      continue;
    }
    const accTokens = Math.ceil(acc.body.length / CHARS_PER_TOKEN);
    if (accTokens + segTokens <= MAX_TOKENS && accTokens < TARGET_TOKENS) {
      acc.body += "\n" + segContent;
    } else {
      pushChunk();
      acc = { headings: headingsSnapshot, body: segContent, start: seg.start };
    }
    // hard cap split if single segment is huge
    if (segTokens > MAX_TOKENS) {
      acc = null;
      pushChunk();
      const hardChunks = hardSplit(segContent, MAX_TOKENS, OVERLAP_TOKENS);
      for (const c of hardChunks) {
        chunks.push({
          ordinal: ord++,
          heading_path: headingsSnapshot,
          body: c,
          token_count: Math.ceil(c.length / CHARS_PER_TOKEN),
          start_char: seg.start,
          end_char: seg.start + c.length,
        });
      }
    }
  }
  pushChunk();
  return chunks;
}

function headingLevel(h: string): number {
  const lower = h.toLowerCase();
  if (/^(book|livre|titre|title)\b/.test(lower)) return 1;
  if (/^(part|partie)\b/.test(lower)) return 2;
  if (/^(chapter|chapitre)\b/.test(lower)) return 3;
  if (/^(section|subsection)\b/.test(lower)) return 4;
  if (/^(article|articolo|art\.)\b/.test(lower)) return 5;
  if (/^§/.test(h)) return 5;
  return 6;
}

function hardSplit(text: string, maxTokens: number, overlapTokens: number): string[] {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  const overlapChars = overlapTokens * CHARS_PER_TOKEN;
  const out: string[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const slice = text.slice(cursor, cursor + maxChars);
    out.push(slice);
    if (cursor + maxChars >= text.length) break;
    cursor += maxChars - overlapChars;
  }
  return out;
}

function normalise(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[   ]/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
