import '@/preview/collage/collage.css';
import { useMemo } from 'react';
import { useActiveTrip } from '@/hooks/use-trip';
import { useFavorites } from '@/hooks/use-trip-data';
import { ITINERARY, CHICAGO_HIGHLIGHTS, RESTAURANTS } from '@/lib/itinerary-data';
import type { Activity, GuideItem } from '@/lib/itinerary-data';
import { Stamp } from '../../ui/Stamp';
import { MarginNote } from '../../ui/MarginNote';

/**
 * Favorites V2 — Shortlist.
 * Curator's numbered reading-list. IBM Plex Serif body, rank numbers set
 * in Rubik Mono One with ink underlines. Single column of thin horizontal
 * cards: left = category glyph (photo-surrogate block for activities,
 * pin for locations, fork for restaurants), right = title + context; a
 * Caveat one-liner sits beneath each entry when warranted.
 * Header: SHORTLIST ink-stamp with date range. Empty state: ink-outlined
 * blank row inviting the first favorite.
 * prefers-reduced-motion: no rotate/translate; all animations gated via
 * collage.css's global reduced-motion rule.
 */

type ShortEntry =
  | { kind: 'activity'; data: Activity & { dayTitle: string } }
  | { kind: 'location'; data: GuideItem }
  | { kind: 'restaurant'; data: GuideItem };

function formatRange(start?: string, end?: string): string {
  if (!start) return '';
  const fmt = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  if (!end || end === start) return fmt(start);
  return `${fmt(start)} — ${fmt(end)}`;
}

export function FavoritesV2() {
  const { data: trip, isLoading: tripLoading } = useActiveTrip();
  const { data: favorites, isLoading: favLoading } = useFavorites();

  const entries = useMemo<ShortEntry[]>(() => {
    const fav = favorites ?? {};
    const favIds = Object.keys(fav).filter((id) => fav[id]);
    const out: ShortEntry[] = [];

    ITINERARY.forEach((day) => {
      day.activities.forEach((a) => {
        if (favIds.includes(a.id)) {
          out.push({ kind: 'activity', data: { ...a, dayTitle: day.title } });
        }
      });
    });
    CHICAGO_HIGHLIGHTS.forEach((loc) => {
      if (favIds.includes(loc.id)) out.push({ kind: 'location', data: loc });
    });
    RESTAURANTS.forEach((r) => {
      if (favIds.includes(r.id)) out.push({ kind: 'restaurant', data: r });
    });
    return out;
  }, [favorites]);

  const isLoading = tripLoading || favLoading;
  const dateRange = trip ? formatRange(trip.start_date, trip.end_date) : '';

  return (
    <div className="collage-root">
      <main
        style={{
          padding: 'clamp(24px, 4vw, 56px) clamp(16px, 3vw, 40px) 80px',
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'start center',
        }}
      >
        <div style={{ width: '100%', maxWidth: 640 }}>
          {/* Header */}
          <header style={{ textAlign: 'left', marginBottom: 28 }}>
            <Stamp variant="ink" size="md" rotate={-1}>
              shortlist
            </Stamp>
            <div
              style={{
                fontFamily: 'var(--c-font-display)',
                fontSize: 11,
                letterSpacing: '.24em',
                textTransform: 'uppercase',
                color: 'var(--c-ink-muted)',
                marginTop: 14,
              }}
            >
              {trip?.title?.replace(/\s*[–-].*$/, '') ?? 'This trip'} · {dateRange || '—'}
            </div>
            <p
              style={{
                fontFamily: 'var(--c-font-body)',
                fontSize: 15,
                fontStyle: 'italic',
                color: 'var(--c-ink-muted)',
                margin: '8px 0 0',
              }}
            >
              A curator's picks for a friend.
            </p>
          </header>

          {/* Loading banner */}
          {isLoading && <div style={SynthBanner}>Assembling the shortlist…</div>}

          {/* Empty state */}
          {!isLoading && entries.length === 0 && <EmptyRow />}

          {/* List */}
          {!isLoading && entries.length > 0 && (
            <ol
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {entries.map((entry, i) => (
                <ShortlistRow key={rowKey(entry)} rank={i + 1} entry={entry} />
              ))}
            </ol>
          )}

          {entries.length > 0 && (
            <footer
              style={{
                marginTop: 36,
                paddingTop: 18,
                borderTop: '1px solid var(--c-line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 10,
                  letterSpacing: '.3em',
                  textTransform: 'uppercase',
                  color: 'var(--c-ink-muted)',
                }}
              >
                {entries.length} entries
              </span>
              <MarginNote rotate={-2} size={18}>
                send this to a friend
              </MarginNote>
            </footer>
          )}
        </div>
      </main>
    </div>
  );
}

function rowKey(entry: ShortEntry): string {
  return `${entry.kind}:${entry.data.id}`;
}

