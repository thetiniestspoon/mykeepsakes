import '@/preview/collage/collage.css';
import { useMemo } from 'react';
import { useActiveTrip } from '@/hooks/use-trip';
import { useFavorites } from '@/hooks/use-trip-data';
import { ITINERARY, CHICAGO_HIGHLIGHTS, RESTAURANTS } from '@/lib/itinerary-data';
import type { Activity, GuideItem } from '@/lib/itinerary-data';
import { Stamp } from '../../ui/Stamp';
import { Tape } from '../../ui/Tape';
import { MarginNote } from '../../ui/MarginNote';
import { StickerPill } from '../../ui/StickerPill';
import { PolaroidCard, resolveMood } from '../../ui/PolaroidCard';

/**
 * Favorites V1 — Pin Wall.
 * Tape-pinned starred items on a cork-wall feel. Items rotate 2–5°; Tape
 * top-left on each. Mixed content types render with different primitives:
 *   - photo-eligible (activities) → PolaroidCard
 *   - location (CHICAGO_HIGHLIGHTS) → StickerPill + ink map-pin glyph
 *   - itinerary item w/ time → ink-ruled card with time stamp
 * MarginNote in pen-blue annotates a couple items. Empty state: a single
 * Caveat "nothing pinned yet" note and a ghosted tape strip.
 * prefers-reduced-motion: collage.css neutralizes animations globally;
 * authored rotations remain static (no JS-driven motion here).
 */

type PinnedActivity = Activity & { dayTitle: string };

const ROTATIONS = [-4, 3, -2, 4, -5, 2, -3, 5];

export function FavoritesV1() {
  const { data: trip, isLoading: tripLoading } = useActiveTrip();
  const { data: favorites, isLoading: favLoading } = useFavorites();

  const { activities, locations, restaurants } = useMemo(() => {
    const fav = favorites ?? {};
    const favIds = Object.keys(fav).filter((id) => fav[id]);

    const acts: PinnedActivity[] = [];
    ITINERARY.forEach((day) => {
      day.activities.forEach((a) => {
        if (favIds.includes(a.id)) acts.push({ ...a, dayTitle: day.title });
      });
    });

    const locs: GuideItem[] = CHICAGO_HIGHLIGHTS.filter((b) => favIds.includes(b.id));
    const rests: GuideItem[] = RESTAURANTS.filter((r) => favIds.includes(r.id));

    return { activities: acts, locations: locs, restaurants: rests };
  }, [favorites]);

  const hasAny = activities.length > 0 || locations.length > 0 || restaurants.length > 0;
  const isLoading = tripLoading || favLoading;

  // Build an ordered mixed wall — alternating categories for visual variety.
  const wallItems = useMemo(() => {
    const combined: Array<
      | { kind: 'activity'; data: PinnedActivity }
      | { kind: 'location'; data: GuideItem }
      | { kind: 'restaurant'; data: GuideItem }
    > = [];
    const max = Math.max(activities.length, locations.length, restaurants.length);
    for (let i = 0; i < max; i++) {
      if (activities[i]) combined.push({ kind: 'activity', data: activities[i] });
      if (locations[i]) combined.push({ kind: 'location', data: locations[i] });
      if (restaurants[i]) combined.push({ kind: 'restaurant', data: restaurants[i] });
    }
    return combined;
  }, [activities, locations, restaurants]);

  return (
    <div className="collage-root">
      <main
        style={{
          padding: 'clamp(20px, 4vw, 48px) clamp(14px, 3vw, 36px) 80px',
          minHeight: '100dvh',
        }}
      >
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: 28 }}>
          <Stamp variant="ink" size="md" rotate={-2}>
            the pin wall
          </Stamp>
          <h1
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 'clamp(22px, 3.4vw, 30px)',
              fontWeight: 500,
              letterSpacing: '-.01em',
              margin: '18px 0 6px',
              color: 'var(--c-ink)',
            }}
          >
            {trip?.title?.replace(/\s*[–-].*$/, '') ?? 'Favorites'}
          </h1>
          <MarginNote rotate={-3} size={20} color="ink">
            everything you came back to
          </MarginNote>
        </header>

        {/* Loading banner */}
        {isLoading && (
          <div style={SynthBanner}>
            Pinning up your wall…
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !hasAny && <EmptyWall />}

        {/* Pin wall */}
        {!isLoading && hasAny && (
          <section
            className="pinwall-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 'clamp(24px, 3vw, 40px)',
              maxWidth: 1120,
              margin: '0 auto',
              padding: '20px 4px 0',
            }}
          >
            {wallItems.map((entry, i) => {
              const rot = ROTATIONS[i % ROTATIONS.length];
              // First two get pen-blue margin notes
              const annotation =
                i === 0
                  ? 'came back for this twice'
                  : i === 1
                  ? "the one I'll tell people about"
                  : null;

              if (entry.kind === 'activity') {
                return (
                  <ActivityPin
                    key={entry.data.id}
                    activity={entry.data}
                    rotate={rot}
                    annotation={annotation}
                  />
                );
              }
              if (entry.kind === 'location') {
                return (
                  <LocationPin
                    key={entry.data.id}
                    location={entry.data}
                    rotate={rot}
                    annotation={annotation}
                  />
                );
              }
              return (
                <RestaurantPin
                  key={entry.data.id}
                  restaurant={entry.data}
                  rotate={rot}
                  annotation={annotation}
                />
              );
            })}
          </section>
        )}

        <style>{`
          @media (max-width: 480px) {
            .pinwall-grid {
              grid-template-columns: 1fr !important;
              gap: 28px !important;
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .pinwall-pin { transform: none !important; }
          }
        `}</style>
      </main>
    </div>
  );
}

