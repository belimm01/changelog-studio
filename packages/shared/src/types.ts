import { z } from 'zod';

export const COMMIT_TYPES = {
  feat: { title: 'Features', semver: 'minor' },
  fix: { title: 'Bug Fixes', semver: 'patch' },
  perf: { title: 'Performance', semver: 'patch' },
  refactor: { title: 'Refactoring', semver: 'patch' },
  docs: { title: 'Documentation', semver: 'patch' },
  test: { title: 'Tests', semver: 'patch' },
  build: { title: 'Build System', semver: 'patch' },
  ci: { title: 'Continuous Integration', semver: 'patch' },
  style: { title: 'Styles', semver: 'patch' },
  chore: { title: 'Chores', semver: 'patch' },
  revert: { title: 'Reverts', semver: 'patch' },
} as const;

export type CommitType = keyof typeof COMMIT_TYPES;
export type SemverBump = 'major' | 'minor' | 'patch';

export const rawCommitSchema = z.object({
  hash: z.string().min(1),
  subject: z.string(),
  body: z.string().default(''),
  author: z.string().optional(),
  date: z.string().optional(),
});
export type RawCommit = z.infer<typeof rawCommitSchema>;

export const parsedCommitSchema = z.object({
  hash: z.string(),
  shortHash: z.string(),
  type: z.string(),
  scope: z.string().nullable(),
  description: z.string(),
  breaking: z.boolean(),
  breakingNote: z.string().nullable(),
  author: z.string().nullable(),
  date: z.string().nullable(),
});
export type ParsedCommit = z.infer<typeof parsedCommitSchema>;

export const releaseSectionSchema = z.object({
  type: z.string(),
  title: z.string(),
  commits: z.array(parsedCommitSchema),
});
export type ReleaseSection = z.infer<typeof releaseSectionSchema>;

export const releaseNotesSchema = z.object({
  suggestedBump: z.enum(['major', 'minor', 'patch']),
  sections: z.array(releaseSectionSchema),
  breakingChanges: z.array(parsedCommitSchema),
});
export type ReleaseNotes = z.infer<typeof releaseNotesSchema>;

export const changelogSchema = z.object({
  id: z.string(),
  project: z.string(),
  version: z.string(),
  title: z.string(),
  markdown: z.string(),
  published: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Changelog = z.infer<typeof changelogSchema>;

export const changelogInputSchema = z.object({
  project: z.string().min(1).max(80),
  version: z.string().min(1).max(40),
  title: z.string().min(1).max(160),
  markdown: z.string().min(1),
  published: z.boolean().optional().default(false),
});
export type ChangelogInput = z.infer<typeof changelogInputSchema>;

export const parseRequestSchema = z
  .object({
    gitLog: z.string().optional(),
    commits: z.array(rawCommitSchema).optional(),
  })
  .refine((v) => !!v.gitLog || (v.commits && v.commits.length > 0), {
    message: 'Provide either a `gitLog` string or a non-empty `commits` array.',
  });
export type ParseRequest = z.infer<typeof parseRequestSchema>;
