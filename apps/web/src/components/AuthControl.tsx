import { useEffect, useRef, useState } from 'react';
import { KeyIcon } from './Icons.js';
import { getToken, setToken } from '../api.js';
import { useToast } from './Toast.js';

export function AuthControl() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(getToken());
  const [active, setActive] = useState(Boolean(getToken()));
  const ref = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const save = () => {
    setToken(value);
    const has = Boolean(value.trim());
    setActive(has);
    setOpen(false);
    toast.success(has ? 'API token saved' : 'API token cleared');
  };

  return (
    <div className="auth" ref={ref}>
      <button
        type="button"
        className={`icon-btn${active ? ' icon-btn--on' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="API token"
        aria-expanded={open}
        title={active ? 'API token set' : 'Set API token'}
      >
        <KeyIcon />
      </button>
      {open && (
        <div className="auth__popover">
          <label htmlFor="api-token">API token</label>
          <p className="hint">Stored locally and sent as a Bearer token on writes.</p>
          <input
            id="api-token"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={value}
            placeholder="paste token"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
          <div className="auth__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setValue('')}>
              Clear
            </button>
            <button type="button" className="btn btn--primary" onClick={save}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
