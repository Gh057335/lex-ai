/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Mock Supabase client.
 *
 * Implements the subset of the PostgREST query-builder surface the app uses,
 * operating against the in-memory store. It is intentionally faithful to the
 * `@supabase/supabase-js` shape — chainable, thenable, returns `{ data, error }`
 * — so pages and server actions need ZERO changes between demo and live mode.
 *
 * Supported: from().select() (with embedded resources & counts), eq/in/gte,
 * order (multi-key), limit, single/maybeSingle, textSearch, insert/update/upsert,
 * and auth.admin.listUsers/createUser.
 */

import { randomUUID } from 'node:crypto';
import { getTable } from './store';

type Row = Record<string, any>;

// --- relationship registry -------------------------------------------------

interface RelDef { table: string; type: 'one' | 'many'; local: string; foreign: string }
const one = (table: string, local: string, foreign: string): RelDef => ({ table, type: 'one', local, foreign });
const many = (table: string, local: string, foreign: string): RelDef => ({ table, type: 'many', local, foreign });

const REGISTRY: Record<string, Record<string, RelDef>> = {
  contracts: { matters: one('matters', 'matter_id', 'id') },
  matters: { workspaces: one('workspaces', 'workspace_id', 'id') },
  workspaces: { matters: many('matters', 'id', 'workspace_id') },
  memberships: { profiles: one('profiles', 'user_id', 'id') },
  legal_chunks: { legal_sources: one('legal_sources', 'source_id', 'id') },
  regulatory_events: { legal_sources: one('legal_sources', 'source_id', 'id') },
  contract_versions: { clauses: many('clauses', 'id', 'contract_version_id') },
  clauses: { clause_citations: many('clause_citations', 'id', 'clause_id') },
  clause_citations: { legal_sources: one('legal_sources', 'source_id', 'id') },
};

// --- insert defaults -------------------------------------------------------

const INSERT_DEFAULTS: Record<string, Row> = {
  matters: { status: 'active', parties: [], is_sharia: false, jurisdictions: [], sectors: [] },
  contracts: { current_version_id: null, source_file_path: null },
  workspaces: { enabled_sectors: [], enabled_jurisdictions: [] },
};

// --- select parsing --------------------------------------------------------

interface ParsedSelect { columns: string[]; relations: Array<{ name: string; sub: ParsedSelect }> }

function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of input) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { parts.push(current); current = ''; }
    else current += ch;
  }
  if (current.trim()) parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function parseSelect(str: string): ParsedSelect {
  const columns: string[] = [];
  const relations: ParsedSelect['relations'] = [];
  for (const token of splitTopLevel(str.replace(/\s+/g, ' '))) {
    const paren = token.indexOf('(');
    if (paren === -1) {
      columns.push(token.trim());
    } else {
      const name = token.slice(0, paren).split('!')[0].trim();
      const inside = token.slice(paren + 1, token.lastIndexOf(')'));
      relations.push({ name, sub: parseSelect(inside) });
    }
  }
  return { columns, relations };
}

function clone<T>(v: T): T {
  if (v === null || typeof v !== 'object') return v;
  return structuredClone(v);
}

function resolveOne(def: RelDef, row: Row): Row | undefined {
  return getTable(def.table).find((t) => t[def.foreign] === row[def.local]);
}

function project(row: Row, table: string, sel: ParsedSelect): Row {
  const out: Row = {};
  if (sel.columns.includes('*')) Object.assign(out, clone(row));
  else for (const col of sel.columns) out[col] = clone(row[col]);

  for (const rel of sel.relations) {
    const def = REGISTRY[table]?.[rel.name];
    if (!def) { out[rel.name] = null; continue; }
    if (def.type === 'one') {
      const target = resolveOne(def, row);
      out[rel.name] = target ? project(target, def.table, rel.sub) : null;
    } else {
      const targets = getTable(def.table).filter((t) => t[def.foreign] === row[def.local]);
      const isCount = rel.sub.columns.length === 1 && rel.sub.columns[0] === 'count' && rel.sub.relations.length === 0;
      out[rel.name] = isCount
        ? [{ count: targets.length }]
        : targets.map((t) => project(t, def.table, rel.sub));
    }
  }
  return out;
}

