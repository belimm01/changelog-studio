import type { Changelog, ChangelogInput, ReleaseNotes } from '@changelog-studio/shared';

const BASE = '/api';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export interface ParseResult {
  notes: ReleaseNotes;
  markdown: string;
}

export const api = {
  parse(gitLog: string): Promise<ParseResult> {
    return fetch(`${BASE}/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gitLog }),
    }).then(json<ParseResult>);
  },

  listChangelogs(): Promise<Changelog[]> {
    return fetch(`${BASE}/changelogs`).then(json<Changelog[]>);
  },

  createChangelog(input: ChangelogInput): Promise<Changelog> {
    return fetch(`${BASE}/changelogs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }).then(json<Changelog>);
  },

  deleteChangelog(id: string): Promise<void> {
    return fetch(`${BASE}/changelogs/${id}`, { method: 'DELETE' }).then((res) => {
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
    });
  },
};
