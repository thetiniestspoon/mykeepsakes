/**
 * Export V2 — "Address Label".
 *
 * Collage-styled preview: the export surface is framed as an addressed
 * parcel. A big creme address-label rectangle with an ink border sits at
 * the top of the card, stamped "TO:" with recipient email + note fields
 * inside the label, and a FROM: return-address block above the label.
 * A format chip row (PDF / PNG / LINK) sits at the bottom — the artifact
 * is the letter, the send is secondary.
 *
 * Status is surfaced as a postmark-circle overlay ("READY" → "COPIED")
 * driven purely by useState. No hooks called, no API invoked. Sample
 * data matches the shape of `useExportTrip` + `useTripShareLinks`.
 *
 * Mobile-first (390px). Respects prefers-reduced-motion via collage.css.
 */
import { useState } from 'react';
import '@/preview/collage/collage.css';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { MarginNote } from '../../ui/MarginNote';
import type { Trip, TripShareLink } from '@/types/trip';

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
  id: 'demo-share-0002',
  trip_id: SAMPLE_TRIP.id,
  token: 'b9e3-postmarked-2f11',
  permission: 'read',
  expires_at: null,
  created_at: '2026-04-17T10:00:00Z',
  dispatch_id: null,
};

type Format = 'pdf' | 'png' | 'link';
type Status = 'idle' | 'ready' | 'copied';

