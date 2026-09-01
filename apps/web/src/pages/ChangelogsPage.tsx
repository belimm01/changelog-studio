import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Changelog } from '@changelog-studio/shared';
import { api } from '../api.js';
import { SearchIcon, TrashIcon } from '../components/Icons.js';
import { useToast } from '../components/Toast.js';
import { formatDate } from '../lib.js';

export function ChangelogsPage() {
  const [items, setItems] = useState<Changelog[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [project, setProject] = useState('all');
  const [query, setQuery] = useState('');
  const toast = useToast();

  const load = () => {
    setStatus('loading');
    api
      .listChangelogs({ publishedOnly: true })
      .then((data) => {
        setItems(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  };

  useEffect(load, []);

  const projects = useMemo(
    () => Array.from(new Set(items.map((c) => c.project))).sort(),
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((c) => {
      if (project !== 'all' && c.project !== project) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.version.toLowerCase().includes(q) ||
        c.project.toLowerCase().includes(q)
      );
    });
  }, [items, project, query]);

  const remove = async (id: string) => {
    try {
      await api.deleteChangelog(id);
      setItems((list) => list.filter((c) => c.id !== id));
      toast.success('Changelog deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  return (
    <div className="releases">
      <div className="releases__head">
        <div>
          <h1 className="hero__title">Releases</h1>
          <p className="hero__sub">Everything published to the feed.</p>
        </div>
        <div className="releases__controls">
          <div className="search">
            <SearchIcon />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search releases"
              aria-label="Search releases"
            />
          </div>
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            aria-label="Filter by project"
          >
            <option value="all">All projects</option>
            {projects.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {status === 'loading' && (
        <ul className="feed">
          {[0, 1, 2].map((i) => (
            <li key={i} className="feed-card feed-card--skeleton" />
          ))}
        </ul>
      )}

      {status === 'error' && (
        <div className="empty empty--error">
          <p>Could not load releases.</p>
          <button type="button" className="btn btn--subtle" onClick={load}>
            Retry
          </button>
        </div>
      )}

      {status === 'ready' && filtered.length === 0 && (
        <div className="empty">
          <p>{items.length === 0 ? 'Nothing published yet.' : 'No releases match your filters.'}</p>
          {items.length === 0 && (
            <Link to="/" className="btn btn--primary">
              Open the workspace
            </Link>
          )}
        </div>
      )}

      {status === 'ready' && filtered.length > 0 && (
        <ul className="feed">
          {filtered.map((c) => (
            <li key={c.id} className="feed-card">
              <Link to={`/changelogs/${c.id}`} className="feed-card__main">
                <div className="feed-card__meta">
                  <span className="tag">{c.project}</span>
                  <span className="feed-card__version">{c.version}</span>
                  <span className="feed-card__date">{formatDate(c.updatedAt)}</span>
                </div>
                <h2 className="feed-card__title">{c.title}</h2>
              </Link>
              <button
                type="button"
                className="icon-btn icon-btn--danger"
                onClick={() => remove(c.id)}
                aria-label={`Delete ${c.project} ${c.version}`}
                title="Delete"
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
