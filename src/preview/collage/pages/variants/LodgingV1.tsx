import { useMemo } from 'react';
import { useActiveTrip } from '@/hooks/use-trip';
import { useAccommodations } from '@/hooks/use-accommodations';
import { useLocations } from '@/hooks/use-locations';
import { Stamp } from '../../ui/Stamp';
import { Tape } from '../../ui/Tape';
import { PolaroidCard } from '../../ui/PolaroidCard';
import { MarginNote } from '../../ui/MarginNote';
import { StickerPill } from '../../ui/StickerPill';
import type { Accommodation } from '@/types/accommodation';
import type { Location } from '@/types/trip';

/**
 * Lodging V1 — Concierge Card.
 * One honored hero paper card dominates the page, treating the chosen
 * accommodation as the star rather than a grid entry. Rubik Mono overline
 * ("YOUR STAY"), big IBM Plex Serif hotel name, Caveat address beneath,
 * a taped polaroid (mood=ink) labeled as the "room you'll come back to at night",
 * a meta list (check-in / check-out / confirmation # / phone), and a quiet
 * footer row of alternatives-considered dim chips.
 *
 * Thin-data defense: if there's no selected accommodation, the card softens
 * into a MarginNote + "no stay booked yet" pill instead of disappearing.
 * If address + venue are both present, we weave in venue-relative distance
 * notes from useLocations so the surface keeps its weight on one object.
 */
function fmtDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