function ShortlistRow({ rank, entry }: { rank: number; entry: ShortEntry }) {
  const { title, context, note, Glyph, rank2 } = rowContent(entry, rank);
  return (
    <li
      style={{
        display: 'grid',
        gridTemplateColumns: '48px 64px 1fr',
        alignItems: 'start',
        gap: 14,
        padding: '14px 12px',
        background: 'var(--c-paper)',
        boxShadow: 'var(--c-shadow-sm)',
      }}
    >
      {/* Rank numeral */}
      <div
        style={{
          fontFamily: 'var(--c-font-display)',
          fontSize: 22,
          color: 'var(--c-ink)',
          borderBottom: '2px solid var(--c-ink)',
          paddingBottom: 2,
          textAlign: 'center',
          alignSelf: 'start',
          lineHeight: 1,
        }}
      >
        {rank2}
      </div>

      {/* Glyph / thumb */}
      <div
        style={{
          width: 64,
          height: 64,
          display: 'grid',
          placeItems: 'center',
          background: 'var(--c-creme)',
          border: '1px solid var(--c-line)',
        }}
      >
        {Glyph}
      </div>

      {/* Title + context */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--c-font-display)',
            fontSize: 9,
            letterSpacing: '.26em',
            textTransform: 'uppercase',
            color: 'var(--c-ink-muted)',
            marginBottom: 4,
          }}
        >
          {context}
        </div>
        <div
          style={{
            fontFamily: 'var(--c-font-body)',
            fontSize: 16,
            fontWeight: 500,
            color: 'var(--c-ink)',
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>
        {note && (
          <MarginNote rotate={-1} size={18} style={{ display: 'block', marginTop: 6 }}>
            {note}
          </MarginNote>
        )}
      </div>
    </li>
  );
}

function rowContent(
  entry: ShortEntry,
  rank: number
): { title: string; context: string; note: string | null; Glyph: JSX.Element; rank2: string } {
  const rank2 = String(rank).padStart(2, '0');
  if (entry.kind === 'activity') {
    const a = entry.data;
    return {
      title: a.title,
      context: a.dayTitle + (a.time ? ` · ${a.time}` : ''),
      note: a.notes ? firstSentence(a.notes) : null,
      Glyph: <ActivityGlyph />,
      rank2,
    };
  }
  if (entry.kind === 'location') {
    const l = entry.data;
    return {
      title: l.name,
      context: 'place · pin it on the map',
      note: firstSentence(l.description),
      Glyph: <PinGlyph />,
      rank2,
    };
  }
  const r = entry.data;
  return {
    title: r.name,
    context: 'ate here',
    note: firstSentence(r.description),
    Glyph: <ForkGlyph />,
    rank2,
  };
}

function firstSentence(text: string): string {
  const s = text.split(/(?<=[.!?])\s+/)[0] ?? text;
  return s.length > 90 ? s.slice(0, 88).trimEnd() + '…' : s;
}

// ---------- glyphs ----------

function ActivityGlyph() {
  return (
    <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" fill="none" stroke="var(--c-ink)" strokeWidth="1.6" />
      <path d="M3 9h18" stroke="var(--c-ink)" strokeWidth="1.6" />
      <path d="M8 3v4M16 3v4" stroke="var(--c-ink)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PinGlyph() {
  return (
    <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24">
      <path
        d="M12 2c-3.87 0-7 3.13-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
        fill="var(--c-ink)"
      />
    </svg>
  );
}

function ForkGlyph() {
  return (
    <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24">
      <path
        d="M7 2v8a3 3 0 0 0 3 3v9M7 2v5M10 2v5M13 2v5M17 2c-1.5 0-3 1-3 4v5h3V22"
        stroke="var(--c-ink)"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ---------- empty ----------

function EmptyRow() {
  return (
    <div
      style={{
        border: '1.5px dashed var(--c-ink)',
        padding: '28px 20px',
        background: 'transparent',
        display: 'grid',
        gridTemplateColumns: '48px 1fr',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--c-font-display)',
          fontSize: 22,
          color: 'var(--c-ink-muted)',
          borderBottom: '2px solid var(--c-ink-muted)',
          paddingBottom: 2,
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        01
      </div>
      <div>
        <div
          style={{
            fontFamily: 'var(--c-font-body)',
            fontSize: 16,
            color: 'var(--c-ink)',
            fontStyle: 'italic',
          }}
        >
          add favorites to see your shortlist.
        </div>
        <div
          style={{
            fontFamily: 'var(--c-font-body)',
            fontSize: 13,
            color: 'var(--c-ink-muted)',
            marginTop: 4,
          }}
        >
          Star a session, a place, or a meal — the list writes itself.
        </div>
      </div>
    </div>
  );
}

const SynthBanner: React.CSSProperties = {
  background: 'rgba(31, 60, 198, 0.08)',
  border: '1px dashed var(--c-pen)',
  padding: '10px 14px',
  marginBottom: 20,
  fontSize: 13,
  color: 'var(--c-pen)',
  fontFamily: 'var(--c-font-body)',
};
