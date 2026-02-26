/**
 * Cliente SQLite via @libsql/client (pure JS/WASM — sem dependências nativas).
 * Usado apenas no servidor (Server Actions / Route Handlers).
 * Nunca importar em componentes 'use client'.
 */
import { createClient, type Client } from '@libsql/client'

let _client: Client | null = null

export function getDb(): Client {
  if (!_client) {
    _client = createClient({ url: 'file:./data.db' })
  }
  return _client
}

export async function initDb(): Promise<void> {
  const db = getDb()

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS flows (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      active     INTEGER NOT NULL DEFAULT 0,
      version    INTEGER NOT NULL DEFAULT 1,
      data       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS test_emails (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id    TEXT,
      direction    TEXT NOT NULL DEFAULT 'outbound',
      from_address TEXT NOT NULL DEFAULT 'flow@sistema.com',
      to_address   TEXT NOT NULL,
      subject      TEXT NOT NULL,
      body_html    TEXT,
      in_reply_to  INTEGER,
      sent_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS flow_runs (
      id           TEXT PRIMARY KEY,
      flow_id      TEXT NOT NULL,
      flow_name    TEXT NOT NULL DEFAULT '',
      contact      TEXT NOT NULL DEFAULT '{}',
      status       TEXT NOT NULL DEFAULT 'running',
      current_node TEXT,
      wait_label   TEXT,
      context      TEXT NOT NULL DEFAULT '{}',
      log          TEXT NOT NULL DEFAULT '[]',
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // Migrações para test_emails legado (adiciona colunas se não existirem)
  for (const col of [
    "ALTER TABLE test_emails ADD COLUMN thread_id TEXT",
    "ALTER TABLE test_emails ADD COLUMN direction TEXT NOT NULL DEFAULT 'outbound'",
    "ALTER TABLE test_emails ADD COLUMN from_address TEXT NOT NULL DEFAULT 'flow@sistema.com'",
    "ALTER TABLE test_emails ADD COLUMN in_reply_to INTEGER",
  ]) {
    try { await db.execute(col) } catch { /* já existe */ }
  }
}
