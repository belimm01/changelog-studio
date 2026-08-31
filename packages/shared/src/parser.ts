import {
  COMMIT_TYPES,
  type CommitType,
  type ParsedCommit,
  type RawCommit,
  type ReleaseNotes,
  type ReleaseSection,
  type SemverBump,
} from './types.js';

const SUBJECT_RE = /^(?<type>[a-zA-Z]+)(?:\((?<scope>[^)]+)\))?(?<bang>!)?:\s*(?<description>.+)$/;
const BREAKING_NOTE_RE = /BREAKING[ -]CHANGE:\s*(?<note>[\s\S]+)/i;
const OTHER_TITLE = 'Other Changes';

const UNIT_SEP = String.fromCharCode(0x1f);
const RECORD_SEP = String.fromCharCode(0x1e);

function isKnownType(type: string): type is CommitType {
  return Object.prototype.hasOwnProperty.call(COMMIT_TYPES, type);
}

export function parseCommit(raw: RawCommit): ParsedCommit {
  const match = raw.subject.trim().match(SUBJECT_RE);
  const body = raw.body ?? '';
  const breakingMatch = body.match(BREAKING_NOTE_RE);

  let type = 'other';
  let scope: string | null = null;
  let description = raw.subject.trim();
  let breaking = Boolean(breakingMatch);

  if (match?.groups) {
    const g = match.groups;
    type = (g.type ?? 'other').toLowerCase();
    scope = g.scope?.trim() || null;
    description = (g.description ?? description).trim();
    if (g.bang) breaking = true;
    if (!isKnownType(type)) type = 'other';
  }

  return {
    hash: raw.hash,
    shortHash: raw.hash.slice(0, 7),
    type,
    scope,
    description,
    breaking,
    breakingNote: breakingMatch?.groups?.note?.trim() ?? null,
    author: raw.author ?? null,
    date: raw.date ?? null,
  };
}

function sectionTitle(type: string): string {
  return isKnownType(type) ? COMMIT_TYPES[type].title : OTHER_TITLE;
}

function bumpRank(bump: SemverBump): number {
  return bump === 'major' ? 3 : bump === 'minor' ? 2 : 1;
}

export function suggestBump(commits: ParsedCommit[]): SemverBump {
  let best: SemverBump = 'patch';
  for (const c of commits) {
    const bump: SemverBump = c.breaking
      ? 'major'
      : isKnownType(c.type)
        ? COMMIT_TYPES[c.type].semver
        : 'patch';
    if (bumpRank(bump) > bumpRank(best)) best = bump;
  }
  return best;
}

export function parseCommits(rawCommits: RawCommit[]): ReleaseNotes {
  const parsed = rawCommits.map(parseCommit);

  const order = [...Object.keys(COMMIT_TYPES), 'other'];
  const byType = new Map<string, ParsedCommit[]>();
  for (const commit of parsed) {
    const list = byType.get(commit.type) ?? [];
    list.push(commit);
    byType.set(commit.type, list);
  }

  const sections: ReleaseSection[] = [];
  for (const type of order) {
    const commits = byType.get(type);
    if (commits && commits.length > 0) {
      sections.push({ type, title: sectionTitle(type), commits });
    }
  }

  return {
    suggestedBump: suggestBump(parsed),
    sections,
    breakingChanges: parsed.filter((c) => c.breaking),
  };
}

// Reads `git log --pretty=format:'%H%x1f%s%x1f%an%x1f%aI%x1f%b%x1e'`, and
// falls back to one "<hash> <subject>" per line when the separators are absent.
export function parseGitLog(raw: string): RawCommit[] {
  const text = raw.trim();
  if (!text) return [];

  if (text.includes(UNIT_SEP)) {
    return text
      .split(RECORD_SEP)
      .map((r) => r.trim())
      .filter(Boolean)
      .map((record) => {
        const [hash = '', subject = '', author = '', date = '', body = ''] = record.split(UNIT_SEP);
        return {
          hash: hash.trim(),
          subject: subject.trim(),
          author: author.trim() || undefined,
          date: date.trim() || undefined,
          body: body.trim(),
        };
      })
      .filter((c) => c.hash);
  }

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const spaceIdx = line.indexOf(' ');
      if (spaceIdx === -1) return { hash: line, subject: '', body: '' };
      return {
        hash: line.slice(0, spaceIdx),
        subject: line.slice(spaceIdx + 1).trim(),
        body: '',
      };
    });
}

export function renderMarkdown(
  notes: ReleaseNotes,
  opts: { version?: string; date?: string } = {},
): string {
  const lines: string[] = [];
  const heading = opts.version ? `## ${opts.version}` : '## Unreleased';
  lines.push(opts.date ? `${heading} (${opts.date})` : heading);
  lines.push('');

  if (notes.breakingChanges.length > 0) {
    lines.push('### ⚠ BREAKING CHANGES', '');
    for (const c of notes.breakingChanges) {
      const note = c.breakingNote ?? c.description;
      lines.push(`- ${scopePrefix(c)}${note} (${c.shortHash})`);
    }
    lines.push('');
  }

  for (const section of notes.sections) {
    lines.push(`### ${section.title}`, '');
    for (const c of section.commits) {
      lines.push(`- ${scopePrefix(c)}${c.description} (${c.shortHash})`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd() + '\n';
}

function scopePrefix(commit: ParsedCommit): string {
  return commit.scope ? `**${commit.scope}:** ` : '';
}
