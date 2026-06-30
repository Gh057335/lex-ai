/**
 * In-memory store backing the mock Supabase client.
 *
 * A single module-level instance is seeded on first access and mutated in place
 * by inserts/updates/upserts, so a user's actions (creating a matter, drafting a
 * document, generating a digest) persist for the lifetime of the server
 * instance — enough to demonstrate the full product lifecycle.
 */

import { buildSeed, type SeedStore, type Table } from './seed';

let _store: SeedStore | null = null;

export function getStore(): SeedStore {
  if (!_store) _store = buildSeed();
  return _store;
}

export function getTable(name: string): Table[] {
  const store = getStore();
  if (!store[name]) store[name] = [];
  return store[name];
}

/** Reset helper (used by tests / not in the request path). */
export function resetStore(): void {
  _store = null;
}
