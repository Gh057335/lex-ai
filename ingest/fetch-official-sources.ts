/**
 * Replace the seeded paraphrase corpus with verbatim text from official PDFs.
 *
 * This is the production-grade ingestion path. The current demo uses
 * representative paraphrases for the 17 sources (see seed-demo-corpus.ts and
 * the `metadata.verbatim_pending` flag on each `legal_sources` row).
 *
 * For the first real client, run this script to fetch the official PDFs, parse
 * them with unpdf, segment into articles via Claude, and replace the existing
 * chunks. The script preserves source identity (uses `key` as upsert anchor),
 * so chat history, contracts, and audit log keep their references.
 *
 * Run: `bun src/ingest/fetch-official-sources.ts [--source-key=ae-difc:contract-law:2004]`
 *
 * STATUS: scaffold. The fetch + segmentation logic is wired end-to-end for
 * sources whose `official_url` points directly to a PDF. For HTML-based
 * publications (almeezan.qa, laws.boe.gov.sa) the CTO will need to extend
 * `downloadSource()` with site-specific PDF link discovery.
 */

import Anthropic from '@anthropic-ai/sdk';
import { extractText } from 'unpdf';
import { createAdminClient } from '@/lib/supabase';
import { anthropic, MODELS } from '@/lib/ai';

interface SegmentedChunk {
  locator: string;            // "Art. 13" / "Reg. 154"
  heading_path: string[];     // ["Part 2", "Formation"]
  body: string;               // VERBATIM article text
  token_count: number;
  language: string;
}

interface Args {
  sourceKey?: string;
  dryRun?: boolean;
}

function parseArgs(): Args {
  const args: Args = {};
  for (const a of process.argv.slice(2)) {
    const [k, v] = a.split('=');
    if (k === '--source-key') args.sourceKey = v;
    if (k === '--dry-run') args.dryRun = true;
  }
  return args;
}

async function main() {
  const args = parseArgs();
  const admin = createAdminClient();

  let q = admin.from('legal_sources').select('id, key, title, official_url, jurisdiction, metadata');
  if (args.sourceKey) q = q.eq('key', args.sourceKey);
  // Default: process only sources flagged as needing verbatim replacement.
  if (!args.sourceKey) q = q.eq('metadata->>verbatim_pending', 'true');

  const { data: sources, error } = await q;
  if (error) throw error;
  if (!sources || sources.length === 0) {
    console.log('No sources to process. Use --source-key=<key> to target a specific source.');
    return;
  }

  console.log(`Processing ${sources.length} source(s)...\n`);

  for (const src of sources) {
    console.log(`━━━ ${src.key} ━━━`);
    console.log(`  Title: ${src.title}`);
    console.log(`  URL:   ${src.official_url}`);

    try {
      const pdfBytes = await downloadSource(src.official_url as string);
      console.log(`  Downloaded: ${(pdfBytes.byteLength / 1024).toFixed(0)} KB`);

      const { text, totalPages } = await extractFromPdf(pdfBytes);
      console.log(`  Extracted:  ${totalPages} pages, ${text.length} chars`);

      const chunks = await segmentWithClaude(src.title as string, text);
      console.log(`  Segmented:  ${chunks.length} articles`);

      if (args.dryRun) {
        console.log('  [DRY RUN — not writing to DB]\n');
        continue;
      }

      await replaceChunks(admin, src.id as string, chunks);
      await admin
        .from('legal_sources')
        .update({
          metadata: { ...((src.metadata as Record<string, unknown>) ?? {}), verbatim_pending: false, verbatim_at: new Date().toISOString() },
          ingested_at: new Date().toISOString(),
        })
        .eq('id', src.id);

      console.log(`  ✓ replaced ${chunks.length} chunks\n`);
    } catch (err) {
      console.error(`  ✗ FAILED: ${err instanceof Error ? err.message : String(err)}\n`);
    }
  }
}