// ---------- pin variants ----------

function ActivityPin({
  activity,
  rotate,
  annotation,
}: {
  activity: PinnedActivity;
  rotate: number;
  annotation: string | null;
}) {
  const mood = resolveMood(activity.category, activity.time);
  return (
    <div
      className="pinwall-pin"
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        paddingTop: 12,
      }}
    >
      <PolaroidCard
        mood={mood}
        rotate={rotate}
        size="md"
        tape
        entrance
        overline={activity.dayTitle}
        caption={activity.title}
      />
      {annotation && (
        <MarginNote
          rotate={-5}
          size={20}
          style={{
            position: 'absolute',
            right: -6,
            bottom: -10,
            background: 'var(--c-paper)',
            padding: '2px 8px',
            boxShadow: 'var(--c-shadow-sm)',
          }}
        >
          {annotation}
        </MarginNote>
      )}
    </div>
  );
}

function LocationPin({
  location,
  rotate,
  annotation,
}: {
  location: GuideItem;
  rotate: number;
  annotation: string | null;
}) {
  return (
    <div
      className="pinwall-pin"
      style={{
        position: 'relative',
        background: 'var(--c-paper)',
        boxShadow: 'var(--c-shadow)',
        padding: '20px 18px 22px',
        transform: `rotate(${rotate}deg)`,
        transformOrigin: 'center',
      }}
    >
      <Tape position="top-left" rotate={-8} width={72} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <PinGlyph />
        <div style={{ flex: 1, minWidth: 0 }}>
          <StickerPill variant="ink" style={{ marginBottom: 10 }}>
            place
          </StickerPill>
          <h3
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 17,
              fontWeight: 500,
              margin: '0 0 6px',
              color: 'var(--c-ink)',
              lineHeight: 1.25,
            }}
          >
            {location.name}
          </h3>
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 14,
              color: 'var(--c-ink-muted)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {location.description}
          </p>
        </div>
      </div>
      {annotation && (
        <MarginNote
          rotate={3}
          size={20}
          style={{ display: 'block', marginTop: 14 }}
        >
          {annotation}
        </MarginNote>
      )}
    </div>
  );
}

function RestaurantPin({
  restaurant,
  rotate,
  annotation,
}: {
  restaurant: GuideItem;
  rotate: number;
  annotation: string | null;
}) {
  const time = '—';
  return (
    <div
      className="pinwall-pin"
      style={{
        position: 'relative',
        background: 'var(--c-paper)',
        boxShadow: 'var(--c-shadow)',
        padding: '20px 18px 22px',
        transform: `rotate(${rotate}deg)`,
        transformOrigin: 'center',
      }}
    >
      <Tape position="top-left" rotate={-6} width={64} />
      <div
        style={{
          fontFamily: 'var(--c-font-display)',
          fontSize: 10,
          letterSpacing: '.24em',
          textTransform: 'uppercase',
          color: 'var(--c-ink-muted)',
          borderBottom: '1px solid var(--c-line)',
          paddingBottom: 8,
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>ate here</span>
        <span>{time}</span>
      </div>
      <h3
        style={{
          fontFamily: 'var(--c-font-body)',
          fontSize: 17,
          fontWeight: 500,
          margin: '0 0 6px',
          color: 'var(--c-ink)',
          lineHeight: 1.25,
        }}
      >
        {restaurant.name}
      </h3>
      <p
        style={{
          fontFamily: 'var(--c-font-body)',
          fontSize: 14,
          color: 'var(--c-ink-muted)',
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {restaurant.description}
      </p>
      {annotation && (
        <MarginNote rotate={-2} size={20} style={{ display: 'block', marginTop: 14 }}>
          {annotation}
        </MarginNote>
      )}
    </div>
  );
}

function PinGlyph() {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      style={{ flexShrink: 0, marginTop: 2 }}
    >
      <path
        d="M12 2c-3.87 0-7 3.13-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
        fill="var(--c-ink)"
      />
    </svg>
  );
}

// ---------- empty state ----------

function EmptyWall() {
  return (
    <div
      style={{
        maxWidth: 480,
        margin: '48px auto',
        padding: '48px 24px',
        position: 'relative',
        textAlign: 'center',
        background: 'var(--c-paper)',
        boxShadow: 'var(--c-shadow-sm)',
      }}
    >
      {/* Ghosted tape strip */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: -10,
          left: '50%',
          width: 96,
          height: 22,
          background: 'rgba(246, 213, 92, 0.28)',
          boxShadow: '0 1px 2px rgba(0,0,0,.06)',
          transform: 'translateX(-50%) rotate(-3deg)',
        }}
      />
      <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 18 }}>
        empty wall
      </Stamp>
      <MarginNote rotate={-2} size={26} color="ink" style={{ display: 'block' }}>
        nothing pinned yet
      </MarginNote>
      <p
        style={{
          fontFamily: 'var(--c-font-body)',
          fontSize: 15,
          color: 'var(--c-ink-muted)',
          margin: '18px auto 0',
          maxWidth: '30ch',
          lineHeight: 1.5,
        }}
      >
        Star a meal, a session, or a place and it lands here, tape and all.
      </p>
    </div>
  );
}

const SynthBanner: React.CSSProperties = {
  background: 'rgba(31, 60, 198, 0.08)',
  border: '1px dashed var(--c-pen)',
  padding: '10px 14px',
  margin: '0 auto 20px',
  maxWidth: 420,
  fontSize: 13,
  color: 'var(--c-pen)',
  fontFamily: 'var(--c-font-body)',
  textAlign: 'center',
};
