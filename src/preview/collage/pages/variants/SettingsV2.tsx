/**
 * Settings V2 — Receipt Pad.
 *
 * Audit/log aesthetic. Every preference reads as a dated receipt row.
 * - Dashed ink line above each row (the perforation).
 * - Left column: label + current value; Right margin: Caveat date.
 * - Each row has an "EDIT" StickerPill affordance.
 * - Footer: running "last changed" line in pen-blue Caveat.
 *
 * Sections: identity, PIN, theme, reduced motion, export, clear.
 * Sample data mirrors usePin (hashed string or null, just rendered as masked
 * dots) and the active trip via useActiveTrip. Mutations are NOT wired —
 * editing a row toggles local useState so the ledger reads correctly.
 *
 * Mobile-first (390px); modal-size surface capped at 680px on desktop.
 * Respects prefers-reduced-motion via collage.css global.
 */
import { useState, CSSProperties, ReactNode } from 'react';
import { useActiveTrip } from '@/hooks/use-trip';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { MarginNote } from '../../ui/MarginNote';
import '@/preview/collage/collage.css';

// Sample ledger rows — dates are display-only (no real mutation timestamps).
type RowId = 'identity' | 'pin' | 'theme' | 'motion' | 'export' | 'clear';

interface LedgerRow {
  id: RowId;
  label: string;
  value: ReactNode;
  changedOn: string; // human-readable
  destructive?: boolean;
}

const INITIAL_THEME: 'collage' | 'beach' = 'collage';
const INITIAL_MOTION = false;

export function SettingsV2() {
  const { data: trip } = useActiveTrip();

  const [theme, setTheme] = useState<'collage' | 'beach'>(INITIAL_THEME);
  const [motion, setMotion] = useState(INITIAL_MOTION);
  const [lastChanged, setLastChanged] = useState<{ what: string; when: string } | null>(null);

  const stamp = (what: string) => {
    const now = new Date();
    const when = now.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    setLastChanged({ what, when });
  };

  const rows: LedgerRow[] = [
    {
      id: 'identity',
      label: 'Identity',
      value: (
        <span>
          <span style={{ marginRight: 6 }} aria-hidden="true">🦅</span>
          Shawn <span style={mutedItalic}>(primary keeper)</span>
        </span>
      ),
      changedOn: 'Apr 10, 2026',
    },
    {
      id: 'pin',
      label: 'Emoji PIN',
      value: (
        <span aria-label="PIN is set (4 emoji, hashed)">
          <MaskedPin />
          <span style={{ ...mutedItalic, marginLeft: 10 }}>4-emoji · hashed</span>
        </span>
      ),
      changedOn: 'Apr 10, 2026',
    },
    {
      id: 'theme',
      label: 'Theme',
      value: (
        <span>
          {theme === 'collage' ? 'Collage (preview)' : 'Beach (production)'}
        </span>
      ),
      changedOn: lastChanged?.what === 'Theme' ? lastChanged.when : 'Apr 17, 2026',
    },
    {
      id: 'motion',
      label: 'Reduced motion',
      value: <span>{motion ? 'On' : 'Off — follow system'}</span>,
      changedOn: lastChanged?.what === 'Reduced motion' ? lastChanged.when : 'Apr 03, 2026',
    },
    {
      id: 'export',
      label: 'Export trip',
      value: <span style={mutedItalic}>download .zip — itinerary, memories, photos</span>,
      changedOn: 'never exported',
    },
    {
      id: 'clear',
      label: 'Clear trip data',
      value: <span style={mutedItalic}>permanently delete "{trip?.title ?? 'this trip'}"</span>,
      changedOn: '—',
      destructive: true,
    },
  ];

  const onEdit = (id: RowId) => {
    // Preview-only: demo "editing" via local state where it makes sense.
    if (id === 'theme') {
      const next = theme === 'collage' ? 'beach' : 'collage';
      setTheme(next);
      stamp('Theme');
    } else if (id === 'motion') {
      setMotion((m) => !m);
      stamp('Reduced motion');
    }
    // identity / pin / export / clear: no-op (would route to real flows).
  };

  return (
    <div className="collage-root">
      <main
        style={{
          minHeight: '100vh',
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'start center',
          padding: 'clamp(20px, 4vw, 48px) clamp(14px, 3vw, 32px) 80px',
        }}
      >
        <section
          aria-label="Settings — Receipt Pad"
          style={{
            position: 'relative',
            background: 'var(--c-paper)',
            boxShadow: 'var(--c-shadow)',
            width: 'min(680px, 100%)',
            padding: 'clamp(24px, 4vw, 40px) clamp(18px, 3.5vw, 36px) 36px',
          }}
        >
          {/* Header block: ledger masthead */}
          <header
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16,
              flexWrap: 'wrap',
              marginBottom: 8,
            }}
          >
            <div>
              <Stamp variant="ink" size="md">settings</Stamp>
              <div
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: 'var(--c-ink-muted)',
                  marginTop: 8,
                }}
              >
                ledger · every preference is dated
              </div>
            </div>
            <MarginNote rotate={-2} size={20}>
              receipt pad
            </MarginNote>
          </header>

          <TopDashedRule />

          {/* Receipt rows */}
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {rows.map((r) => (
              <ReceiptRow key={r.id} row={r} onEdit={() => onEdit(r.id)} />
            ))}
          </ol>

          {/* Footer: last changed */}
          <footer
            style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: '2px dashed var(--c-ink)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--c-font-script)',
                fontWeight: 600,
                fontSize: 20,
                color: 'var(--c-pen)',
                lineHeight: 1.3,
              }}
            >
              {lastChanged
                ? `last changed — ${lastChanged.what.toLowerCase()} · ${lastChanged.when}`
                : 'last changed — theme · apr 17, 9:14am'}
            </div>
            <div
              style={{
                fontFamily: 'var(--c-font-body)',
                fontStyle: 'italic',
                fontSize: 12,
                color: 'var(--c-ink-muted)',
                marginTop: 6,
              }}
            >
              Preview surface · mutations not persisted.
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}

