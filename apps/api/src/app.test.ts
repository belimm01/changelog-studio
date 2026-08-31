import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
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
  let db: DB;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    db = createDb(':memory:');
    app = createApp({ db, apiToken: 'secret-token' });
  });

  afterEach(() => db.close());

  it('rejects writes without a bearer token', async () => {
    const res = await request(app).post('/api/changelogs').send(payload);
    expect(res.status).toBe(401);
  });

  it('rejects writes with a wrong token', async () => {
    const res = await request(app)
      .post('/api/changelogs')
      .set('Authorization', 'Bearer nope')
      .send(payload);
    expect(res.status).toBe(401);
  });

  it('accepts writes with the correct token', async () => {
    const res = await request(app)
      .post('/api/changelogs')
      .set('Authorization', 'Bearer secret-token')
      .send(payload);
    expect(res.status).toBe(201);
  });

  it('still allows reads without a token', async () => {
    const res = await request(app).get('/api/changelogs');
    expect(res.status).toBe(200);
  });
});
