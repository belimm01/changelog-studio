import type { ReactNode } from 'react';
import { AlertIcon } from './components/Icons.js';

const INLINE_RE = /(\*\*[^*]+\*\*|`[^`]+`|\([0-9a-f]{7,40}\))/g;

function renderInline(text: string): ReactNode[] {
  const parts = text.split(INLINE_RE).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    if (/^\([0-9a-f]{7,40}\)$/.test(part)) {
      return (
        <span key={i} className="md-hash">
          {part.slice(1, -1)}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

interface Section {
  heading: string | null;
  breaking: boolean;
  items: string[];
  loose: string[];
}

function toSections(source: string): { title: ReactNode | null; sections: Section[] } {
  const lines = source.split('\n');
  let title: ReactNode | null = null;
  const sections: Section[] = [];
  let current: Section | null = null;

  const ensure = () => {
    if (!current) {
      current = { heading: null, breaking: false, items: [], loose: [] };
      sections.push(current);
    }
    return current;
  };

  for (const line of lines) {
    if (line.startsWith('## ')) {
      title = renderInline(line.slice(3));
    } else if (line.startsWith('### ')) {
      const heading = line.slice(4);
      current = {
        heading,
        breaking: /breaking/i.test(heading) || heading.includes('⚠'),
        items: [],
        loose: [],
      };
      sections.push(current);
    } else if (line.startsWith('- ')) {
      ensure().items.push(line.slice(2));
    } else if (line.trim() !== '') {
      ensure().loose.push(line.trim());
    }
  }

  return { title, sections };
}

export function Markdown({ source }: { source: string }) {
  const { title, sections } = toSections(source);

  return (
    <div className="markdown">
      {title && <h2 className="md-title">{title}</h2>}
      {sections.map((section, s) => (
        <section
          key={s}
          className={`md-section${section.breaking ? ' md-section--breaking' : ''}`}
        >
          {section.heading && (
            <h3>
              {section.breaking && <AlertIcon className="md-section__icon" />}
              <span>{renderInline(section.heading.replace(/^⚠\s*/, ''))}</span>
            </h3>
          )}
          {section.loose.map((line, l) => (
            <p key={`p-${l}`}>{renderInline(line)}</p>
          ))}
          {section.items.length > 0 && (
            <ul>
              {section.items.map((item, i) => (
                <li key={i}>{renderInline(item)}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
