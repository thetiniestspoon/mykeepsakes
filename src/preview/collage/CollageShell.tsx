import { useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { CollageRoot } from './CollageRoot';

type Tab = { to: string; label: string; key?: string; group: 'primary' | 'capture' | 'system' };
const TABS: readonly Tab[] = [
  { to: 'dashboard',  label: 'Dashboard',  key: '1', group: 'primary' },
  { to: 'day',        label: 'Day',        key: '2', group: 'primary' },
  { to: 'guide',      label: 'Guide',      key: '3', group: 'primary' },
  { to: 'map',        label: 'Map',        key: '4', group: 'primary' },
  { to: 'people',     label: 'People',     key: '5', group: 'primary' },
  { to: 'album',      label: 'Album',      key: '6', group: 'primary' },
  { to: 'lodging',    label: 'Lodging',    key: '7', group: 'primary' },
  { to: 'memory',     label: 'Memory',     key: '8', group: 'primary' },
  { to: 'dispatch',   label: 'Dispatch',   key: '9', group: 'capture' },
  { to: 'reflection', label: 'Reflect',              group: 'capture' },
  { to: 'connection', label: 'Connect',              group: 'capture' },
  { to: 'trips',      label: 'Trips',                group: 'system' },
  { to: 'favorites',  label: 'Favorites',            group: 'system' },
  { to: 'export',     label: 'Export',               group: 'system' },
  { to: 'settings',   label: 'Settings',             group: 'system' },
  { to: 'pin',        label: 'PIN',                  group: 'system' },
];

const VARIANT_LABEL: Record<string, string> = {
  '1': 'Layout 1',
  '2': 'Layout 2',
  '3': 'Layout 3',
};

// Each surface ships with its own number of variants.
const VARIANT_COUNT: Record<string, number> = {
  dashboard: 3,
  day: 3,
  memory: 3,
  pin: 3,
  map: 2,
  people: 2,
  guide: 2,
  album: 2,
  dispatch: 2,
  lodging: 2,
  reflection: 2,
  connection: 2,
  favorites: 2,
  export: 2,
  settings: 2,
  trips: 2,
};

export function CollageShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const v = searchParams.get('v') ?? '1';

  // Helper: build a URL that preserves the current ?v
  const withV = (path: string) => {
    const qs = v && v !== '1' ? `?v=${v}` : '';
    return `${path}${qs}`;
  };

  // Helper: swap the ?v on the current path
  const swapV = (newV: string) => {
    const path = location.pathname;
    return newV === '1' ? path : `${path}?v=${newV}`;
  };

  // Which tab path is currently active?
  const currentTabPath = (() => {
    const seg = location.pathname.split('/').filter(Boolean)[2] ?? 'dashboard';
    return seg;
  })();

  // Keyboard shortcuts 1..4 for tab switch (preserving v)
  // and q/w/e for layout 1/2/3
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      const tab = TABS.find(t => t.key === e.key);
      if (tab) {
        navigate(withV(`/preview/collage/${tab.to}`));
        return;
      }
      if (e.key === 'q' || e.key === 'Q') navigate(swapV('1'));
      if (e.key === 'w' || e.key === 'W') navigate(swapV('2'));
      if (e.key === 'e' || e.key === 'E') navigate(swapV('3'));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, location.pathname, v]);

  // Redirect bare /preview/collage to /preview/collage/dashboard (preserving v)
  useEffect(() => {
    if (location.pathname === '/preview/collage' || location.pathname === '/preview/collage/') {
      navigate(withV('/preview/collage/dashboard'), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <CollageRoot>
      {/* Main tab bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          padding: '10px 20px',
          background: '#0F0F0E',
          color: '#F5F1EA',
          borderBottom: '1px solid rgba(255,255,255,.08)',
          fontFamily: 'var(--c-font-body)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 500 }}>
          <span aria-hidden style={{ color: '#F6D55C' }}>▲</span>
          <strong>MyKeepsakes</strong>
          <span style={{ opacity: 0.6, fontSize: 12 }}>/ preview · collage</span>
        </div>

        <nav role="tablist" aria-label="Collage preview tabs" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {TABS.map((t, i) => {
            const isActive = currentTabPath === t.to;
            const prev = TABS[i - 1];
            const showSeparator = prev && prev.group !== t.group;
            return (
              <span key={t.to} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {showSeparator && (
                  <span aria-hidden style={{ width: 1, height: 18, background: 'rgba(255,255,255,.14)' }} />
                )}
                <Link
                  to={withV(`/preview/collage/${t.to}`)}
                  style={{
                    textDecoration: 'none',
                    fontSize: 13,
                    padding: '7px 14px',
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,.12)',
                    background: isActive ? '#F5F1EA' : 'transparent',
                    color: isActive ? '#0F0F0E' : '#F5F1EA',
                    transition: 'background 180ms ease, color 180ms ease, border-color 180ms ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: t.group === 'capture' || t.group === 'system' ? 0.85 : 1,
                  }}
                >
                  {t.key && (
                    <kbd
                      aria-hidden
                      style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontSize: 10,
                        opacity: 0.6,
                        border: '1px solid currentColor',
                        borderRadius: 3,
                        padding: '0 4px',
                        lineHeight: 1.4,
                      }}
                    >
                      {t.key}
                    </kbd>
                  )}
                  {t.label}
                </Link>
              </span>
            );
          })}
        </nav>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/preview/collage-shared"
            style={{
              color: '#0F0F0E',
              background: '#F6D55C',
              textDecoration: 'none',
              fontSize: 12,
              fontWeight: 600,
              padding: '7px 14px',
              border: '1px solid #F6D55C',
              borderRadius: 999,
              boxShadow: '0 2px 0 rgba(0,0,0,.2)',
            }}
            title="Open the public shared-trip view (no shell chrome, feels like opening a letter)"
          >
            👁  Preview as visitor
          </Link>
          <Link
            to="/"
            style={{
              color: '#F5F1EA',
              textDecoration: 'none',
              fontSize: 12,
              padding: '7px 12px',
              border: '1px solid rgba(255,255,255,.12)',
              borderRadius: 999,
            }}
          >
            ← Back to Beach theme
          </Link>
        </div>
      </div>

      {/* Layout variant switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          padding: '10px 20px',
          background: '#1B1B1A',
          color: '#C9C2B4',
          borderBottom: '1px solid rgba(255,255,255,.06)',
          fontFamily: 'var(--c-font-body)',
          flexWrap: 'wrap',
          fontSize: 12,
        }}
      >
        <span style={{ letterSpacing: '.22em', textTransform: 'uppercase', fontSize: 10, opacity: 0.7 }}>
          Layout
        </span>
        {Array.from({ length: VARIANT_COUNT[currentTabPath] ?? 3 }, (_, i) => String(i + 1)).map(n => {
          const active = v === n;
          return (
            <Link
              key={n}
              to={swapV(n)}
              style={{
                textDecoration: 'none',
                fontSize: 12,
                padding: '6px 12px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,.14)',
                background: active ? '#F6D55C' : 'transparent',
                color: active ? '#0F0F0E' : '#F5F1EA',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'background 160ms ease, color 160ms ease',
              }}
            >
              <kbd
                aria-hidden
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 9,
                  opacity: 0.7,
                  border: '1px solid currentColor',
                  borderRadius: 3,
                  padding: '0 4px',
                  lineHeight: 1.4,
                }}
              >
                {n === '1' ? 'Q' : n === '2' ? 'W' : 'E'}
              </kbd>
              V{n} · {VARIANT_LABEL[n]}
            </Link>
          );
        })}
      </div>

      {/* demo-mode banner */}
      <div
        style={{
          padding: '8px 20px',
          fontSize: 12,
          fontFamily: 'var(--c-font-body)',
          color: 'var(--c-ink-muted)',
          background: 'rgba(31, 60, 198, 0.06)',
          borderBottom: '1px solid rgba(31, 60, 198, 0.18)',
          letterSpacing: '.02em',
        }}
      >
        Rendering real Supabase data through the Collage direction. Read-only preview. Switch layouts with <kbd style={kbdStyle}>Q</kbd> <kbd style={kbdStyle}>W</kbd> <kbd style={kbdStyle}>E</kbd> · pages with <kbd style={kbdStyle}>1</kbd>–<kbd style={kbdStyle}>9</kbd>.
      </div>

      <Outlet />
    </CollageRoot>
  );
}

const kbdStyle: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 10,
  border: '1px solid currentColor',
  borderRadius: 3,
  padding: '0 4px',
  lineHeight: 1.4,
  margin: '0 2px',
};
