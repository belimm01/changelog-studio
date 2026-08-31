import { existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';

// Loaded via require so bundlers/test runners don't try to resolve the
// node:sqlite builtin through their own module graph.
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

export type DB = import('node:sqlite').DatabaseSync;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS changelogs (
    id         TEXT PRIMARY KEY,
    project    TEXT NOT NULL,
    version    TEXT NOT NULL,
    title      TEXT NOT NULL,
    markdown   TEXT NOT NULL,
    published  INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_changelogs_project ON changelogs (project);
  CREATE INDEX IF NOT EXISTS idx_changelogs_published ON changelogs (published);
`;

export function createDb(path: string): DB {
  if (path !== ':memory:') {
    const dir = dirname(path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}
