/**
 * Settings V1 — Inside Cover.
 *
 * The settings surface reads like the inside front cover of a book.
 * - Title plate at top: trip title in Rubik Mono One; Caveat subtitle "this book belongs to…".
 * - Tape-yellow accent at the top corner; ink hairline dividers between plates.
 * - Labeled plates in order: Identity, PIN, Display, Data.
 *   • Identity — who's using the app (name + avatar swatch; sample data).
 *   • PIN — masked current PIN dots + Stamp "CHANGE" button (visual only).
 *   • Display — theme + reduced-motion toggles (useState, no real persistence).
 *   • Data — Export + Clear buttons.
 *
 * Preview-only. Static sample data mirroring the real shape from usePin and
 * the active trip via useActiveTrip. Mutations are NOT wired; "editing" a
 * toggle is local useState so the affordance reads correctly.
 *
 * Mobile-first (390px); modal-size surface capped at 620px on desktop.
 * Respects prefers-reduced-motion via collage.css global.
 */
import { useState, CSSProperties, ReactNode } from 'react';
import { useActiveTrip } from '@/hooks/use-trip';
import { Stamp } from '../../ui/Stamp';
import { Tape } from '../../ui/Tape';
import { MarginNote } from '../../ui/MarginNote';
import '@/preview/collage/collage.css';

// Sample identity + PIN shape that mirrors usePin (hashed string) and TripMetadata.attendee.
const SAMPLE_IDENTITY = {
  preferredName: 'Shawn',
  avatar: '🦅',
  role: 'primary',
};
// usePin returns a hashed string or null; we just render masked dots.
const SAMPLE_PIN_SET = true;
const PIN_DOTS = 4;

export function SettingsV1() {
  const { data: trip } = useActiveTrip();

  const [theme, setTheme] = useState<'collage' | 'beach'>('collage');
  const [reducedMotion, setReducedMotion] = useState(false);

  const tripTitle = trip?.title ?? 'Untitled Trip';

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
          aria-label="Settings — Inside Cover"
          style={{
            position: 'relative',
            background: 'var(--c-paper)',
            boxShadow: 'var(--c-shadow)',
            width: 'min(620px, 100%)',
            padding: 'clamp(28px, 5vw, 44px) clamp(20px, 4vw, 40px) 48px',
          }}
        >
          <Tape position="top-right" rotate={8} width={96} />

          {/* TITLE PLATE */}
          <header style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ marginBottom: 10 }}>
              <Stamp variant="outline" size="sm" rotate={-3}>
                settings
              </Stamp>
            </div>
            <h1
              style={{
                fontFamily: 'var(--c-font-display)',
                fontSize: 'clamp(26px, 5vw, 40px)',
                letterSpacing: '.04em',
                lineHeight: 0.98,
                margin: '4px 0 0',
                color: 'var(--c-ink)',
              }}
            >
              {tripTitle.toUpperCase()}
            </h1>
            <div style={{ marginTop: 14 }}>
              <MarginNote rotate={-2} size={22}>
                this book belongs to…
              </MarginNote>
            </div>
          </header>

          <InkHairline />

          {/* IDENTITY PLATE */}
          <Plate label="identity" kicker="who's using the app">
            <Row>
              <span
                aria-hidden="true"
                style={{
                  fontSize: 34,
                  lineHeight: 1,
                  padding: 8,
                  background: 'var(--c-tape)',
                  display: 'inline-block',
                  borderRadius: 'var(--c-r-sm)',
                }}
              >
                {SAMPLE_IDENTITY.avatar}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 17,
                    fontWeight: 500,
                    color: 'var(--c-ink)',
                  }}
                >
                  {SAMPLE_IDENTITY.preferredName}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontStyle: 'italic',
                    fontSize: 13,
                    color: 'var(--c-ink-muted)',
                  }}
                >
                  {SAMPLE_IDENTITY.role} keeper
                </div>
              </div>
              <Stamp variant="outline" size="sm">edit</Stamp>
            </Row>
          </Plate>

          <InkHairline />

          {/* PIN PLATE */}
          <Plate label="pin" kicker="emoji PIN for entry">
            <Row>
              <div
                aria-label={`PIN is ${SAMPLE_PIN_SET ? 'set' : 'not set'}`}
                style={{ display: 'flex', gap: 10 }}
              >
                {Array.from({ length: PIN_DOTS }).map((_, i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 'var(--c-r-sm)',
                      border: '2px solid var(--c-ink)',
                      background: SAMPLE_PIN_SET ? 'var(--c-ink)' : 'transparent',
                    }}
                  />
                ))}
              </div>
              <div style={{ flex: 1 }} />
              <button
                type="button"
                onClick={() => { /* preview only */ }}
                style={stampButtonStyle}
              >
                <Stamp variant="ink" size="sm" rotate={-2}>change</Stamp>
              </button>
            </Row>
            <p style={helperText}>
              Four-emoji PIN, SHA-256 hashed locally. Last set when the book was bound.
            </p>
          </Plate>

          <InkHairline />

          {/* DISPLAY PLATE */}
          <Plate label="display" kicker="how the book feels">
            <Row>
              <span style={rowLabel}>Theme</span>
              <SegmentedToggle
                value={theme}
                options={[
                  { value: 'beach', label: 'Beach' },
                  { value: 'collage', label: 'Collage' },
                ]}
                onChange={(v) => setTheme(v as 'beach' | 'collage')}
              />
            </Row>
            <Row>
              <span style={rowLabel}>Reduced motion</span>
              <InkSwitch
                checked={reducedMotion}
                onChange={setReducedMotion}
                label="reduced motion"
              />
            </Row>
          </Plate>

          <InkHairline />

          {/* DATA PLATE */}
          <Plate label="data" kicker="what you take with you">
            <Row>
              <span style={rowLabel}>Export trip</span>
              <button type="button" style={stampButtonStyle}>
                <Stamp variant="outline" size="sm">download zip</Stamp>
              </button>
            </Row>
            <Row>
              <span style={{ ...rowLabel, color: 'var(--c-danger)' }}>Clear trip data</span>
              <button type="button" style={stampButtonStyle}>
                <Stamp
                  variant="outline"
                  size="sm"
                  style={{ color: 'var(--c-danger)', borderColor: 'var(--c-danger)' }}
                >
                  erase
                </Stamp>
              </button>
            </Row>
          </Plate>

          {/* COLOPHON */}
          <footer style={{ marginTop: 28, textAlign: 'center' }}>
            <MarginNote rotate={-1} size={18}>
              — keep this book safe
            </MarginNote>
          </footer>
        </section>
      </main>
    </div>
  );
}

