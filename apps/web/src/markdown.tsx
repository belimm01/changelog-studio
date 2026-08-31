import type { ReactNode } from 'react';

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    return <span key={i}>{part}</span>;
  });
}

// Intentionally small: handles the heading/list subset our generator emits.
export function Markdown({ source }: { source: string }) {
  const blocks: ReactNode[] = [];
  const lines = source.split('\n');
  let list: ReactNode[] = [];

  const flushList = () => {
    if (list.length) {
      blocks.push(<ul key={`ul-${blocks.length}`}>{list}</ul>);
      list = [];
    }
  };

  lines.forEach((line, i) => {
    if (line.startsWith('### ')) {
      flushList();
      blocks.push(<h3 key={i}>{renderInline(line.slice(4))}</h3>);
    } else if (line.startsWith('## ')) {
      flushList();
      blocks.push(<h2 key={i}>{renderInline(line.slice(3))}</h2>);
    } else if (line.startsWith('- ')) {
      list.push(<li key={i}>{renderInline(line.slice(2))}</li>);
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      blocks.push(<p key={i}>{renderInline(line)}</p>);
    }
  });
  flushList();

  return <div className="markdown">{blocks}</div>;
}
