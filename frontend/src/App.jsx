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
  if (clean === 'login' || clean === 'react/login' || clean === 'auth' || clean === 'react/auth') return { view: 'login', category: 'all' };
  if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token=')) {
    return { view: 'login', category: 'all' };
  }
  if (clean.startsWith('react/')) {
    const sub = clean.slice('react/'.length);
    return { view: 'store', category: CATEGORY_ROUTES.has(sub) ? sub : 'all' };
  }
  if (CATEGORY_ROUTES.has(clean)) return { view: 'store', category: clean };
  return { view: 'store', category: 'all' };
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'var(--bg-main, #fcfaf6)',
            color: 'var(--text-primary, #1e1e1e)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              borderRadius: 24,
              padding: '36px 24px',
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
              border: '1px solid var(--border, #eee)',
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 12 }}>✨</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800 }}>Fashion Store</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text-muted, #666)', lineHeight: 1.5 }}>
              សូមផ្ទុកទំព័រឡើងវិញ ដើម្បីបន្តការទិញទំនិញ។
              <br />
              Please reload the page to continue.
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="btn btn-primary"
              style={{
                padding: '12px 28px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              🔄 Refresh Page (ផ្ទុកទំព័រឡើងវិញ)
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