// ——— helpers ———————————————————————————————————————————————————

function InkHairline() {
  return (
    <div
      aria-hidden="true"
      style={{
        height: 1,
        background: 'var(--c-ink)',
        opacity: 0.18,
        margin: '20px 0',
      }}
    />
  );
}

function Plate({
  label,
  kicker,
  children,
}: {
  label: string;
  kicker: string;
  children: ReactNode;
}) {
  return (
    <section style={{ padding: '4px 0' }}>
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
        <Stamp variant="ink" size="sm">{label}</Stamp>
        <span
          style={{
            fontFamily: 'var(--c-font-body)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--c-ink-muted)',
          }}
        >
          {kicker}
        </span>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        minHeight: 40,
        flexWrap: 'wrap',
      }}
    >
      {children}
    </div>
  );
}

const rowLabel: CSSProperties = {
  fontFamily: 'var(--c-font-body)',
  fontSize: 16,
  color: 'var(--c-ink)',
  flex: '1 1 auto',
  minWidth: 0,
};

const helperText: CSSProperties = {
  fontFamily: 'var(--c-font-body)',
  fontStyle: 'italic',
  fontSize: 13,
  color: 'var(--c-ink-muted)',
  margin: '6px 0 0',
  lineHeight: 1.5,
};

const stampButtonStyle: CSSProperties = {
  appearance: 'none',
  background: 'transparent',
  border: 0,
  padding: 0,
  cursor: 'pointer',
  lineHeight: 0,
};

function SegmentedToggle({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Theme"
      style={{
        display: 'inline-flex',
        border: '1.5px solid var(--c-ink)',
        borderRadius: 'var(--c-r-sm)',
        overflow: 'hidden',
      }}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            style={{
              appearance: 'none',
              cursor: 'pointer',
              background: active ? 'var(--c-ink)' : 'var(--c-paper)',
              color: active ? 'var(--c-creme)' : 'var(--c-ink)',
              border: 0,
              borderLeft: i === 0 ? 0 : '1.5px solid var(--c-ink)',
              fontFamily: 'var(--c-font-display)',
              fontSize: 11,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              padding: '10px 14px',
              lineHeight: 1,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function InkSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        appearance: 'none',
        cursor: 'pointer',
        width: 52,
        height: 28,
        borderRadius: 'var(--c-r-sm)',
        border: '1.5px solid var(--c-ink)',
        background: checked ? 'var(--c-ink)' : 'var(--c-paper)',
        position: 'relative',
        padding: 0,
        transition: 'background var(--c-t-fast) var(--c-ease-out)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 26 : 2,
          width: 20,
          height: 20,
          background: checked ? 'var(--c-tape)' : 'var(--c-ink)',
          borderRadius: 'var(--c-r-sm)',
          transition: 'left var(--c-t-fast) var(--c-ease-out), background var(--c-t-fast) var(--c-ease-out)',
        }}
      />
    </button>
  );
}
