import { NavLink, Outlet } from 'react-router-dom';
import { GithubIcon, LogoIcon } from './Icons.js';
import { ThemeToggle } from './ThemeToggle.js';
import { AuthControl } from './AuthControl.js';

const REPO_URL = 'https://github.com/belimm01/changelog-studio';

export function Shell() {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar__inner">
          <NavLink to="/" className="brand" aria-label="Changelog Studio home">
            <span className="brand__mark">
              <LogoIcon width={20} height={20} />
            </span>
            <span className="brand__name">
              Changelog <span className="brand__accent">Studio</span>
            </span>
          </NavLink>

          <nav className="nav" aria-label="Primary">
            <NavLink to="/" end className="nav__link">
              Workspace
            </NavLink>
            <NavLink to="/changelogs" className="nav__link">
              Releases
            </NavLink>
          </nav>

          <div className="topbar__actions">
            <AuthControl />
            <ThemeToggle />
            <a
              className="icon-btn"
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="View source on GitHub"
              title="View source on GitHub"
            >
              <GithubIcon />
            </a>
          </div>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <span>Changelog Studio</span>
        <span className="footer__dot" aria-hidden="true">
          ·
        </span>
        <span>Conventional Commits to release notes</span>
      </footer>
    </div>
  );
}