// ——— helpers ———————————————————————————————————————————————————

function TopDashedRule() {
  return (
    <div
      aria-hidden="true"
      style={{
        borderTop: '1.5px dashed var(--c-ink)',
        opacity: 0.55,
        margin: '18px 0 6px',
      }}
    />
  );
}

function ReceiptRow({ row, onEdit }: { row: LedgerRow; onEdit: () => void }) {
  return (
    <li style={{ listStyle: 'none' }}>
      {/* perforation above each row */}
      <div
        aria-hidden="true"
        style={{
          borderTop: '1px dashed var(--c-ink)',
          opacity: 0.4,
          margin: '14px 0 12px',
        }}
      />
      <article
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          columnGap: 16,
          rowGap: 8,
          alignItems: 'center',
        }}
      >
        {/* LEFT: label + value */}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 10,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              color: row.destructive ? 'var(--c-danger)' : 'var(--c-pen)',
              marginBottom: 6,
            }}
          >
            {row.label}
          </div>
          <div
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 16,
              color: row.destructive ? 'var(--c-danger)' : 'var(--c-ink)',
              lineHeight: 1.4,
              overflowWrap: 'anywhere',
            }}
          >
            {row.value}
          </div>
        </div>

        {/* RIGHT: edit + date margin */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${row.label}`}
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 0,
              padding: 0,
              cursor: 'pointer',
              lineHeight: 0,
            }}
          >
            <StickerPill
              variant={row.destructive ? 'ink' : 'pen'}
              rotate={row.destructive ? 1 : -1}
            >
              {row.destructive ? 'erase' : 'edit'}
            </StickerPill>
          </button>
          <MarginNote rotate={-3} size={18} color="ink">
            {row.changedOn}
          </MarginNote>
        </div>
      </article>
    </li>
  );
}

function MaskedPin() {
  return (
    <span style={{ display: 'inline-flex', gap: 6, verticalAlign: 'middle' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            width: 16,
            height: 16,
            borderRadius: 'var(--c-r-sm)',
            background: 'var(--c-ink)',
            display: 'inline-block',
          }}
        />
      ))}
    </span>
  );
}

const mutedItalic: CSSProperties = {
  fontStyle: 'italic',
  color: 'var(--c-ink-muted)',
  fontSize: 14,
};
