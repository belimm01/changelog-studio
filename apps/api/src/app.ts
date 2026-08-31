import { existsSync } from 'node:fs';
import { join } from 'node:path';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { ZodError } from 'zod';
import {
  changelogInputSchema,
  parseCommits,
  parseGitLog,
  parseRequestSchema,
  renderMarkdown,
} from '@changelog-studio/shared';
import { bearerAuth } from './auth.js';
import type { DB } from './db.js';
import { ChangelogRepository } from './repository.js';

export interface AppOptions {
  db: DB;
  corsOrigin?: string[];
  now?: () => string;
  staticDir?: string;
  apiToken?: string;
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function createApp({
  db,
  corsOrigin,
  now = () => new Date().toISOString(),
  staticDir,
  apiToken,
}: AppOptions) {
  const app = express();
  const repo = new ChangelogRepository(db);
  const requireAuth = bearerAuth(apiToken);

  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  // In production the SPA is served same-origin by this API, so CORS only
  // applies to explicit cross-origin API clients; lock it down with CORS_ORIGIN.
  app.use(cors({ origin: corsOrigin && corsOrigin.length ? corsOrigin : true }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/parse', (req, res) => {
    const { gitLog, commits } = parseRequestSchema.parse(req.body);
    const raw = commits ?? parseGitLog(gitLog ?? '');
    const notes = parseCommits(raw);
    res.json({ notes, markdown: renderMarkdown(notes) });
  });

  app.get('/api/changelogs', (req, res) => {
    const project = typeof req.query.project === 'string' ? req.query.project : undefined;
    const publishedOnly = req.query.published === 'true';
    res.json(repo.list({ project, publishedOnly }));
  });

  app.get('/api/changelogs/:id', (req, res) => {
    const found = repo.get(req.params.id);
    if (!found) throw new HttpError(404, 'Changelog not found');
    res.json(found);
  });

  app.post('/api/changelogs', requireAuth, (req, res) => {
    const input = changelogInputSchema.parse(req.body);
    res.status(201).json(repo.create(input, now()));
  });

  app.put<{ id: string }>('/api/changelogs/:id', requireAuth, (req, res) => {
    const input = changelogInputSchema.parse(req.body);
    const updated = repo.update(req.params.id, input, now());
    if (!updated) throw new HttpError(404, 'Changelog not found');
    res.json(updated);
  });

  app.delete<{ id: string }>('/api/changelogs/:id', requireAuth, (req, res) => {
    if (!repo.remove(req.params.id)) throw new HttpError(404, 'Changelog not found');
    res.status(204).end();
  });

  if (staticDir && existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(join(staticDir, 'index.html'));
    });
  }

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', issues: err.issues });
    }
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
