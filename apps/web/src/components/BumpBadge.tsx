import type { SemverBump } from '@changelog-studio/shared';

const LABELS: Record<SemverBump, string> = {
  major: 'major',
  minor: 'minor',
  patch: 'patch',
};

export function BumpBadge({ bump }: { bump: SemverBump }) {
  return (
    <span className={`pill pill--${bump}`}>
      <span className="pill__dot" aria-hidden="true" />
      {LABELS[bump]}
    </span>
  );
}
