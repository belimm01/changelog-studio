import type { Changelog, ChangelogInput, ReleaseNotes } from '@changelog-studio/shared';

const BASE = '/api';
const TOKEN_KEY = 'changelog-studio:token';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function getToken(): string {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem(TOKEN_KEY) ?? '';
}

export function setToken(token: string): void {
  if (typeof localStorage === 'undefined') return;
  const trimmed = token.trim();
  if (trimmed) localStorage.setItem(TOKEN_KEY, trimmed);
  else localStorage.removeItem(TOKEN_KEY);
}

function writeHeaders(): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export interface ParseResult {
  notes: ReleaseNotes;
  markdown: string;
}

export interface ListQuery {
  project?: string;
  publishedOnly?: boolean;
}

export const api = {
  parse(gitLog: string): Promise<ParseResult> {
    return fetch(`${BASE}/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gitLog }),
    }).then(json<ParseResult>);
  },

  listChangelogs(query: ListQuery = {}): Promise<Changelog[]> {
    const params = new URLSearchParams();
    if (query.project) params.set('project', query.project);
    if (query.publishedOnly) params.set('published', 'true');
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return fetch(`${BASE}/changelogs${suffix}`).then(json<Changelog[]>);
  },

  getChangelog(id: string): Promise<Changelog> {
    return fetch(`${BASE}/changelogs/${id}`).then(json<Changelog>);
  },

  createChangelog(input: ChangelogInput): Promise<Changelog> {
    return fetch(`${BASE}/changelogs`, {
      method: 'POST',
      headers: writeHeaders(),
      body: JSON.stringify(input),
    }).then(json<Changelog>);
  },

  updateChangelog(id: string, input: ChangelogInput): Promise<Changelog> {
    return fetch(`${BASE}/changelogs/${id}`, {
      method: 'PUT',
      headers: writeHeaders(),
      body: JSON.stringify(input),
    }).then(json<Changelog>);
  },

  deleteChangelog(id: string): Promise<void> {
    return fetch(`${BASE}/changelogs/${id}`, {
      method: 'DELETE',
      headers: writeHeaders(),
    }).then((res) => {
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
    });
  },
};
