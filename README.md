# Changelog Studio

[![CI](https://github.com/belimm01/changelog-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/belimm01/changelog-studio/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![License: MIT](https://img.shields.io/badge/license-MIT-green)

Turn raw git commits into polished, categorized release notes. Paste a git log,
get grouped Conventional-Commit sections, a suggested semver bump, and
publish-ready Markdown — then keep a public feed of everything you've shipped.

> A small, deliberately full-stack project: a well-tested domain core, a typed
> REST API, and a React client, wired together in a TypeScript monorepo.

## Why it exists

Release notes are usually either hand-written (slow, inconsistent) or a raw
`git log` dump (noisy). Changelog Studio sits in between: it parses
[Conventional Commits](https://www.conventionalcommits.org/), groups them by
type, flags breaking changes, and suggests the right version bump — while
leaving you in control of the final copy.

## Features

- **Commit parser** — Conventional-Commit subjects, scopes, `!` and
  `BREAKING CHANGE:` footers, with unknown types collapsed into *Other*.
- **Semver suggestion** — derives `major` / `minor` / `patch` from the batch.
- **Markdown generation** — GitHub-flavored output, breaking changes first.
- **Instant preview** — the shared parser runs in the browser, so the rendered
  release notes update as you type, offline, with no API round-trip.
- **Release feed** — browse, search, and filter published changelogs, each with
  its own permalink; copy or download any release as Markdown.
- **Edit + publish** — create or update entries through the API, with an
  optional Bearer token kept in local storage for locked-down deployments.
- **Themeable** — dark and light themes with system-preference detection.

## Architecture

```
changelog-studio/            npm workspaces monorepo
├── packages/shared/         framework-free domain core (parser + zod types)
├── apps/api/                Express + node:sqlite REST API
└── apps/web/                React + Vite client
```

The domain logic lives in `packages/shared` with **zero framework
dependencies**, so it is trivially unit-testable and reused verbatim by both the
API and the web client. The API is a thin transport layer over that core; the
web app is a thin view over the API.

```
 ┌──────────┐   POST /api/parse    ┌──────────┐   parseCommits()   ┌──────────┐
 │  React   │ ───────────────────▶ │  Express │ ─────────────────▶ │  shared  │
 │  client  │ ◀─────────────────── │   API    │ ◀───────────────── │  parser  │
 └──────────┘   notes + markdown   └────┬─────┘                    └──────────┘
                                        │ node:sqlite
                                   ┌────▼─────┐
                                   │  SQLite  │
                                   └──────────┘
```

## Tech stack

| Layer    | Choices                                             |
| -------- | --------------------------------------------------- |
| Language | TypeScript (strict), ESM                            |
| Core     | Zod for schema/validation, plain functions          |
| API      | Express, `node:sqlite`, Vitest + supertest          |
| Web      | React 18, React Router, Vite                         |
| Tooling  | npm workspaces, ESLint, tsup, GitHub Actions, Docker |

## Quickstart

Requires Node 24+ (uses the built-in `node:sqlite` module).

```bash
npm install
cp apps/api/.env.example apps/api/.env   # optional; sensible defaults otherwise
npm run dev                              # api on :4000, web on :5173
```

Open http://localhost:5173. The web dev server proxies `/api` to the API.

## Scripts

```bash
npm run dev        # run api + web together
npm test           # unit-test the parser and the API
npm run typecheck  # strict type check across all workspaces
npm run lint       # eslint
npm run build      # production build of api + web
```

## API

| Method   | Path                   | Description                              |
| -------- | ---------------------- | ---------------------------------------- |
| `GET`    | `/api/health`          | Liveness probe.                          |
| `POST`   | `/api/parse`           | Parse `{ gitLog }` or `{ commits }`.     |
| `GET`    | `/api/changelogs`      | List (`?project=`, `?published=true`).   |
| `POST`   | `/api/changelogs`      | Create a changelog.                      |
| `GET`    | `/api/changelogs/:id`  | Fetch one.                               |
| `PUT`    | `/api/changelogs/:id`  | Update one.                              |
| `DELETE` | `/api/changelogs/:id`  | Delete one.                              |

```bash
curl -s localhost:4000/api/parse \
  -H 'content-type: application/json' \
  -d '{"gitLog":"a1b2c3d feat(api): add pagination\nd4e5f6a fix: null guard"}' | jq
```

## Producing input from git

```bash
git log --pretty=format:'%H%x1f%s%x1f%an%x1f%aI%x1f%b%x1e' > commits.txt
```

`parseGitLog` reads that separator-delimited format and also accepts a simpler
`<hash> <subject>` per line as a fallback.

## Testing

The parser is covered by focused unit tests; the API is covered end-to-end with
supertest against an in-memory SQLite database.

```bash
npm test
```

## Deployment

The `Dockerfile` builds both apps and serves the compiled web client through the
API as static files.

```bash
docker build -t changelog-studio .
docker run -p 8080:8080 -v "$PWD/data:/data" changelog-studio
```

A `fly.toml` is included for one-command deploys to [Fly.io](https://fly.io):

```bash
fly launch --copy-config --no-deploy
fly volumes create changelog_data --size 1
fly deploy
```

## Security

- **Input validation** — every request body is validated with Zod before it
  reaches the domain layer; the JSON body is capped at 1 MB.
- **SQL** — all statements are parameterized; no user input is interpolated.
- **Rendering** — the Markdown preview builds React elements from text nodes
  (no `dangerouslySetInnerHTML`), so commit content can't inject markup.
- **Headers** — [Helmet](https://helmetjs.github.io/) sets sensible security
  headers on every response.
- **Write auth** — write endpoints (`POST`/`PUT`/`DELETE`) support an optional
  `API_TOKEN` bearer check with a constant-time comparison. It is unset by
  default so the public demo stays an open playground; set it to lock down a
  deployment. Reads and parsing remain public.
- **CORS** — production serves the SPA same-origin through the API, so CORS
  only matters for external clients; restrict it with `CORS_ORIGIN`.

## License

MIT — see [LICENSE](./LICENSE).
