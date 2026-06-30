import { Database } from "bun:sqlite";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";

export type CardRow = {
  citation_key: string;
  run_id: number;
  fetched_at: string;
  source_file: string;
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
  evidence: string;
  concerns: string;
  criteria: string;
  raw_llm_response: string | null;
  error: string | null;
};

export function openDb(path: string): Database {
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS verification_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      kb_dir TEXT NOT NULL,
      llm_model TEXT,
      flags TEXT
    );

    CREATE TABLE IF NOT EXISTS card_verifications (
      citation_key TEXT NOT NULL,
      run_id INTEGER NOT NULL,
      fetched_at TEXT NOT NULL,
      source_file TEXT NOT NULL,
      url TEXT,
      http_status INTEGER,
      content_type TEXT,
      body_sha256 TEXT,
      body_size INTEGER,
      is_pdf INTEGER NOT NULL DEFAULT 0,
      via_archive INTEGER NOT NULL DEFAULT 0,
      attempts INTEGER NOT NULL DEFAULT 1,
      skipped_reason TEXT,
      verdict TEXT NOT NULL,
      evidence TEXT NOT NULL,
      concerns TEXT NOT NULL,
      criteria TEXT NOT NULL,
      raw_llm_response TEXT,
      error TEXT,
      PRIMARY KEY (citation_key, run_id),
      FOREIGN KEY (run_id) REFERENCES verification_runs(id)
    );

    CREATE INDEX IF NOT EXISTS idx_card_verifications_run ON card_verifications(run_id);
    CREATE INDEX IF NOT EXISTS idx_card_verifications_verdict ON card_verifications(verdict);
  `);

  // Soft-migrate older DBs lacking new columns (ignore errors when columns already exist)
  try { db.exec(`ALTER TABLE card_verifications ADD COLUMN via_archive INTEGER NOT NULL DEFAULT 0`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE card_verifications ADD COLUMN attempts INTEGER NOT NULL DEFAULT 1`); } catch { /* exists */ }

  return db;
}

export function startRun(db: Database, kbDir: string, model: string, flags: string): number {
  const stmt = db.prepare(
    `INSERT INTO verification_runs (started_at, kb_dir, llm_model, flags) VALUES (?, ?, ?, ?)`,
  );
  const res = stmt.run(new Date().toISOString(), kbDir, model, flags);
  return Number(res.lastInsertRowid);
}

export function finishRun(db: Database, runId: number): void {
  db.prepare(`UPDATE verification_runs SET finished_at = ? WHERE id = ?`).run(
    new Date().toISOString(),
    runId,
  );
}

export function insertCardRow(db: Database, row: CardRow): void {
  db.prepare(
    `INSERT OR REPLACE INTO card_verifications (
      citation_key, run_id, fetched_at, source_file, url, http_status,
      content_type, body_sha256, body_size, is_pdf, via_archive, attempts,
      skipped_reason, verdict, evidence, concerns, criteria, raw_llm_response, error
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.citation_key,
    row.run_id,
    row.fetched_at,
    row.source_file,
    row.url,
    row.http_status,
    row.content_type,
    row.body_sha256,
    row.body_size,
    row.is_pdf,
    row.via_archive,
    row.attempts,
    row.skipped_reason,
    row.verdict,
    row.evidence,
    row.concerns,
    row.criteria,
    row.raw_llm_response,
    row.error,
  );
}

export function getPreviousCardRow(
  db: Database,
  citationKey: string,
  excludeRunId: number,
): CardRow | null {
  const row = db
    .prepare(
      `SELECT * FROM card_verifications
       WHERE citation_key = ? AND run_id <> ?
       ORDER BY run_id DESC LIMIT 1`,
    )
    .get(citationKey, excludeRunId) as CardRow | null;
  return row;
}
