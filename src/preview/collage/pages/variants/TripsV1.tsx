import { useMemo, useState } from 'react';
import { useTrips, useActiveTrip, getTripMode } from '@/hooks/use-trip';
import { Stamp } from '../../ui/Stamp';
import { Tape } from '../../ui/Tape';
import { PolaroidCard } from '../../ui/PolaroidCard';
import { MarginNote } from '../../ui/MarginNote';
import type { Trip } from '@/types/trip';
import '@/preview/collage/collage.css';

/**
 * Trips V1 — Bookshelf.
 * Trips arranged as book spines on a ruled shelf (no wood photo — evoke it with
 * horizontal ink ruling below the spines). Each spine is a tall vertical card with
 * the trip title stacked top-to-bottom in Rubik Mono One, date range in Caveat
 * running down the spine, and a tape-yellow bookmark strip on the active trip.
 * Tapping a spine "opens the book" — a mini polaroid + tagline preview fades in
 * below the shelf. Gracefully handles single-trip by adding a ghost spine sibling.
 * Mobile-first (390px), respects prefers-reduced-motion via collage.css globals.
 */

function fmtDateRangeShort(startISO: string, endISO: string) {
  const s = new Date(startISO);
  const e = new Date(endISO);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return '';
  const sameYear = s.getFullYear() === e.getFullYear();
  const sameMonth = sameYear && s.getMonth() === e.getMonth();
  const sMon = s.toLocaleString('en-US', { month: 'short' });
  const eMon = e.toLocaleString('en-US', { month: 'short' });
  if (sameMonth) return `${sMon} ${s.getDate()}–${e.getDate()} · ${e.getFullYear()}`;
  if (sameYear) return `${sMon} ${s.getDate()} – ${eMon} ${e.getDate()} · ${e.getFullYear()}`;
  return `${sMon} ${s.getDate()}, ${s.getFullYear()} – ${eMon} ${e.getDate()}, ${e.getFullYear()}`;
}

// Deterministic spine variant from id — gives each book a different color family
function spineVariant(id: string): 'ink' | 'pen' | 'creme' {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum = (sum + id.charCodeAt(i)) % 3;
  if (sum === 0) return 'ink';
  if (sum === 1) return 'pen';
  return 'creme';
}

type SpineData = {
  id: string;
  title: string;
  dateRange: string;
  isActive: boolean;
  isGhost: false;
  variant: 'ink' | 'pen' | 'creme';
  mode: 'pre' | 'active' | 'post';
  locationName: string | null;
};

type GhostSpine = {
  id: string;
  isGhost: true;
};