// --- filters ---------------------------------------------------------------

interface Filter { type: 'eq' | 'in' | 'gte' | 'text'; col: string; val: any }

function valueFor(row: Row, table: string, col: string): any {
  if (!col.includes('.')) return row[col];
  const [relName, relCol] = col.split('.');
  const def = REGISTRY[table]?.[relName];
  if (!def) return undefined;
  const target = resolveOne(def, row);
  return target ? target[relCol] : undefined;
}

function matchText(row: Row, query: string): boolean {
  const tokens = query.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  if (tokens.length === 0) return true;
  const hay = String(row.body ?? JSON.stringify(row)).toLowerCase();
  return tokens.some((t) => hay.includes(t));
}

function passes(row: Row, table: string, f: Filter): boolean {
  if (f.type === 'text') return matchText(row, f.val);
  const value = valueFor(row, table, f.col);
  if (f.type === 'eq') return value === f.val;
  if (f.type === 'in') return Array.isArray(f.val) && f.val.includes(value);
  if (f.type === 'gte') return value != null && value >= f.val;
  return true;
}

// --- read query builder ----------------------------------------------------

class QueryBuilder {
  private filters: Filter[] = [];
  private orders: Array<{ column: string; ascending: boolean }> = [];
  private limitN: number | null = null;
  private parsed: ParsedSelect = { columns: ['*'], relations: [] };
  private wantCount = false;
  private headOnly = false;
  private mode: 'many' | 'single' | 'maybeSingle' = 'many';

  constructor(private readonly table: string) {}

  select(columns = '*', opts?: { count?: string; head?: boolean }): this {
    this.parsed = parseSelect(columns || '*');
    if (opts?.count) this.wantCount = true;
    if (opts?.head) this.headOnly = true;
    return this;
  }
  eq(col: string, val: any): this { this.filters.push({ type: 'eq', col, val }); return this; }
  in(col: string, val: any[]): this { this.filters.push({ type: 'in', col, val }); return this; }
  gte(col: string, val: any): this { this.filters.push({ type: 'gte', col, val }); return this; }
  textSearch(_col: string, query: string): this { this.filters.push({ type: 'text', col: _col, val: query }); return this; }
  order(column: string, opts?: { ascending?: boolean }): this {
    this.orders.push({ column, ascending: opts?.ascending ?? true });
    return this;
  }
  limit(n: number): this { this.limitN = n; return this; }
  single(): this { this.mode = 'single'; return this; }
  maybeSingle(): this { this.mode = 'maybeSingle'; return this; }

  private run(): { data: any; error: any; count?: number } {
    let rows = getTable(this.table).filter((r) => this.filters.every((f) => passes(r, this.table, f)));
    const count = rows.length;

    if (this.orders.length) {
      rows = [...rows].sort((a, b) => {
        for (const { column, ascending } of this.orders) {
          const av = a[column], bv = b[column];
          if (av === bv) continue;
          if (av == null) return ascending ? -1 : 1;
          if (bv == null) return ascending ? 1 : -1;
          return (av < bv ? -1 : 1) * (ascending ? 1 : -1);
        }
        return 0;
      });
    }
    if (this.limitN != null) rows = rows.slice(0, this.limitN);

    if (this.headOnly) return { data: null, error: null, count };
    const data = rows.map((r) => project(r, this.table, this.parsed));

    if (this.mode === 'single') {
      if (data.length === 0) return { data: null, error: { message: 'No rows found' } };
      return { data: data[0], error: null, ...(this.wantCount ? { count } : {}) };
    }
    if (this.mode === 'maybeSingle') return { data: data[0] ?? null, error: null };
    return { data, error: null, ...(this.wantCount ? { count } : {}) };
  }

  then(resolve: (v: any) => void, reject?: (e: any) => void): void {
    try { resolve(this.run()); } catch (e) { reject?.(e); }
  }
}

// --- write builders --------------------------------------------------------

function applyInsertDefaults(table: string, row: Row): Row {
  const withId: Row = { id: row.id ?? randomUUID(), ...INSERT_DEFAULTS[table], ...row };
  const nowIso = new Date().toISOString();
  if (withId.created_at === undefined) withId.created_at = nowIso;
  if (withId.updated_at === undefined) withId.updated_at = nowIso;
  return withId;
}

