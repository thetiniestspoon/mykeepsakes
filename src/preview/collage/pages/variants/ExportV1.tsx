/**
 * Export V1 — "Sealed Envelope".
 *
 * Collage-styled preview surface for the Export dialog. The frame is an
 * envelope: creme paper face with a tape-yellow wax-seal circle stamped
 * "SEAL" in pen-blue. Recipient / note fields read as address lines; the
 * format picker (PDF / PNG / LINK) is three ink-outlined stickers.
 *
 * When the user clicks "SEAL IT," a ribbon-underlay animation reveals
 * a tear-off strip below the envelope with a sample share URL and a
 * Caveat margin note "keep this safe." Purely visual — no hooks, no
 * Supabase writes. Sample data echoes the shape of `useExportTrip` +
 * `useTripShareLinks` without importing them.
 *
 * Mobile-first (390px). Respects prefers-reduced-motion via collage.css.
 */
import { useState } from 'react';
import '@/preview/collage/collage.css';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { MarginNote } from '../../ui/MarginNote';
import type { Trip, TripShareLink } from '@/types/trip';

// Sample data — shape matches real hooks, values are demo-only.
const SAMPLE_TRIP: Trip = {
  id: 'demo-trip-0001',
  title: 'Sankofa — CPE Residency',
  location_name: 'Memphis, TN',
  start_date: '2026-04-14',
  end_date: '2026-04-20',
  timezone: 'America/Chicago',
  metadata: {},
  created_at: '2026-03-01T12:00:00Z',
  updated_at: '2026-04-10T08:00:00Z',
};

const SAMPLE_LINK: TripShareLink = {
  id: 'demo-share-0001',
  trip_id: SAMPLE_TRIP.id,
  token: 'a4f1-keep-this-safe-c82e',
  permission: 'read',
  expires_at: null,
  created_at: '2026-04-17T10:00:00Z',
  dispatch_id: null,
};

type Format = 'pdf' | 'png' | 'link';

