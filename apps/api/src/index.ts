import { createApp } from './app.js';
import { createDb } from './db.js';

const port = Number(process.env.PORT ?? 4000);
const databasePath = process.env.DATABASE_PATH ?? './data/changelog.sqlite';
const corsOrigin = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const db = createDb(databasePath);
const app = createApp({
  db,
  corsOrigin,
  staticDir: process.env.STATIC_DIR,
  apiToken: process.env.API_TOKEN,
});

app.listen(port, () => {
  console.log(`changelog-studio api listening on http://localhost:${port}`);
});
