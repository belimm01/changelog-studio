import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  parseCommits,
  parseGitLog,
  renderMarkdown,
  type Changelog,
} from '@changelog-studio/shared';
import { Editor, SAMPLE_LOG } from '../components/Editor.js';
import { Preview } from '../components/Preview.js';
import { PublishForm } from '../components/PublishForm.js';
import { useDebounced } from '../hooks.js';
import { slugify } from '../lib.js';

interface EditState {
  edit?: Changelog;
}

export function WorkspacePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const editSource = (location.state as EditState | null)?.edit ?? null;

  const [gitLog, setGitLog] = useState(SAMPLE_LOG);
  const [project, setProject] = useState('changelog-studio');
  const [version, setVersion] = useState('v0.1.0');
  const [title, setTitle] = useState('Initial release');
  const [editing, setEditing] = useState<Changelog | null>(null);

  useEffect(() => {
    if (!editSource) return;
    setEditing(editSource);
    setProject(editSource.project);
    setVersion(editSource.version);
    setTitle(editSource.title);
    setGitLog('');
    navigate('.', { replace: true, state: null });
  }, [editSource, navigate]);

  const debounced = useDebounced(gitLog, 200);

  const { notes, liveMarkdown, commitCount } = useMemo(() => {
    const raw = parseGitLog(debounced);
    if (raw.length === 0) {
      return { notes: null, liveMarkdown: '', commitCount: 0 };
    }
    const parsed = parseCommits(raw);
    return {
      notes: parsed,
      liveMarkdown: renderMarkdown(parsed, { version }),
      commitCount: raw.length,
    };
  }, [debounced, version]);

  const usingStored = editing !== null && !liveMarkdown.trim();
  const markdown = usingStored ? editing.markdown : liveMarkdown;
  const filename = `${slugify(project)}-${slugify(version)}.md`;

  const onChangeField = (field: 'project' | 'version' | 'title', value: string) => {
    if (field === 'project') setProject(value);
    else if (field === 'version') setVersion(value);
    else setTitle(value);
  };

  const cancelEdit = () => {
    setEditing(null);
    setGitLog(SAMPLE_LOG);
  };

  const onSaved = () => {
    setEditing(null);
    navigate('/changelogs');
  };

  return (
    <div className="workspace">
      <div className="hero">
        <h1 className="hero__title">Release notes, the moment you paste.</h1>
        <p className="hero__sub">
          Conventional Commits in, grouped and versioned Markdown out — parsed in your browser,
          rendered as you type.
        </p>
      </div>

      <div className="workspace__grid">
        <Editor value={gitLog} onChange={setGitLog} commitCount={commitCount} />
        <Preview notes={usingStored ? null : notes} markdown={markdown} filename={filename} />
      </div>

      <PublishForm
        project={project}
        version={version}
        title={title}
        markdown={markdown}
        editing={editing}
        onChange={onChangeField}
        onSaved={onSaved}
        onCancelEdit={cancelEdit}
      />
    </div>
  );
}