export function TripsV1() {
  const { data: trips = [], isLoading } = useTrips();
  const { data: activeTrip } = useActiveTrip();
  const [openedId, setOpenedId] = useState<string | null>(null);

  const spines = useMemo<Array<SpineData | GhostSpine>>(() => {
    const built: Array<SpineData | GhostSpine> = trips.map((t: Trip) => ({
      id: t.id,
      title: t.title,
      dateRange: fmtDateRangeShort(t.start_date, t.end_date),
      isActive: activeTrip?.id === t.id,
      isGhost: false as const,
      variant: spineVariant(t.id),
      mode: getTripMode(t),
      locationName: t.location_name,
    }));
    // Ensure a ghost placeholder if we only have one real spine — the thin-data
    // state should feel intentional, not empty.
    if (built.length <= 1) {
      built.push({ id: 'ghost-future', isGhost: true });
    }
    return built;
  }, [trips, activeTrip]);

  // Open the active trip by default — a small quality-of-life read.
  const effectiveOpenId = openedId
    ?? (spines.find((s): s is SpineData => !s.isGhost && s.isActive)?.id ?? null);

  const opened = spines.find(
    (s): s is SpineData => !s.isGhost && s.id === effectiveOpenId,
  );

  return (
    <div className="collage-root">
      <main
        style={{
          minHeight: 'calc(100vh - 120px)',
          padding: 'clamp(24px, 5vw, 64px) clamp(16px, 4vw, 48px) 80px',
          maxWidth: 1080,
          marginInline: 'auto',
        }}
      >
        {/* HEADER */}
        <header
          style={{
            position: 'relative',
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Stamp variant="ink" size="lg" rotate={-2}>trips</Stamp>
          </div>
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontStyle: 'italic',
              color: 'var(--c-ink-muted)',
              margin: 0,
              fontSize: 15,
              maxWidth: '44ch',
              marginInline: 'auto',
            }}
          >
            the little library of places we've been and places we're going
          </p>
        </header>

        {isLoading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 0',
              fontFamily: 'var(--c-font-body)',
              fontStyle: 'italic',
              color: 'var(--c-ink-muted)',
            }}
          >
            Pulling books off the shelf…
          </div>
        ) : trips.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 16px',
              background: 'var(--c-paper)',
              boxShadow: 'var(--c-shadow-sm)',
              maxWidth: 420,
              marginInline: 'auto',
              position: 'relative',
            }}
          >
            <Tape position="top" rotate={-3} />
            <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 18 }}>
              empty shelf
            </Stamp>
            <p
              style={{
                fontFamily: 'var(--c-font-body)',
                fontSize: 16,
                color: 'var(--c-ink)',
                margin: '8px 0 12px',
              }}
            >
              No trips yet.
            </p>
            <MarginNote rotate={-2} size={20}>
              — the first one gets a gold bookmark
            </MarginNote>
          </div>
        ) : (
          <>
            {/* BOOKSHELF */}
            <section
              aria-label="Your trips"
              className="tripsv1-shelf"
              style={{ position: 'relative', marginBottom: 32 }}
            >
              <ul
                className="tripsv1-spines"
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: '4px 8px 0',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  minHeight: 248,
                }}
              >
                {spines.map((s, i) => {
                  if (s.isGhost) {
                    return (
                      <li key={s.id} style={{ listStyle: 'none' }}>
                        <GhostSpineCard />
                      </li>
                    );
                  }
                  const open = effectiveOpenId === s.id;
                  return (
                    <li key={s.id} style={{ listStyle: 'none' }}>
                      <Spine
                        data={s}
                        open={open}
                        onOpen={() => setOpenedId(s.id)}
                        entranceDelayMs={i * 60}
                      />
                    </li>
                  );
                })}
              </ul>

              {/* Shelf ruling — two ink lines evoke the plank without imagery */}
              <div
                aria-hidden
                style={{
                  marginTop: 4,
                  height: 10,
                  borderTop: '2px solid var(--c-ink)',
                  borderBottom: '1px solid var(--c-line)',
                  boxShadow: '0 6px 12px -8px rgba(29, 29, 27, 0.35)',
                }}
              />
              <div
                aria-hidden
                style={{
                  marginTop: 2,
                  height: 3,
                  borderBottom: '1px dashed var(--c-line)',
                }}
              />
            </section>

            {/* OPENED BOOK PREVIEW */}
            {opened && (
              <section
                key={opened.id}
                aria-live="polite"
                className="collage-enter"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 14,
                  marginTop: 24,
                }}
              >
                <PolaroidCard
                  mood={opened.variant === 'ink' ? 'ink' : opened.variant === 'pen' ? 'sky' : 'gold'}
                  rotate={-3}
                  size="sm"
                  entrance
                  tape
                  caption={opened.title}
                  overline={opened.mode === 'active' ? 'on the desk' : opened.mode === 'pre' ? 'next on the shelf' : 'back on the shelf'}
                />
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      fontSize: 14,
                      color: 'var(--c-ink)',
                      marginBottom: 4,
                    }}
                  >
                    {opened.dateRange}
                    {opened.locationName ? ` · ${opened.locationName}` : ''}
                  </div>
                  <MarginNote rotate={-1} size={20}>
                    {opened.isActive
                      ? 'currently reading'
                      : opened.mode === 'pre'
                        ? 'dog-eared for later'
                        : 'shelved — for now'}
                  </MarginNote>
                </div>
              </section>
            )}
          </>
        )}

        <style>{`
          @media (max-width: 520px) {
            .tripsv1-spines {
              gap: 8px !important;
              padding: 4px 2px 0 !important;
            }
          }
        `}</style>
      </main>
    </div>
  );
}