export function ExportV1() {
  const [format, setFormat] = useState<Format>('pdf');
  const [recipient, setRecipient] = useState('a friend');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('one week, one carry');
  const [includePhotos, setIncludePhotos] = useState(true);
  const [sealed, setSealed] = useState(false);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/mykeepsakes/shared/${SAMPLE_LINK.token}`
      : `/mykeepsakes/shared/${SAMPLE_LINK.token}`;

  return (
    <div className="collage-root">
      <main
        style={{
          padding: 'clamp(24px, 4vw, 48px) clamp(12px, 3vw, 32px) 96px',
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'start center',
        }}
      >
        <DemoBanner />

        <section
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 520,
            background: 'var(--c-creme)',
            border: '1.5px solid var(--c-ink)',
            padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 28px) 28px',
            boxShadow: 'var(--c-shadow)',
          }}
        >
          {/* Envelope flap — triangular crease along the top */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: -1,
              left: -1,
              right: -1,
              height: 70,
              background:
                'linear-gradient(180deg, rgba(29,29,27,0.04), rgba(29,29,27,0) 70%)',
              borderBottom: '1px dashed var(--c-line)',
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            }}
          />

          {/* Wax seal */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 36,
              left: '50%',
              transform: 'translateX(-50%) rotate(-4deg)',
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'var(--c-tape)',
              border: '2px solid var(--c-ink)',
              boxShadow: 'var(--c-shadow-sm)',
              display: 'grid',
              placeItems: 'center',
              zIndex: 2,
            }}
          >
            <Stamp variant="plain" size="sm" style={{ color: 'var(--c-pen)' }}>
              seal
            </Stamp>
          </div>

          <header style={{ marginTop: 90, marginBottom: 24, textAlign: 'center' }}>
            <Stamp variant="ink" size="md" rotate={-2}>
              export · envelope
            </Stamp>
            <p
              style={{
                fontFamily: 'var(--c-font-body)',
                fontStyle: 'italic',
                color: 'var(--c-ink-muted)',
                fontSize: 14,
                margin: '14px 0 0',
              }}
            >
              Seal the keepsakes from <strong style={{ fontStyle: 'normal' }}>{SAMPLE_TRIP.title}</strong>.
            </p>
          </header>

          {/* Envelope address lines */}
          <div style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
            <EnvelopeLine
              label="to"
              value={recipient}
              onChange={setRecipient}
              placeholder="a friend, a future self"
              disabled={sealed}
            />
            <EnvelopeLine
              label="email"
              value={email}
              onChange={setEmail}
              placeholder="optional — for a copy"
              type="email"
              disabled={sealed}
            />
            <EnvelopeLine
              label="note"
              value={note}
              onChange={setNote}
              placeholder="one line across the back of the envelope"
              disabled={sealed}
            />
          </div>

          {/* Format pickers — three ink-outlined stickers */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontFamily: 'var(--c-font-display)',
                fontSize: 10,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                color: 'var(--c-ink-muted)',
                marginBottom: 10,
              }}
            >
              format
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {(['pdf', 'png', 'link'] as Format[]).map((f, i) => (
                <FormatSticker
                  key={f}
                  label={f}
                  active={format === f}
                  rotate={i === 0 ? -2 : i === 2 ? 2 : 0}
                  onClick={() => !sealed && setFormat(f)}
                />
              ))}
            </div>
          </div>

          {/* Include photos toggle — rendered as a checkbox line */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              border: '1px dashed var(--c-line)',
              borderRadius: 'var(--c-r-sm)',
              marginBottom: 22,
              cursor: sealed ? 'default' : 'pointer',
              opacity: sealed ? 0.6 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={includePhotos}
              disabled={sealed}
              onChange={e => setIncludePhotos(e.target.checked)}
              style={{ accentColor: 'var(--c-pen)' }}
            />
            <span
              style={{
                fontFamily: 'var(--c-font-body)',
                fontSize: 14,
                color: 'var(--c-ink)',
              }}
            >
              Include photos
              <span
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--c-ink-muted)',
                  fontStyle: 'italic',
                }}
              >
                may increase download size
              </span>
            </span>
          </label>

          {/* Action row */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => setSealed(true)}
              disabled={sealed}
              style={{
                appearance: 'none',
                cursor: sealed ? 'default' : 'pointer',
                border: 0,
                padding: '12px 22px',
                background: sealed ? 'var(--c-ink-muted)' : 'var(--c-ink)',
                color: 'var(--c-creme)',
                fontFamily: 'var(--c-font-display)',
                fontSize: 13,
                letterSpacing: '.26em',
                textTransform: 'uppercase',
                borderRadius: 'var(--c-r-sm)',
                boxShadow: 'var(--c-shadow-sm)',
                transform: 'rotate(-2deg)',
                transition: 'transform var(--c-t-fast) var(--c-ease-out)',
              }}
              onMouseOver={ev => {
                if (!sealed)
                  ev.currentTarget.style.transform = 'rotate(-2deg) translate(-2px,-2px)';
              }}
              onMouseOut={ev => (ev.currentTarget.style.transform = 'rotate(-2deg)')}
            >
              {sealed ? 'sealed' : 'seal it'}
            </button>
            {sealed && (
              <MarginNote rotate={-3} size={22}>
                keep this safe
              </MarginNote>
            )}
          </div>

          {/* Ribbon-underlay tear-off strip: reveals on seal */}
          <div
            aria-live="polite"
            style={{
              marginTop: 28,
              maxHeight: sealed ? 220 : 0,
              overflow: 'hidden',
              transition: 'max-height var(--c-t-slow) var(--c-ease-out)',
            }}
          >
            <div
              style={{
                position: 'relative',
                marginTop: 8,
                background: 'var(--c-paper)',
                borderTop: '2px dashed var(--c-ink)',
                padding: '18px 16px 16px',
              }}
            >
              {/* ribbon underlay */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 10,
                  height: 20,
                  background:
                    'linear-gradient(90deg, rgba(246,213,92,0) 0%, rgba(246,213,92,0.6) 50%, rgba(246,213,92,0) 100%)',
                  transform: 'skewX(-8deg)',
                }}
              />
              <div
                style={{
                  position: 'relative',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 10,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  color: 'var(--c-ink-muted)',
                  marginBottom: 8,
                }}
              >
                tear here · share link
              </div>
              <code
                style={{
                  display: 'block',
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 14,
                  color: 'var(--c-pen)',
                  wordBreak: 'break-all',
                  lineHeight: 1.4,
                }}
              >
                {shareUrl}
              </code>
              <div
                style={{
                  marginTop: 12,
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <StickerPill variant="pen">
                  {format === 'link' ? 'link ready' : `${format} + link`}
                </StickerPill>
                {includePhotos && <StickerPill variant="tape">photos in</StickerPill>}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function EnvelopeLine({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label style={{ display: 'grid', gridTemplateColumns: '56px 1fr', alignItems: 'end', gap: 10 }}>
      <span
        style={{
          fontFamily: 'var(--c-font-display)',
          fontSize: 10,
          letterSpacing: '.22em',
          textTransform: 'uppercase',
          color: 'var(--c-ink)',
          paddingBottom: 6,
        }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          background: 'transparent',
          border: 0,
          borderBottom: '1.5px solid var(--c-ink)',
          fontFamily: 'var(--c-font-body)',
          fontSize: 16,
          color: 'var(--c-ink)',
          padding: '6px 0',
          outline: 'none',
        }}
        onFocus={ev => (ev.currentTarget.style.borderBottomColor = 'var(--c-pen)')}
        onBlur={ev => (ev.currentTarget.style.borderBottomColor = 'var(--c-ink)')}
      />
    </label>
  );
}

function FormatSticker({
  label,
  active,
  rotate,
  onClick,
}: {
  label: string;
  active: boolean;
  rotate: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        appearance: 'none',
        cursor: 'pointer',
        padding: '8px 14px',
        background: active ? 'var(--c-pen)' : 'transparent',
        color: active ? 'var(--c-creme)' : 'var(--c-pen)',
        border: '1.5px solid var(--c-pen)',
        borderRadius: 'var(--c-r-sm)',
        fontFamily: 'var(--c-font-display)',
        fontSize: 11,
        letterSpacing: '.24em',
        textTransform: 'uppercase',
        lineHeight: 1,
        transform: `rotate(${rotate}deg)`,
        boxShadow: active ? 'var(--c-shadow-sm)' : undefined,
        transition: 'background var(--c-t-fast), color var(--c-t-fast)',
      }}
    >
      {label}
    </button>
  );
}

function DemoBanner() {
  return (
    <div
      style={{
        background: 'rgba(31, 60, 198, 0.08)',
        border: '1px dashed var(--c-pen)',
        padding: '8px 12px',
        marginBottom: 24,
        fontSize: 12,
        color: 'var(--c-pen)',
        fontFamily: 'var(--c-font-body)',
        display: 'inline-block',
        letterSpacing: '.02em',
      }}
    >
      <strong>Demo</strong> — export preview · no files written, no links minted.
    </div>
  );
}