async function downloadSource(url: string): Promise<ArrayBuffer> {
  // TODO (CTO): some sources (e.g. almeezan.qa, laws.boe.gov.sa) serve HTML
  // landing pages, not direct PDFs. Extend here with per-host link discovery:
  // - almeezan.qa: parse `/LawArticles.aspx?...` then fetch the PDF link
  // - laws.boe.gov.sa: scrape the "Download PDF" anchor
  // - difc.ae / adgm.com: usually direct PDF links
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'LEXAI/1.0 (legal corpus ingestion)' },
    redirect: 'follow',
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} on ${url}`);
  const ct = resp.headers.get('content-type') ?? '';
  if (!ct.includes('pdf')) {
    throw new Error(`Expected PDF, got content-type "${ct}". This source needs custom link discovery.`);
  }
  return await resp.arrayBuffer();
}

async function extractFromPdf(bytes: ArrayBuffer): Promise<{ text: string; totalPages: number }> {
  const result = await extractText(new Uint8Array(bytes), { mergePages: true });
  const text = Array.isArray(result.text) ? result.text.join('\n') : (result.text ?? '');
  return { text, totalPages: result.totalPages };
}

const SEGMENT_TOOL: Anthropic.Tool = {
  name: 'submit_articles',
  description: 'Submit the array of articles extracted from the statute, with verbatim text.',
  input_schema: {
    type: 'object',
    required: ['articles'],
    properties: {
      articles: {
        type: 'array',
        items: {
          type: 'object',
          required: ['locator', 'heading_path', 'body'],
          properties: {
            locator:      { type: 'string', description: 'e.g. "Art. 13", "Reg. 154", "Section 12(3)". Preserve original numbering.' },
            heading_path: { type: 'array', items: { type: 'string' }, description: 'Part/chapter/section context, deepest last.' },
            body:         { type: 'string', description: 'VERBATIM text of the article. Do NOT paraphrase. Preserve punctuation and capitalisation.' },
          },
        },
      },
    },
  } as unknown as Anthropic.Tool['input_schema'],
};

const SEGMENT_SYSTEM = `You are extracting articles from a legal statute or regulation.

Rules:
1. Output VERBATIM text from the source. Never paraphrase or summarise.
2. Skip recitals, tables of contents, signatures, and editorial notes. Articles only.
3. Preserve original numbering (Art. 1, Art. 1(2), Art. 1bis, Section A, Reg. 5).
4. Build heading_path from the hierarchy (Part → Chapter → Section).
5. Each article body should be a self-contained legal provision. Combine sub-paragraphs only if they belong to the same article.
6. If text is OCR-garbled, return the cleanest legal text only; if entire sections are unreadable, omit them.

Call the submit_articles tool exactly once.`;

async function segmentWithClaude(title: string, fullText: string): Promise<SegmentedChunk[]> {
  // Statutes can be 100+ pages. Process in 30K-char windows with overlap to
  // avoid splitting an article across windows. For very large statutes the
  // CTO should add map/reduce: per-window article extraction → dedupe.
  const WINDOW = 30_000;
  const OVERLAP = 2000;
  const windows: string[] = [];
  for (let i = 0; i < fullText.length; i += WINDOW - OVERLAP) {
    windows.push(fullText.slice(i, i + WINDOW));
  }

  const seenLocators = new Set<string>();
  const allChunks: SegmentedChunk[] = [];

  for (let w = 0; w < windows.length; w++) {
    const resp = await anthropic().messages.create({
      model: MODELS.chat,
      max_tokens: 8000,
      tools: [SEGMENT_TOOL],
      tool_choice: { type: 'tool', name: 'submit_articles' },
      system: [{ type: 'text', text: SEGMENT_SYSTEM }],
      messages: [
        {
          role: 'user',
          content: `Source: ${title}\nWindow ${w + 1}/${windows.length}\n\n---\n\n${windows[w]}`,
        },
      ],
    });
    const tool = resp.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'submit_articles',
    );
    if (!tool) continue;
    const raw = tool.input as { articles: Array<{ locator: string; heading_path: string[]; body: string }> };
    for (const a of raw.articles ?? []) {
      if (seenLocators.has(a.locator)) continue;
      seenLocators.add(a.locator);
      allChunks.push({
        locator: a.locator,
        heading_path: a.heading_path ?? [],
        body: a.body,
        token_count: Math.ceil(a.body.length / 4),
        language: 'en',
      });
    }
  }
  return allChunks;
}

async function replaceChunks(admin: ReturnType<typeof createAdminClient>, sourceId: string, chunks: SegmentedChunk[]) {
  await admin.from('legal_chunks').delete().eq('source_id', sourceId);
  if (chunks.length === 0) return;
  const rows = chunks.map((c, i) => ({
    source_id: sourceId,
    ordinal: i,
    heading_path: c.heading_path,
    locator: c.locator,
    body: c.body,
    token_count: c.token_count,
    language: c.language,
  }));
  const { error } = await admin.from('legal_chunks').insert(rows);
  if (error) throw error;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
