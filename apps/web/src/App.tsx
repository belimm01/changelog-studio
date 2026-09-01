import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './components/Shell.js';
import { WorkspacePage } from './pages/WorkspacePage.js';
import { ChangelogsPage } from './pages/ChangelogsPage.js';
import { ChangelogDetailPage } from './pages/ChangelogDetailPage.js';

export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<WorkspacePage />} />
        <Route path="changelogs" element={<ChangelogsPage />} />
        <Route path="changelogs/:id" element={<ChangelogDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
