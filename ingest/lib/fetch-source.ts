import { createHash } from "node:crypto";
import { extractText, getDocumentProxy } from "unpdf";

export type FetchResult = {
  url: string;
  ok: boolean;
  status: number | null;
  content_type: string | null;
  final_url: string | null;
  body_size: number;
  body_sha256: string | null;
  text: string;
  is_pdf: boolean;
  error: string | null;
  fetched_at: string;
  via_archive: boolean;
  attempts: number;
};

const UA_BROWSER =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const UA_HONEST =
  "LEXAI-KB-Verifier/0.2 (+https://github.com/lexai; legal knowledge base verification)";

const MAX_BODY_BYTES = 8 * 1024 * 1024; // 8 MiB cap (raised for PDFs)
const MAX_TEXT_CHARS = 40_000;
const FETCH_TIMEOUT_MS = 30_000;
const ARCHIVE_TIMEOUT_MS = 15_000;

export async function fetchSource(url: string): Promise<FetchResult> {
  const fetchedAt = new Date().toISOString();
  // 1st attempt: honest UA
  let result = await fetchOnce(url, UA_HONEST, fetchedAt, 1);
  if (result.ok && result.text.length > 0) return result;

  // 2nd attempt for 403/blocked/empty: browser UA
  if (result.status === 403 || result.status === 401 || result.text.length === 0 || result.error === "timeout") {
    const second = await fetchOnce(url, UA_BROWSER, fetchedAt, 2);
    if (second.ok && (second.text.length > 0 || second.is_pdf)) return { ...second, attempts: 2 };
    result = second.error || !second.ok ? { ...second, attempts: 2 } : second;
  }

  // 429: wait + retry once
  if (result.status === 429) {
    await sleep(2500);
    const third = await fetchOnce(url, UA_BROWSER, fetchedAt, 3);
    if (third.ok) return { ...third, attempts: 3 };
  }

  // 3rd attempt: archive.org wayback for dead/blocked URLs
  if (result.status === 404 || result.status === 410 || result.error?.includes("ENOTFOUND") || result.error?.includes("ECONNREFUSED")) {
    const archived = await fetchFromArchive(url, fetchedAt);
    if (archived) return { ...archived, attempts: result.attempts + 1 };
  }

  return result;
}

async function fetchOnce(url: string, ua: string, fetchedAt: string, attempts: number): Promise<FetchResult> {
  const empty: FetchResult = {
    url,
    ok: false,
    status: null,
    content_type: null,
    final_url: null,
    body_size: 0,
    body_sha256: null,
    text: "",
    is_pdf: false,
    error: null,
    fetched_at: fetchedAt,
    via_archive: false,
    attempts,
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": ua,
        Accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,application/xml;q=0.8,*/*;q=0.5",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8,ar;q=0.7,pt;q=0.6,it;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timer);
    const contentType = res.headers.get("content-type")?.toLowerCase() ?? null;
    const isPdf = !!contentType?.includes("application/pdf") || (res.url.toLowerCase().split("?")[0].endsWith(".pdf"));
    const buf = await readCapped(res, MAX_BODY_BYTES);
    const sha = createHash("sha256").update(buf).digest("hex");
    let text = "";
    if (isPdf) {
      text = await extractPdfText(buf);
    } else {
      const decoded = decodeBody(buf, contentType);
      text = htmlToText(decoded).slice(0, MAX_TEXT_CHARS);
    }
    return {
      url,
      ok: res.ok,
      status: res.status,
      content_type: contentType,
      final_url: res.url,
      body_size: buf.byteLength,
      body_sha256: sha,
      text,
      is_pdf: isPdf,
      error: res.ok ? null : `http_${res.status}`,
      fetched_at: fetchedAt,
      via_archive: false,
      attempts,
    };
  } catch (err) {
    clearTimeout(timer);
    const isAbort = err instanceof Error && err.name === "AbortError";
    return {
      ...empty,
      error: isAbort ? "timeout" : err instanceof Error ? `${err.name}:${err.message}` : String(err),
    };
  }
}

async function fetchFromArchive(url: string, fetchedAt: string): Promise<FetchResult | null> {
  const apiUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ARCHIVE_TIMEOUT_MS);
  try {
    const meta = await fetch(apiUrl, {
      headers: { "User-Agent": UA_HONEST, Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!meta.ok) return null;
    const data = (await meta.json()) as { archived_snapshots?: { closest?: { url?: string } } };
    const snap = data.archived_snapshots?.closest?.url;
    if (!snap) return null;
    const snapped = await fetchOnce(snap, UA_HONEST, fetchedAt, 4);
    if (!snapped.ok) return null;
    return { ...snapped, via_archive: true, error: null };
  } catch {
    clearTimeout(timer);
    return null;
  }
}

async function extractPdfText(buf: Uint8Array): Promise<string> {
  try {
    const doc = await getDocumentProxy(buf);
    const { text } = await extractText(doc, { mergePages: true });
    const joined = Array.isArray(text) ? text.join("\n") : text;
    return joined.slice(0, MAX_TEXT_CHARS);
  } catch (err) {
    return `[pdf-extract-error:${err instanceof Error ? err.message : String(err)}]`;
  }
}

async function readCapped(res: Response, max: number): Promise<Uint8Array> {
  const reader = res.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > max) {
      chunks.push(value.subarray(0, value.byteLength - (total - max)));
      try {
        await reader.cancel();
      } catch {
        // ignore
      }
      break;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(Math.min(total, max));
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

function decodeBody(buf: Uint8Array, contentType: string | null): string {
  let charset = "utf-8";
  if (contentType) {
    const m = contentType.match(/charset=([^;\s]+)/i);
    if (m) charset = m[1].toLowerCase().replace(/['"]/g, "");
  }
  try {
    return new TextDecoder(charset, { fatal: false }).decode(buf);
  } catch {
    return new TextDecoder("utf-8", { fatal: false }).decode(buf);
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, idx: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  let done = 0;
  const total = items.length;
  const workers = Array.from({ length: Math.min(limit, total) }, async () => {
    while (cursor < total) {
      const idx = cursor++;
      results[idx] = await fn(items[idx], idx);
      done++;
      onProgress?.(done, total);
    }
  });
  await Promise.all(workers);
  return results;
}
