import { useEffect, useState } from 'react';
import { MoonIcon, SunIcon } from './Icons.js';
import { persistTheme, resolveTheme, type Theme } from '../theme.js';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(resolveTheme);

  useEffect(() => {
    persistTheme(theme);
  }, [theme]);

  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
