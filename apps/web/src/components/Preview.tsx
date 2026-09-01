import { useState } from 'react';
import type { ReleaseNotes } from '@changelog-studio/shared';
import { Markdown } from '../markdown.js';
import { BumpBadge } from './BumpBadge.js';
import { CheckIcon, CopyIcon, DownloadIcon } from './Icons.js';
import { copyText, downloadMarkdown } from '../lib.js';
import { useToast } from './Toast.js';

interface PreviewProps {
  notes: ReleaseNotes | null;
  markdown: string;
  filename: string;
}

export function Preview({ notes, markdown, filename }: PreviewProps) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const empty = !markdown.trim();
  const showPills = Boolean(notes && notes.sections.length > 0);

  const copy = async () => {
    try {
      await copyText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const breaking = notes?.breakingChanges.length ?? 0;

  return (
    <section className="card panel">
      <header className="panel__head">
        <div>
          <h2 className="panel__title">Preview</h2>
          <p className="panel__sub">Rendered live from the shared parser.</p>
        </div>
        {!empty && (
          <div className="panel__tools">
            <button type="button" className="btn btn--subtle" onClick={copy}>
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              className="btn btn--subtle"
              onClick={() => downloadMarkdown(filename, markdown)}
            >
              <DownloadIcon />
              .md
            </button>
          </div>
        )}
      </header>

      {empty ? (
        <div className="empty">
          <p>Your release notes appear here as you type.</p>
          <span className="hint">Grouped sections, a suggested semver bump, and clean Markdown.</span>
        </div>
      ) : (
        <>
          {showPills && notes && (
            <div className="pill-row">
              <BumpBadge bump={notes.suggestedBump} />
              {breaking > 0 && (
                <span className="pill pill--major">
                  {breaking} breaking change{breaking === 1 ? '' : 's'}
                </span>
              )}
              <span className="pill pill--ghost">{notes.sections.length} sections</span>
            </div>
          )}
          <div className="preview document">
            <Markdown source={markdown} />
          </div>
        </>
      )}
    </section>
  );
}
