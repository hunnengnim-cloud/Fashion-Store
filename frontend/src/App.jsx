import React, { useEffect, useState } from 'react';
import FallingStarsSnow from './components/FallingStarsSnow';
import { KEYS } from './lib/store';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import StorefrontPage from './pages/StorefrontPage';

const CATEGORY_ROUTES = new Set(['men', 'women', 'kids', 'shoes', 'accessories', 'sale']);

function resolveRoute(pathname) {
  const clean = pathname.replace(/^\/|\/$/g, '').replace('.html', '').toLowerCase();
  if (clean === 'admin' || clean === 'react/admin') return { view: 'admin', category: 'all' };
  if (clean === 'login' || clean === 'react/login') return { view: 'login', category: 'all' };
  if (clean.startsWith('react/')) {
    const sub = clean.slice('react/'.length);
    return { view: 'store', category: CATEGORY_ROUTES.has(sub) ? sub : 'all' };
  }
  if (CATEGORY_ROUTES.has(clean)) return { view: 'store', category: clean };
  return { view: 'store', category: 'all' };
}

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const onToast = (e) => {
      const id = Date.now() + Math.random();
      const { message, type = 'default', duration = 3200 } = e.detail || {};
      setToasts((prev) => {
        // Prevent duplicate spam of identical messages and limit to max 1 toast on screen at a time
        const filtered = prev.filter((p) => p.message !== message);
        return [...filtered.slice(-1), { id, message, type }];
      });
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    };
    window.addEventListener('fashionstore:toast', onToast);
    return () => window.removeEventListener('fashionstore:toast', onToast);
  }, []);

  const navigate = (to) => {
    if (window.location.pathname !== to) {
      window.history.pushState({}, '', to);
      setPathname(to);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(KEYS.THEME, next);
  };

  const route = resolveRoute(pathname);

  return (
    <>
      <FallingStarsSnow theme={theme} />
      {route.view === 'admin' && <AdminPage theme={theme} onToggleTheme={toggleTheme} onNavigate={navigate} />}
      {route.view === 'login' && <AuthPage onNavigate={navigate} />}
      {route.view === 'store' && (
        <StorefrontPage
          initialCategory={route.category}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNavigate={navigate}
        />
      )}

      <div id="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`} role="alert">
            <span className="toast-icon">{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : '✦'}</span>
            <span className="toast-text">{t.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

