import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { createDb, type DB } from './db.js';

describe('persistence failures', () => {
  const payload = {
    project: 'demo',
    version: 'v1.0.0',
    title: 'First release',
    markdown: '## v1.0.0\n\n- initial',
  };
  const updatedPayload = { ...payload, title: 'Updated release', published: true };
  let db: DB;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    db = createDb(':memory:');
    app = createApp({ db, apiToken: 'test-token', now: () => '2026-08-31T00:00:00.000Z' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    db.close();
  });

  it.each(['post', 'put', 'delete'] as const)(
    'returns a safe error for a rejected %s and allows retry after recovery',
    async (method) => {
      const created = await request(app)
        .post('/api/changelogs')
        .set('Authorization', 'Bearer test-token')
        .send(payload);
      expect(created.status).toBe(201);
      const before = await request(app).get('/api/changelogs');
      expect(before.status).toBe(200);
      expect(before.body).toEqual([created.body]);

      const path = method === 'post' ? '/api/changelogs' : `/api/changelogs/${created.body.id}`;
      const mutate = () => {
        const req = request(app)[method](path).set('Authorization', 'Bearer test-token');
        return method === 'delete' ? req : req.send(method === 'post' ? payload : updatedPayload);
      };
      const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      db.exec('PRAGMA query_only = ON');

      const failed = await mutate();
      expect(failed.status).toBe(500);
      expect(failed.headers['content-type']).toContain('application/json');
      expect(failed.body).toEqual({ error: 'Internal server error' });
      expect(logged).toHaveBeenCalledTimes(1);
      expect(logged).toHaveBeenCalledWith(expect.objectContaining({ errcode: 8 }));

      const unchanged = await request(app).get('/api/changelogs');
      expect(unchanged.status).toBe(200);
      expect(unchanged.body).toEqual(before.body);
      const existing = await request(app).get(`/api/changelogs/${created.body.id}`);
      expect(existing.status).toBe(200);
      expect(existing.body).toEqual(created.body);

      db.exec('PRAGMA query_only = OFF');
      const retried = await mutate();
      expect(retried.status).toBe(method === 'post' ? 201 : method === 'put' ? 200 : 204);
      const after = await request(app).get('/api/changelogs');
      expect(after.status).toBe(200);
      if (method === 'post') {
        expect(retried.body.id).not.toBe(created.body.id);
        expect(retried.body).toMatchObject(payload);
        expect(after.body).toHaveLength(2);
        expect(after.body).toEqual(expect.arrayContaining([created.body, retried.body]));
      } else if (method === 'put') {
        expect(retried.body).toMatchObject({ ...updatedPayload, id: created.body.id });
        expect(after.body).toEqual([retried.body]);
      } else {
        expect(after.body).toEqual([]);
        expect((await request(app).get(`/api/changelogs/${created.body.id}`)).status).toBe(404);
      }
      expect(logged).toHaveBeenCalledTimes(1);
    },
  );
});
