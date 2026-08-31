import { useEffect, useState } from 'react';
import type { Changelog } from '@changelog-studio/shared';
import { api, type ParseResult } from './api.js';
import { Markdown } from './markdown.js';

const SAMPLE_LOG = `a1b2c3d feat(editor): live markdown preview
e4f5g6h fix(parser): handle scopes with slashes
i7j8k9l feat!: drop Node 18 support
m0n1o2p docs(readme): add quickstart
q3r4s5t chore(deps): bump vite to 5.4`;

export function App() {
  const [gitLog, setGitLog] = useState(SAMPLE_LOG);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [project, setProject] = useState('changelog-studio');
  const [version, setVersion] = useState('v0.1.0');
  const [title, setTitle] = useState('Initial release');
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => api.listChangelogs().then(setChangelogs).catch(() => undefined);

  useEffect(() => {
    void refresh();
  }, []);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const handleParse = () => run(async () => setResult(await api.parse(gitLog)));

  const handleSave = () =>
    run(async () => {
      if (!result) return;
      await api.createChangelog({ project, version, title, markdown: result.markdown, published: true });
      await refresh();
    });

  const handleDelete = (id: string) => run(async () => {
    await api.deleteChangelog(id);
    await refresh();
  });

  return (
    <div className="app">
      <header className="app__header">
        <h1>Changelog Studio</h1>
        <p>Turn raw git commits into polished, categorized release notes.</p>
      </header>

      {error && <div className="banner banner--error">{error}</div>}

      <main className="grid">
        <section className="card">
          <h2>1 · Paste commits</h2>
          <textarea
            className="editor"
            value={gitLog}
            spellCheck={false}
            onChange={(e) => setGitLog(e.target.value)}
            aria-label="Git log input"
          />
          <button className="btn btn--primary" onClick={handleParse} disabled={busy}>
            Generate notes
          </button>
        </section>

        <section className="card">
          <h2>2 · Preview</h2>
          {result ? (
            <>
              <div className="pill-row">
                <span className={`pill pill--${result.notes.suggestedBump}`}>
                  suggested bump: {result.notes.suggestedBump}
                </span>
                {result.notes.breakingChanges.length > 0 && (
                  <span className="pill pill--major">
                    {result.notes.breakingChanges.length} breaking
                  </span>
                )}
              </div>
              <div className="preview">
                <Markdown source={result.markdown} />
              </div>
              <div className="form-row">
                <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="project" />
                <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="version" />
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" />
              </div>
              <button className="btn" onClick={handleSave} disabled={busy}>
                Publish changelog
              </button>
            </>
          ) : (
            <p className="muted">Generate notes to see a live preview.</p>
          )}
        </section>
      </main>

      <section className="card">
        <h2>Published changelogs</h2>
        {changelogs.length === 0 ? (
          <p className="muted">Nothing published yet.</p>
        ) : (
          <ul className="feed">
            {changelogs.map((c) => (
              <li key={c.id} className="feed__item">
                <div>
                  <strong>{c.project}</strong> · {c.version}
                  <div className="muted">{c.title}</div>
                </div>
                <button className="btn btn--ghost" onClick={() => handleDelete(c.id)} disabled={busy}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