export function ExportV2() {
  const [format, setFormat] = useState<Format>('pdf');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [note, setNote] = useState('');
  const [includePhotos, setIncludePhotos] = useState(true);
  const [status, setStatus] = useState<Status>('idle');

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/mykeepsakes/shared/${SAMPLE_LINK.token}`
      : `/mykeepsakes/shared/${SAMPLE_LINK.token}`;

  const tripLabel = SAMPLE_TRIP.title.replace(/\s*[–-].*$/, '');

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
            background: 'var(--c-paper)',
            padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 28px)',
            boxShadow: 'var(--c-shadow)',
            border: '1px solid var(--c-line)',
          }}
        >
          {/* FROM return address block */}
          <div
            style={{
              marginBottom: 14,
              paddingBottom: 10,
              borderBottom: '1px dashed var(--c-line)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--c-font-display)',
                fontSize: 10,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                color: 'var(--c-ink-muted)',
                marginBottom: 4,
              }}
            >
              from
            </div>
            <div
              style={{
                fontFamily: 'var(--c-font-body)',
                fontSize: 14,
                color: 'var(--c-ink)',
                lineHeight: 1.4,
              }}
            >
              {tripLabel}
              <br />
              <span style={{ color: 'var(--c-ink-muted)' }}>
                {SAMPLE_TRIP.location_name} · {SAMPLE_TRIP.start_date} → {SAMPLE_TRIP.end_date}
              </span>
            </div>
          </div>

          {/* Big TO: address label */}
          <div
            style={{
              position: 'relative',
              background: 'var(--c-creme)',
              border: '2px solid var(--c-ink)',
              borderRadius: 'var(--c-r-sm)',
              padding: '20px 18px 18px',
              marginBottom: 22,
            }}
          >
            <div style={{ position: 'absolute', top: -12, left: 12 }}>
              <Stamp variant="ink" size="sm" rotate={-3}>
                to:
              </Stamp>
            </div>

            {/* Postmark overlay — appears on send */}
            {status !== 'idle' && (
              <div
                aria-live="polite"
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 10,
                  width: 88,
                  height: 88,
                  borderRadius: '50%',
                  border: '2px solid var(--c-pen)',
                  color: 'var(--c-pen)',
                  display: 'grid',
                  placeItems: 'center',
                  transform: 'rotate(-12deg)',
                  boxShadow: 'var(--c-shadow-sm)',
                  background: 'rgba(247, 243, 233, 0.85)',
                  animation: 'collage-shuffle-in var(--c-t-med) var(--c-ease-out) both',
                }}
              >
                <Stamp variant="plain" size="sm" style={{ color: 'var(--c-pen)' }}>
                  {status}
                </Stamp>
              </div>
            )}

            <label style={{ display: 'block', marginTop: 8, marginBottom: 14 }}>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 10,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  color: 'var(--c-ink-muted)',
                  marginBottom: 4,
                }}
              >
                recipient email
              </span>
              <input
                type="email"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                placeholder="friend@example.com"
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

            <label style={{ display: 'block' }}>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 10,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  color: 'var(--c-ink-muted)',
                  marginBottom: 4,
                }}
              >
                note (optional)
              </span>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                placeholder="a sentence for the package slip"
                style={{
                  width: '100%',
                  resize: 'vertical',
                  background: 'transparent',
                  border: '1px dashed var(--c-line)',
                  borderRadius: 'var(--c-r-sm)',
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 15,
                  color: 'var(--c-ink)',
                  padding: '8px 10px',
                  outline: 'none',
                  minHeight: 68,
                }}
                onFocus={ev => (ev.currentTarget.style.borderColor = 'var(--c-pen)')}
                onBlur={ev => (ev.currentTarget.style.borderColor = 'var(--c-line)')}
              />
            </label>

            <div
              style={{
                marginTop: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <input
                id="export-v2-photos"
                type="checkbox"
                checked={includePhotos}
                onChange={e => setIncludePhotos(e.target.checked)}
                style={{ accentColor: 'var(--c-pen)' }}
              />
              <label
                htmlFor="export-v2-photos"
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 13,
                  color: 'var(--c-ink)',
                  cursor: 'pointer',
                }}
              >
                Include photos
              </label>
            </div>
          </div>

          {/* Share link readout */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontFamily: 'var(--c-font-display)',
                fontSize: 10,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                color: 'var(--c-ink-muted)',
                marginBottom: 6,
              }}
            >
              share url
            </div>
            <code
              style={{
                display: 'block',
                padding: '10px 12px',
                background: 'var(--c-creme)',
                border: '1px solid var(--c-line)',
                borderRadius: 'var(--c-r-sm)',
                fontFamily: 'var(--c-font-body)',
                fontSize: 13,
                color: 'var(--c-pen)',
                wordBreak: 'break-all',
                lineHeight: 1.4,
              }}
            >
              {shareUrl}
            </code>
            <MarginNote rotate={-2} size={18} style={{ display: 'inline-block', marginTop: 8 }}>
              the artifact
            </MarginNote>
          </div>

          {/* Format chip row */}
          <div
            style={{
              paddingTop: 16,
              borderTop: '1px dashed var(--c-line)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['pdf', 'png', 'link'] as Format[]).map(f => (
                <FormatChip
                  key={f}
                  label={f}
                  active={format === f}
                  onClick={() => setFormat(f)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                if (status === 'idle') setStatus('ready');
                else setStatus('copied');
              }}
              style={{
                appearance: 'none',
                cursor: 'pointer',
                border: 0,
                padding: '10px 18px',
                background: 'var(--c-ink)',
                color: 'var(--c-creme)',
                fontFamily: 'var(--c-font-display)',
                fontSize: 12,
                letterSpacing: '.26em',
                textTransform: 'uppercase',
                borderRadius: 'var(--c-r-sm)',
                boxShadow: 'var(--c-shadow-sm)',
                transform: 'rotate(-1deg)',
                transition: 'transform var(--c-t-fast) var(--c-ease-out)',
              }}
              onMouseOver={ev =>
                (ev.currentTarget.style.transform = 'rotate(-1deg) translate(-2px,-2px)')
              }
              onMouseOut={ev => (ev.currentTarget.style.transform = 'rotate(-1deg)')}
            >
              {status === 'copied' ? 'copied' : status === 'ready' ? 'copy link' : 'send'}
            </button>
          </div>

          {status !== 'idle' && (
            <div style={{ marginTop: 14 }}>
              <StickerPill variant="tape">
                {status === 'copied' ? 'url on clipboard · demo' : 'package ready'}
              </StickerPill>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function FormatChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
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
        padding: '8px 12px',
        background: active ? 'var(--c-ink)' : 'transparent',
        color: active ? 'var(--c-creme)' : 'var(--c-ink)',
        border: `1.5px solid var(--c-ink)`,
        borderRadius: 'var(--c-r-sm)',
        fontFamily: 'var(--c-font-display)',
        fontSize: 10,
        letterSpacing: '.24em',
        textTransform: 'uppercase',
        lineHeight: 1,
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
      <strong>Demo</strong> — address-label preview · no export, no clipboard write.
    </div>
  );
}
