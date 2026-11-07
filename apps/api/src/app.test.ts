import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Changelog } from '@changelog-studio/shared';
import { createApp } from './app.js';
import { createDb, type DB } from './db.js';

describe('changelog-studio api', () => {
  let db: DB;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    db = createDb(':memory:');
    app = createApp({ db, now: () => '2026-08-31T00:00:00.000Z' });
  });

  afterEach(() => db.close());

  it('reports health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('parses a git log into markdown', async () => {
    const res = await request(app)
      .post('/api/parse')
      .send({ commits: [{ hash: 'abcdef1', subject: 'feat(ui): dark mode' }] });
    expect(res.status).toBe(200);
    expect(res.body.notes.suggestedBump).toBe('minor');
    expect(res.body.markdown).toContain('### Features');
  });

  it('rejects an empty parse request', async () => {
    const res = await request(app).post('/api/parse').send({});
    expect(res.status).toBe(400);
  });

  it('creates, reads, updates and deletes a changelog', async () => {
    const payload = {
      project: 'demo',
      version: 'v1.0.0',
      title: 'First release',
      markdown: '## v1.0.0\n\n- initial',
    };

    const created = await request(app).post('/api/changelogs').send(payload);
    expect(created.status).toBe(201);
    const { id } = created.body;

    const fetched = await request(app).get(`/api/changelogs/${id}`);
    expect(fetched.body.title).toBe('First release');
    expect(fetched.body.published).toBe(false);

    const updated = await request(app)
      .put(`/api/changelogs/${id}`)
      .send({ ...payload, title: 'First release!', published: true });
    expect(updated.body.title).toBe('First release!');
    expect(updated.body.published).toBe(true);

    const published = await request(app).get('/api/changelogs?published=true');
    expect(published.body).toHaveLength(1);

    const removed = await request(app).delete(`/api/changelogs/${id}`);
    expect(removed.status).toBe(204);

    const missing = await request(app).get(`/api/changelogs/${id}`);
    expect(missing.status).toBe(404);
  });

  it('validates changelog input', async () => {
    const res = await request(app).post('/api/changelogs').send({ project: 'demo' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });
});

describe('write authentication', () => {
  const payload = {
    project: 'demo',
    version: 'v1.0.0',
    title: 'First release',
    markdown: '## v1.0.0\n\n- initial',
  };
  const updatedPayload = {
    ...payload,
    title: 'First release!',
    published: true,
  };
  const bearer = 'Bearer secret-token';
  const wrongBearer = 'Bearer secret-tokem';
  let db: DB;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    db = createDb(':memory:');
    app = createApp({ db, apiToken: 'secret-token', now: () => '2026-08-31T00:00:00.000Z' });
  });

  afterEach(() => db.close());

  async function createChangelog() {
    const res = await request(app)
      .post('/api/changelogs')
      .set('Authorization', bearer)
      .send(payload);
    expect(res.status).toBe(201);
    return res.body;
  }

  async function expectUnauthorizedUnchanged(method: 'post' | 'put' | 'delete', token?: string) {
    const existing = method === 'post' ? undefined : await createChangelog();
    const before = await request(app).get('/api/changelogs');
    const req = request(app)[method](
      method === 'post' ? '/api/changelogs' : `/api/changelogs/${existing.id}`,
    );
    if (token) req.set('Authorization', token);
    if (method !== 'delete') req.send(method === 'post' ? payload : updatedPayload);
    const res = await req;
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
    const after = await request(app).get('/api/changelogs');
    expect(after.body).toEqual(before.body);
    if (existing) {
      const found = await request(app).get(`/api/changelogs/${existing.id}`);
      expect(found.status).toBe(200);
      expect(found.body).toEqual(existing);
    }
  }

  it.each([
    ['post', undefined],
    ['post', wrongBearer],
    ['put', undefined],
    ['put', wrongBearer],
    ['delete', undefined],
    ['delete', wrongBearer],
  ] as const)('rejects %s with %s', async (method, token) => {
    await expectUnauthorizedUnchanged(method, token);
  });

  it('accepts writes with the correct token', async () => {
    const res = await request(app)
      .post('/api/changelogs')
      .set('Authorization', bearer)
      .send(payload);
    expect(res.status).toBe(201);
  });

  it('accepts updates and deletes with the correct token', async () => {
    const created = await createChangelog();
    const updated = await request(app)
      .put(`/api/changelogs/${created.id}`)
      .set('Authorization', bearer)
      .send(updatedPayload);
    expect(updated.status).toBe(200);
    expect(updated.body.title).toBe('First release!');
    expect(updated.body.published).toBe(true);

    const removed = await request(app)
      .delete(`/api/changelogs/${created.id}`)
      .set('Authorization', bearer);
    expect(removed.status).toBe(204);

    const missing = await request(app).get(`/api/changelogs/${created.id}`);
    expect(missing.status).toBe(404);
  });

  it('still allows reads and parsing without a token', async () => {
    const reads = await request(app).get('/api/changelogs');
    expect(reads.status).toBe(200);

    const parsed = await request(app)
      .post('/api/parse')
      .send({ commits: [{ hash: 'abcdef1', subject: 'fix(api): auth boundary' }] });
    expect(parsed.status).toBe(200);
    expect(parsed.body.markdown).toContain('Bug Fixes');
  });
});

