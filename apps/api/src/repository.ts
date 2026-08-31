import { nanoid } from 'nanoid';
import type { Changelog, ChangelogInput } from '@changelog-studio/shared';
import type { DB } from './db.js';

interface Row {
  id: string;
  project: string;
  version: string;
  title: string;
  markdown: string;
  published: number;
  created_at: string;
  updated_at: string;
}

function toChangelog(row: Row): Changelog {
  return {
    id: row.id,
    project: row.project,
    version: row.version,
    title: row.title,
    markdown: row.markdown,
    published: row.published === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ChangelogRepository {
  constructor(private readonly db: DB) {}

  list(opts: { project?: string; publishedOnly?: boolean } = {}): Changelog[] {
    const clauses: string[] = [];
    const params: string[] = [];
    if (opts.project) {
      clauses.push('project = ?');
      params.push(opts.project);
    }
    if (opts.publishedOnly) clauses.push('published = 1');
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = this.db
      .prepare(`SELECT * FROM changelogs ${where} ORDER BY created_at DESC`)
      .all(...params) as unknown as Row[];
    return rows.map(toChangelog);
  }

  get(id: string): Changelog | null {
    const row = this.db.prepare('SELECT * FROM changelogs WHERE id = ?').get(id) as
      | Row
      | undefined;
    return row ? toChangelog(row) : null;
  }

  create(input: ChangelogInput, now: string): Changelog {
    const id = nanoid(12);
    this.db
      .prepare(
        `INSERT INTO changelogs (id, project, version, title, markdown, published, created_at, updated_at)
         VALUES (@id, @project, @version, @title, @markdown, @published, @createdAt, @updatedAt)`,
      )
      .run({
        id,
        project: input.project,
        version: input.version,
        title: input.title,
        markdown: input.markdown,
        published: input.published ? 1 : 0,
        createdAt: now,
        updatedAt: now,
      });
    return this.get(id)!;
  }

  update(id: string, input: ChangelogInput, now: string): Changelog | null {
    const result = this.db
      .prepare(
        `UPDATE changelogs
         SET project = @project, version = @version, title = @title,
             markdown = @markdown, published = @published, updated_at = @updatedAt
         WHERE id = @id`,
      )
      .run({
        id,
        project: input.project,
        version: input.version,
        title: input.title,
        markdown: input.markdown,
        published: input.published ? 1 : 0,
        updatedAt: now,
      });
    return Number(result.changes) > 0 ? this.get(id) : null;
  }

  remove(id: string): boolean {
    const result = this.db.prepare('DELETE FROM changelogs WHERE id = ?').run(id);
    return Number(result.changes) > 0;
  }
}
