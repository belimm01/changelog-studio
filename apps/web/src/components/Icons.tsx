import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
    ...props,
  };
}

export function LogoIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3l2.09 4.26L18.8 8l-3.4 3.32.8 4.68L12 13.8 7.8 16l.8-4.68L5.2 8l4.71-.74z" />
      <path d="M12 15.5v5" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
    </svg>
  );
}

export function EditIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
    </svg>
  );
}

export function KeyIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="m10.7 12.3 8.3-8.3M16 5l3 3M13 8l2 2" />
    </svg>
  );
}

export function GithubIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5a3 3 0 0 0-.9-2.4c3-.3 6.2-1.5 6.2-6.7A5.2 5.2 0 0 0 19 4.8 4.8 4.8 0 0 0 18.9 1S17.7.6 15 2.5a13.4 13.4 0 0 0-7 0C5.3.6 4.1 1 4.1 1A4.8 4.8 0 0 0 4 4.8 5.2 5.2 0 0 0 2.7 8.4c0 5.2 3.2 6.4 6.2 6.7a3 3 0 0 0-.9 2.3V21" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}