describe('changelog listing and filtering', () => {
  const bearer = 'Bearer secret-token';
  let db: DB;
  let app: ReturnType<typeof createApp>;
  let clock: number;

  beforeEach(() => {
    db = createDb(':memory:');
    clock = 0;
    app = createApp({
      db,
      apiToken: 'secret-token',
      now: () => new Date(Date.UTC(2026, 0, 1, 0, 0, clock++)).toISOString(),
    });
  });

  afterEach(() => db.close());

  async function seed(entry: { project: string; version: string; published?: boolean }) {
    const res = await request(app)
      .post('/api/changelogs')
      .set('Authorization', bearer)
      .send({
        project: entry.project,
        version: entry.version,
        title: `${entry.project} ${entry.version}`,
        markdown: `## ${entry.version}\n\n- ${entry.project}`,
        published: entry.published ?? false,
      });
    expect(res.status).toBe(201);
    return res.body;
  }

  function labels(body: Changelog[]): string[] {
    return body.map((c) => `${c.project}:${c.version}`);
  }

  it('filters to a single project and orders newest first', async () => {
    await seed({ project: 'alpha', version: 'v1' });
    await seed({ project: 'beta', version: 'v1' });
    await seed({ project: 'alpha', version: 'v2' });

    const res = await request(app).get('/api/changelogs?project=alpha');
    expect(res.status).toBe(200);
    expect(labels(res.body)).toEqual(['alpha:v2', 'alpha:v1']);
    expect(res.body.every((c: Changelog) => c.project === 'alpha')).toBe(true);
  });

  it('returns published and unpublished entries by default, newest first', async () => {
    await seed({ project: 'alpha', version: 'v1', published: true });
    await seed({ project: 'alpha', version: 'v2', published: false });

    const res = await request(app).get('/api/changelogs');
    expect(res.status).toBe(200);
    expect(labels(res.body)).toEqual(['alpha:v2', 'alpha:v1']);
    expect(res.body.map((c: Changelog) => c.published)).toEqual([false, true]);
  });

  it('restricts to published entries across every project', async () => {
    await seed({ project: 'alpha', version: 'v1', published: true });
    await seed({ project: 'beta', version: 'v1', published: false });
    await seed({ project: 'beta', version: 'v2', published: true });

    const res = await request(app).get('/api/changelogs?published=true');
    expect(res.status).toBe(200);
    expect(labels(res.body)).toEqual(['beta:v2', 'alpha:v1']);
  });

  it('combines the project and published filters', async () => {
    await seed({ project: 'alpha', version: 'v1', published: true });
    await seed({ project: 'alpha', version: 'v2', published: false });
    await seed({ project: 'beta', version: 'v1', published: true });

    const res = await request(app).get('/api/changelogs?project=alpha&published=true');
    expect(res.status).toBe(200);
    expect(labels(res.body)).toEqual(['alpha:v1']);
  });

  it('returns an empty array for a project with no changelogs', async () => {
    await seed({ project: 'alpha', version: 'v1' });

    const res = await request(app).get('/api/changelogs?project=ghost');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
