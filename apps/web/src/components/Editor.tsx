export const SAMPLE_LOG = `a1b2c3d feat(editor): live markdown preview
e4f5g6h fix(parser): handle scopes with slashes
i7j8k9l feat!: drop Node 18 support
m0n1o2p docs(readme): add quickstart
q3r4s5t perf(render): memoize parsed sections
u6v7w8x chore(deps): bump vite to 5.4`;

interface EditorProps {
  value: string;
  onChange(value: string): void;
  commitCount: number;
}

export function Editor({ value, onChange, commitCount }: EditorProps) {
  return (
    <section className="card panel">
      <header className="panel__head">
        <div>
          <h2 className="panel__title">Commits</h2>
          <p className="panel__sub">Paste a git log or Conventional Commit subjects.</p>
        </div>
        <button type="button" className="btn btn--subtle" onClick={() => onChange(SAMPLE_LOG)}>
          Load sample
        </button>
      </header>
      <textarea
        className="editor"
        value={value}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        placeholder="a1b2c3d feat(api): add pagination"
        aria-label="Git log input"
      />
      <p className="panel__foot">
        {commitCount === 0
          ? 'No commits parsed yet.'
          : `${commitCount} commit${commitCount === 1 ? '' : 's'} parsed live.`}
      </p>
    </section>
  );
}