// Extract a plausible confirmation code or notes hint without adding new schema.
// Accommodation.notes is freeform; if it contains "Conf: ABC123" we pull it.
function extractConfirmation(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const m = notes.match(/conf(?:irmation)?[\s#:.-]*([A-Z0-9-]{4,})/i);
  return m ? m[1] : null;
}

// A short "why we picked it" reason, falling back to a soft default.
function pickReason(notes: string | null | undefined): string {
  if (!notes) return 'walkable to the venue';
  const first = notes.split(/[.\n]/)[0]?.trim();
  if (first && first.length > 0 && first.length <= 64) return first.toLowerCase();
  return 'walkable to the venue';
}

export function LodgingV1() {
  const { data: trip } = useActiveTrip();
  const { data: accommodations = [] } = useAccommodations();
  const { data: locations = [] } = useLocations(trip?.id);

  const stay = useMemo<Accommodation | undefined>(
    () => accommodations.find(a => a.is_selected) ?? accommodations[0],
    [accommodations],
  );

  const alternatives = useMemo<Accommodation[]>(
    () => accommodations.filter(a => a.id !== stay?.id && !a.is_deprioritized).slice(0, 4),
    [accommodations, stay],
  );

  const venue = useMemo<Location | null>(() => {
    if (locations.length === 0) return null;
    const tripLoc = (trip?.location_name ?? '').toLowerCase();
    if (tripLoc) {
      const match = locations.find(l => l.name.toLowerCase().includes(tripLoc.split(',')[0].trim()));
      if (match) return match;
    }
    return locations[0];
  }, [locations, trip]);

  if (!trip) return <div style={{ padding: 80 }}>Loading…</div>;

  const confirmation = extractConfirmation(stay?.notes);
  const reason = pickReason(stay?.notes);

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 120px)',
        padding: 'clamp(32px, 5vw, 72px) clamp(20px, 5vw, 64px) 96px',
        maxWidth: 1040,
        marginInline: 'auto',
        position: 'relative',
      }}
    >
      {/* Floating margin notes frame the page without competing with the card */}
      <MarginNote
        rotate={-7}
        size={22}
        style={{ position: 'absolute', top: 36, left: 32 }}
      >
        the one we picked
      </MarginNote>
      <MarginNote
        rotate={5}
        size={22}
        style={{ position: 'absolute', top: 36, right: 32 }}
      >
        · {reason}
      </MarginNote>

      {/* HERO CARD — one honored object */}
      <article
        className="collage-enter lodging-hero"
        style={{
          position: 'relative',
          background: 'var(--c-paper)',
          boxShadow: 'var(--c-shadow)',
          padding: 'clamp(28px, 4vw, 48px) clamp(24px, 4vw, 56px) clamp(32px, 4vw, 52px)',
          marginTop: 72,
          display: 'grid',
          gridTemplateColumns: '1.35fr 1fr',
          gap: 'clamp(32px, 4vw, 56px)',
          alignItems: 'start',
        }}
      >
        <Tape position="top-left" rotate={-8} width={120} />
        <Tape position="top-right" rotate={6} width={104} />

        {/* LEFT COLUMN — text */}
        <div>
          <div
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 12,
              letterSpacing: '.26em',
              textTransform: 'uppercase',
              color: 'var(--c-pen)',
              marginBottom: 10,
            }}
          >
            your stay
          </div>

          <h1
            style={{
              fontFamily: 'var(--c-font-body)',
              fontWeight: 500,
              fontSize: 'clamp(32px, 4.4vw, 54px)',
              lineHeight: 1.05,
              letterSpacing: '-.01em',
              margin: 0,
              color: 'var(--c-ink)',
              maxWidth: '18ch',
            }}
          >
            {stay?.title ?? 'No stay booked yet'}
          </h1>

          {stay?.address && (
            <p
              aria-label={stay.address}
              style={{
                fontFamily: 'var(--c-font-script)',
                fontWeight: 600,
                fontSize: 24,
                color: 'var(--c-ink-muted)',
                margin: '14px 0 0',
                lineHeight: 1.25,
                maxWidth: '30ch',
              }}
            >
              {stay.address}
            </p>
          )}

          {!stay && (
            <div style={{ marginTop: 20 }}>
              <StickerPill variant="tape" rotate={-2}>
                no stay booked yet
              </StickerPill>
              <MarginNote rotate={-1} size={20} style={{ display: 'block', marginTop: 14 }}>
                pick a place to come back to →
              </MarginNote>
            </div>
          )}

          {/* META LIST */}
          {stay && (
            <dl
              style={{
                marginTop: 32,
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                columnGap: 20,
                rowGap: 10,
                fontFamily: 'var(--c-font-body)',
                fontSize: 15,
                color: 'var(--c-ink)',
                maxWidth: 420,
              }}
            >
              {stay.check_in && (
                <>
                  <dt style={metaLabelStyle}>check-in</dt>
                  <dd style={metaValueStyle}>{fmtDate(stay.check_in)}</dd>
                </>
              )}
              {stay.check_out && (
                <>
                  <dt style={metaLabelStyle}>check-out</dt>
                  <dd style={metaValueStyle}>{fmtDate(stay.check_out)}</dd>
                </>
              )}
              {confirmation && (
                <>
                  <dt style={metaLabelStyle}>confirm #</dt>
                  <dd style={{ ...metaValueStyle, fontVariantNumeric: 'tabular-nums' }}>
                    {confirmation}
                  </dd>
                </>
              )}
              {stay.url && (
                <>
                  <dt style={metaLabelStyle}>booking</dt>
                  <dd style={metaValueStyle}>
                    <a href={stay.url} target="_blank" rel="noreferrer noopener">
                      open reservation ↗
                    </a>
                  </dd>
                </>
              )}
              {venue && stay.address && (
                <>
                  <dt style={metaLabelStyle}>near</dt>
                  <dd style={{ ...metaValueStyle, fontStyle: 'italic', color: 'var(--c-ink-muted)' }}>
                    {truncate(venue.name, 40)}
                  </dd>
                </>
              )}
            </dl>
          )}
        </div>

        {/* RIGHT COLUMN — taped polaroid */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            paddingTop: 8,
          }}
        >
          <PolaroidCard
            mood="ink"
            rotate={4}
            size="md"
            tape
            entrance
            entranceDelayMs={120}
            overline="at night"
            caption={stay ? 'the room you\u2019ll come back to at night' : 'awaiting a choice'}
          />
        </div>
      </article>

      {/* ALTERNATIVES FOOTER — dim taped chips, only if present */}
      {alternatives.length > 0 && (
        <section
          style={{
            marginTop: 56,
            paddingTop: 28,
            borderTop: '2px dashed var(--c-ink)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Stamp variant="outline" size="sm" rotate={-2}>
              alternatives considered
            </Stamp>
            <MarginNote rotate={1} size={20} color="ink">
              — set aside, not forgotten
            </MarginNote>
          </div>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              opacity: 0.55,
            }}
          >
            {alternatives.map((a, i) => (
              <li key={a.id} style={{ position: 'relative' }}>
                <span
                  style={{
                    display: 'inline-block',
                    background: 'var(--c-paper)',
                    boxShadow: 'var(--c-shadow-sm)',
                    padding: '8px 14px 10px',
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 14,
                    color: 'var(--c-ink)',
                    transform: `rotate(${i % 2 === 0 ? -1 : 1}deg)`,
                    position: 'relative',
                  }}
                >
                  <Tape
                    position="top"
                    rotate={i % 2 === 0 ? -4 : 3}
                    width={40}
                    opacity={0.6}
                    style={{ top: -8 }}
                  />
                  {truncate(a.title, 28)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <style>{`
        @media (max-width: 820px) {
          .lodging-hero {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

const metaLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--c-font-display)',
  fontSize: 10,
  letterSpacing: '.22em',
  textTransform: 'uppercase',
  color: 'var(--c-ink-muted)',
  alignSelf: 'center',
};

const metaValueStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--c-font-body)',
  fontSize: 15,
  color: 'var(--c-ink)',
  lineHeight: 1.3,
};