function Spine({
  data,
  open,
  onOpen,
  entranceDelayMs,
}: {
  data: SpineData;
  open: boolean;
  onOpen: () => void;
  entranceDelayMs: number;
}) {
  const height = 228;
  const width = 58;

  const bg =
    data.variant === 'ink'
      ? 'var(--c-ink)'
      : data.variant === 'pen'
        ? 'var(--c-pen)'
        : 'var(--c-paper)';
  const color =
    data.variant === 'creme' ? 'var(--c-ink)' : 'var(--c-creme)';
  const dateColor =
    data.variant === 'creme' ? 'var(--c-pen)' : 'var(--c-tape)';

  // Break the title across at most 2 spine lines so long names don't crop.
  const words = data.title.split(/\s+/);
  const mid = Math.ceil(words.length / 2);
  const line1 = words.slice(0, mid).join(' ');
  const line2 = words.slice(mid).join(' ');

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={open}
      aria-label={`Open ${data.title} — ${data.dateRange}`}
      className="collage-enter"
      style={{
        appearance: 'none',
        position: 'relative',
        width,
        height,
        padding: 0,
        margin: 0,
        background: bg,
        color,
        border: '1.5px solid var(--c-ink)',
        borderRadius: 'var(--c-r-sm)',
        boxShadow: open
          ? '0 10px 26px -8px rgba(29, 29, 27, 0.4)'
          : 'var(--c-shadow-sm)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '22px 6px 12px',
        transform: open ? 'translateY(-6px)' : 'translateY(0)',
        transition:
          'transform var(--c-t-fast) var(--c-ease-out), box-shadow var(--c-t-fast) var(--c-ease-out)',
        fontFamily: 'var(--c-font-display)',
        animationDelay: `${entranceDelayMs}ms`,
      }}
    >
      {/* Active bookmark */}
      {data.isActive && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: -6,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 18,
            height: 34,
            background: 'var(--c-tape)',
            border: '1.5px solid var(--c-ink)',
            borderTop: 'none',
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)',
            boxShadow: '0 2px 3px rgba(0,0,0,.15)',
          }}
        />
      )}

      {/* Stacked title — top-to-bottom letters */}
      <div
        aria-hidden
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          paddingTop: data.isActive ? 8 : 0,
        }}
      >
        <StackedTitle text={line1} color={color} />
        {line2 && (
          <span
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 9,
              fontStyle: 'italic',
              color,
              opacity: 0.85,
              letterSpacing: '.04em',
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              lineHeight: 1,
              maxHeight: 70,
              overflow: 'hidden',
            }}
          >
            {line2}
          </span>
        )}
      </div>

      {/* Date range in Caveat, vertical */}
      <span
        style={{
          fontFamily: 'var(--c-font-script)',
          fontWeight: 600,
          fontSize: 15,
          color: dateColor,
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          lineHeight: 1.1,
          maxHeight: 110,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        {data.dateRange}
      </span>
    </button>
  );
}

/** Top-to-bottom letters — each char on its own line, Rubik Mono One. */
function StackedTitle({ text, color }: { text: string; color: string }) {
  const chars = text.slice(0, 16).toUpperCase().split('');
  return (
    <span
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'var(--c-font-display)',
        fontSize: 14,
        lineHeight: 1,
        color,
        letterSpacing: 0,
      }}
    >
      {chars.map((c, i) => (
        <span
          key={i}
          style={{
            display: 'block',
            marginBottom: c === ' ' ? 6 : 2,
            opacity: c === ' ' ? 0 : 1,
            minHeight: c === ' ' ? 0 : 14,
          }}
        >
          {c === ' ' ? '·' : c}
        </span>
      ))}
    </span>
  );
}

function GhostSpineCard() {
  return (
    <div
      aria-hidden
      style={{
        width: 58,
        height: 228,
        background:
          'repeating-linear-gradient(0deg, transparent 0 6px, rgba(29,29,27,.06) 6px 7px)',
        border: '1.5px dashed var(--c-ink)',
        borderRadius: 'var(--c-r-sm)',
        opacity: 0.55,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
      }}
    >
      <span
        style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          fontFamily: 'var(--c-font-script)',
          fontWeight: 600,
          fontSize: 16,
          color: 'var(--c-ink-muted)',
          whiteSpace: 'nowrap',
        }}
      >
        next trip goes here
      </span>
    </div>
  );
}