class InsertBuilder {
  private inserted: Row[];
  private parsed: ParsedSelect | null = null;
  private mode: 'many' | 'single' | 'maybeSingle' = 'many';

  constructor(private readonly table: string, values: Row | Row[]) {
    const rows = Array.isArray(values) ? values : [values];
    this.inserted = rows.map((r) => applyInsertDefaults(table, r));
    getTable(table).push(...this.inserted);
  }
  select(columns = '*'): this { this.parsed = parseSelect(columns || '*'); return this; }
  single(): this { this.mode = 'single'; return this; }
  maybeSingle(): this { this.mode = 'maybeSingle'; return this; }

  private run(): { data: any; error: any } {
    if (!this.parsed) return { data: null, error: null };
    const data = this.inserted.map((r) => project(r, this.table, this.parsed!));
    if (this.mode === 'single') return { data: data[0] ?? null, error: data.length ? null : { message: 'No rows' } };
    if (this.mode === 'maybeSingle') return { data: data[0] ?? null, error: null };
    return { data, error: null };
  }
  then(resolve: (v: any) => void, reject?: (e: any) => void): void {
    try { resolve(this.run()); } catch (e) { reject?.(e); }
  }
}

class UpdateBuilder {
  private filters: Filter[] = [];
  constructor(private readonly table: string, private readonly values: Row) {}
  eq(col: string, val: any): this { this.filters.push({ type: 'eq', col, val }); return this; }
  in(col: string, val: any[]): this { this.filters.push({ type: 'in', col, val }); return this; }

  private run(): { data: any; error: any } {
    const nowIso = new Date().toISOString();
    for (const row of getTable(this.table)) {
      if (this.filters.every((f) => passes(row, this.table, f))) {
        Object.assign(row, this.values);
        if ('updated_at' in row) row.updated_at = nowIso;
      }
    }
    return { data: null, error: null };
  }
  then(resolve: (v: any) => void, reject?: (e: any) => void): void {
    try { resolve(this.run()); } catch (e) { reject?.(e); }
  }
}

class UpsertBuilder {
  private result: { data: any; error: any };
  constructor(table: string, values: Row | Row[], opts?: { onConflict?: string }) {
    const keys = (opts?.onConflict ?? 'id').split(',').map((k) => k.trim());
    const rows = Array.isArray(values) ? values : [values];
    const tbl = getTable(table);
    for (const incoming of rows) {
      const existing = tbl.find((r) => keys.every((k) => r[k] === incoming[k]));
      if (existing) Object.assign(existing, incoming);
      else tbl.push(applyInsertDefaults(table, incoming));
    }
    this.result = { data: null, error: null };
  }
  then(resolve: (v: any) => void, reject?: (e: any) => void): void {
    try { resolve(this.result); } catch (e) { reject?.(e); }
  }
}

// --- table + client --------------------------------------------------------

class TableHandle {
  constructor(private readonly table: string) {}
  select(columns?: string, opts?: { count?: string; head?: boolean }) {
    return new QueryBuilder(this.table).select(columns, opts);
  }
  insert(values: Row | Row[]) { return new InsertBuilder(this.table, values); }
  update(values: Row) { return new UpdateBuilder(this.table, values); }
  upsert(values: Row | Row[], opts?: { onConflict?: string }) { return new UpsertBuilder(this.table, values, opts); }
}

const authAdmin = {
  async listUsers(_opts?: { perPage?: number }) {
    const users = getTable('profiles').map((p) => ({ id: p.id, email: p.email }));
    return { data: { users }, error: null };
  },
  async createUser(attrs: { email?: string; user_metadata?: Row }) {
    const id = randomUUID();
    const profile = {
      id, email: attrs.email ?? `${id}@lexai.local`,
      full_name: attrs.user_metadata?.full_name ?? null, avatar_url: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    getTable('profiles').push(profile);
    return { data: { user: { id, email: profile.email } }, error: null };
  },
};

export function createMockClient() {
  return {
    from(table: string) { return new TableHandle(table); },
    auth: { admin: authAdmin },
  };
}
