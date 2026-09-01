import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Changelog } from '@changelog-studio/shared';
import { api } from '../api.js';
import { Markdown } from '../markdown.js';
import { CheckIcon, CopyIcon, DownloadIcon, EditIcon, LinkIcon, TrashIcon } from '../components/Icons.js';
import { useToast } from '../components/Toast.js';
import { copyText, downloadMarkdown, formatDate, slugify } from '../lib.js';

export function ChangelogDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [item, setItem] = useState<Changelog | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setStatus('loading');
    api
      .getChangelog(id)
      .then((data) => {
        setItem(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [id]);

  const copyMarkdown = async () => {
    if (!item) return;
    try {
      await copyText(item.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const copyLink = async () => {
    try {
      await copyText(window.location.href);
      toast.success('Permalink copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const remove = async () => {
    if (!item) return;
    try {
      await api.deleteChangelog(item.id);
      toast.success('Changelog deleted');
      navigate('/changelogs');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  if (status === 'loading') {
    return (
      <div className="detail">
        <div className="card panel detail__skeleton" />
      </div>
    );
  }

  if (status === 'error' || !item) {
    return (
      <div className="detail">
        <div className="empty empty--error">
          <p>This changelog could not be found.</p>
          <Link to="/changelogs" className="btn btn--subtle">
            Back to releases
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="detail">
      <Link to="/changelogs" className="backlink">
        ← All releases
      </Link>

      <article className="card panel detail__card">
        <header className="detail__head">
          <div>
            <div className="feed-card__meta">
              <span className="tag">{item.project}</span>
              <span className="feed-card__version">{item.version}</span>
              <span className="feed-card__date">{formatDate(item.updatedAt)}</span>
            </div>
            <h1 className="detail__title">{item.title}</h1>
          </div>
          <div className="detail__tools">
            <button type="button" className="btn btn--subtle" onClick={copyLink}>
              <LinkIcon />
              Share
            </button>
            <button type="button" className="btn btn--subtle" onClick={copyMarkdown}>
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              className="btn btn--subtle"
              onClick={() =>
                downloadMarkdown(`${slugify(item.project)}-${slugify(item.version)}.md`, item.markdown)
              }
            >
              <DownloadIcon />
              .md
            </button>
            <button
              type="button"
              className="btn btn--subtle"
              onClick={() => navigate('/', { state: { edit: item } })}
            >
              <EditIcon />
              Edit
            </button>
            <button type="button" className="icon-btn icon-btn--danger" onClick={remove} title="Delete">
              <TrashIcon />
            </button>
          </div>
        </header>

        <div className="preview document detail__body">
          <Markdown source={item.markdown} />
        </div>
      </article>
    </div>
  );
}
