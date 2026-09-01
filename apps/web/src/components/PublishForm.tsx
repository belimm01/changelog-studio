import { useState } from 'react';
import { changelogInputSchema, type Changelog } from '@changelog-studio/shared';
import { api } from '../api.js';
import { useToast } from './Toast.js';
import { CheckIcon, EditIcon } from './Icons.js';

interface PublishFormProps {
  project: string;
  version: string;
  title: string;
  markdown: string;
  editing: Changelog | null;
  onChange(field: 'project' | 'version' | 'title', value: string): void;
  onSaved(changelog: Changelog): void;
  onCancelEdit(): void;
}

type FieldErrors = Partial<Record<'project' | 'version' | 'title' | 'markdown', string>>;

const LIMITS = { project: 80, version: 40, title: 160 };

export function PublishForm({
  project,
  version,
  title,
  markdown,
  editing,
  onChange,
  onSaved,
  onCancelEdit,
}: PublishFormProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const submit = async () => {
    const parsed = changelogInputSchema.safeParse({
      project,
      version,
      title,
      markdown,
      published: true,
    });

    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === 'project' || key === 'version' || key === 'title' || key === 'markdown') {
          next[key] = issue.message;
        }
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setBusy(true);
    try {
      const saved = editing
        ? await api.updateChangelog(editing.id, parsed.data)
        : await api.createChangelog(parsed.data);
      toast.success(editing ? 'Changelog updated' : 'Changelog published');
      onSaved(saved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Publish failed');
    } finally {
      setBusy(false);
    }
  };

  const disabled = busy || !markdown.trim();

  return (
    <section className="card panel">
      <header className="panel__head">
        <div>
          <h2 className="panel__title">{editing ? 'Update release' : 'Publish release'}</h2>
          <p className="panel__sub">
            {editing ? `Editing ${editing.project} ${editing.version}.` : 'Save these notes to the public feed.'}
          </p>
        </div>
        {editing && (
          <button type="button" className="btn btn--subtle" onClick={onCancelEdit}>
            Cancel edit
          </button>
        )}
      </header>

      <div className="fields">
        <Field
          label="Project"
          value={project}
          max={LIMITS.project}
          error={errors.project}
          onChange={(v) => onChange('project', v)}
        />
        <Field
          label="Version"
          value={version}
          max={LIMITS.version}
          error={errors.version}
          onChange={(v) => onChange('version', v)}
        />
        <Field
          label="Title"
          value={title}
          max={LIMITS.title}
          error={errors.title}
          onChange={(v) => onChange('title', v)}
          wide
        />
      </div>

      {errors.markdown && <p className="field__error">{errors.markdown}</p>}

      <button type="button" className="btn btn--primary btn--block" onClick={submit} disabled={disabled}>
        {editing ? <EditIcon /> : <CheckIcon />}
        {editing ? 'Update changelog' : 'Publish changelog'}
      </button>
    </section>
  );
}

interface FieldProps {
  label: string;
  value: string;
  max: number;
  error?: string;
  wide?: boolean;
  onChange(value: string): void;
}

function Field({ label, value, max, error, wide, onChange }: FieldProps) {
  const id = `field-${label.toLowerCase()}`;
  return (
    <div className={`field${wide ? ' field--wide' : ''}`}>
      <div className="field__label">
        <label htmlFor={id}>{label}</label>
        <span className={`field__count${value.length > max ? ' field__count--over' : ''}`}>
          {value.length}/{max}
        </span>
      </div>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
      />
      {error && <p className="field__error">{error}</p>}
    </div>
  );
}
