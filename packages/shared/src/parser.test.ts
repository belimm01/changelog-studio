import { describe, expect, it } from 'vitest';
import { parseCommit, parseCommits, parseGitLog, renderMarkdown, suggestBump } from './parser.js';

const UNIT = String.fromCharCode(0x1f);
const RECORD = String.fromCharCode(0x1e);

describe('parseCommit', () => {
  it('extracts type, scope and description', () => {
    const c = parseCommit({ hash: 'abc1234def', subject: 'feat(api): add pagination', body: '' });
    expect(c).toMatchObject({
      type: 'feat',
      scope: 'api',
      description: 'add pagination',
      shortHash: 'abc1234',
      breaking: false,
    });
  });

  it('handles a missing scope', () => {
    const c = parseCommit({ hash: 'a', subject: 'fix: correct off-by-one', body: '' });
    expect(c.type).toBe('fix');
    expect(c.scope).toBeNull();
  });

  it('flags breaking changes from the ! marker', () => {
    const c = parseCommit({ hash: 'a', subject: 'feat(auth)!: drop legacy tokens', body: '' });
    expect(c.breaking).toBe(true);
  });

  it('flags breaking changes from a BREAKING CHANGE footer', () => {
    const c = parseCommit({
      hash: 'a',
      subject: 'refactor: rework config loader',
      body: 'BREAKING CHANGE: config keys are now camelCase',
    });
    expect(c.breaking).toBe(true);
    expect(c.breakingNote).toBe('config keys are now camelCase');
  });

  it('normalizes uppercase types', () => {
    expect(parseCommit({ hash: 'a', subject: 'FIX: whoops', body: '' }).type).toBe('fix');
  });

  it('buckets non-conventional subjects as "other"', () => {
    const c = parseCommit({ hash: 'a', subject: 'random work in progress', body: '' });
    expect(c.type).toBe('other');
    expect(c.description).toBe('random work in progress');
  });

  it('treats unknown types as "other"', () => {
    expect(parseCommit({ hash: 'a', subject: 'wip: stuff', body: '' }).type).toBe('other');
  });
});

describe('suggestBump', () => {
  it('returns patch for fixes only', () => {
    expect(suggestBump([parseCommit({ hash: 'a', subject: 'fix: x', body: '' })])).toBe('patch');
  });

  it('returns minor when a feature is present', () => {
    const commits = [
      parseCommit({ hash: 'a', subject: 'fix: x', body: '' }),
      parseCommit({ hash: 'b', subject: 'feat: y', body: '' }),
    ];
    expect(suggestBump(commits)).toBe('minor');
  });

  it('returns major when anything is breaking', () => {
    const commits = [
      parseCommit({ hash: 'a', subject: 'feat: y', body: '' }),
      parseCommit({ hash: 'b', subject: 'fix!: z', body: '' }),
    ];
    expect(suggestBump(commits)).toBe('major');
  });
});

describe('parseCommits', () => {
  const notes = parseCommits([
    { hash: 'h1', subject: 'feat(ui): dark mode', body: '' },
    { hash: 'h2', subject: 'fix(api): null guard', body: '' },
    { hash: 'h3', subject: 'feat: export button', body: '' },
    { hash: 'h4', subject: 'chore: bump deps', body: '' },
    { hash: 'h5', subject: 'not a conventional commit', body: '' },
  ]);

  it('groups commits into ordered sections', () => {
    expect(notes.sections.map((s) => s.type)).toEqual(['feat', 'fix', 'chore', 'other']);
  });

  it('keeps multiple commits within a section', () => {
    const feat = notes.sections.find((s) => s.type === 'feat');
    expect(feat?.commits).toHaveLength(2);
  });

  it('suggests a minor bump for this batch', () => {
    expect(notes.suggestedBump).toBe('minor');
  });
});

describe('parseGitLog', () => {
  it('parses the separator-delimited format', () => {
    const raw = [
      ['h1', 'feat: a', 'Ada', '2026-01-01'].join(UNIT),
      ['h2', 'fix: b', 'Linus', '2026-01-02'].join(UNIT),
    ].join(RECORD);
    const commits = parseGitLog(raw);
    expect(commits).toHaveLength(2);
    expect(commits[0]).toMatchObject({ hash: 'h1', subject: 'feat: a', author: 'Ada' });
  });

  it('falls back to one commit per line', () => {
    const commits = parseGitLog('abc123 feat: a\ndef456 fix: b');
    expect(commits).toEqual([
      { hash: 'abc123', subject: 'feat: a', body: '' },
      { hash: 'def456', subject: 'fix: b', body: '' },
    ]);
  });

  it('returns an empty array for blank input', () => {
    expect(parseGitLog('   ')).toEqual([]);
  });
});

describe('renderMarkdown', () => {
  it('renders sections, scopes and a version heading', () => {
    const notes = parseCommits([
      { hash: 'abcdef1', subject: 'feat(ui): dark mode', body: '' },
      { hash: 'abcdef2', subject: 'fix: crash on empty input', body: '' },
    ]);
    const md = renderMarkdown(notes, { version: 'v1.2.0', date: '2026-08-31' });
    expect(md).toContain('## v1.2.0 (2026-08-31)');
    expect(md).toContain('### Features');
    expect(md).toContain('- **ui:** dark mode (abcdef1)');
    expect(md).toContain('### Bug Fixes');
  });

  it('surfaces a breaking-changes section first', () => {
    const notes = parseCommits([
      { hash: 'abcdef1', subject: 'feat!: new api surface', body: '' },
    ]);
    const md = renderMarkdown(notes);
    expect(md.indexOf('BREAKING CHANGES')).toBeLessThan(md.indexOf('### Features'));
  });
});
