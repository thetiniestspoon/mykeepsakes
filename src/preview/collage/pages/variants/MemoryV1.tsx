import { useMemo } from 'react';
import { useActiveTrip } from '@/hooks/use-trip';
import { useMemories } from '@/hooks/use-memories';
import { useItineraryItems } from '@/hooks/use-itinerary';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { PolaroidCard, resolveMood } from '../../ui/PolaroidCard';
import { MarginNote } from '../../ui/MarginNote';
import { Tape } from '../../ui/Tape';
import type { ItineraryItem, Memory } from '@/types/trip';

export function MemoryV1() {
  const { data: trip } = useActiveTrip();
  const { data: memories = [] } = useMemories(trip?.id);
  const { data: items = [] } = useItineraryItems(trip?.id);

  // Try a real memory first; fall back to synthesized dispatch preview against a real item
  const realMemory = memories[0] as Memory | undefined;
  const sampleItem = useMemo<ItineraryItem | undefined>(() => {
    if (realMemory) return undefined;
    // Prefer a workshop item with a speaker, because that's the highest-emotional-weight shape
    return (
      items.find(i => i.category === 'workshop' && i.speaker) ??
      items.find(i => i.speaker) ??
      items[0]
    );
  }, [items, realMemory]);

  const isSynth = !realMemory && !!sampleItem;

  if (!trip) {
    return (
      <div style={{ padding: 80 }}>
        <Stamp size="md" variant="outline">No active trip</Stamp>
      </div>
    );
  }

  if (!realMemory && !sampleItem) {
    return (
      <div style={{ padding: 80, color: 'var(--c-ink-muted)' }}>
        No memories or itinerary items yet.
      </div>
    );
  }

  // Resolve display data
  const titleText =
    realMemory?.title ??
    sampleItem?.title ??
    'Untitled moment';
  const bodyText =
    realMemory?.note ??
    'This is what a dispatch looks like the day after a session. A line or two you don\'t want to lose. A name. A question that changed something. The Caveat accents are yours — write in the margins without editing.';
  const speaker =
    realMemory?.itinerary_item?.speaker ??
    sampleItem?.speaker ??
    null;
  const linkedItem =
    realMemory?.itinerary_item ??
    sampleItem;
  const location =
    realMemory?.location?.name ??
    sampleItem?.location?.name ??
    trip.location_name;
  const mood = resolveMood(linkedItem?.category, linkedItem?.start_time ?? null);

  return (
    <main
      style={{
        minHeight: '100vh',
        minHeight: '100dvh',
        padding: 'clamp(32px, 5vw, 64px) clamp(24px, 5vw, 72px)',
        position: 'relative',
      }}
    >
      {isSynth && (
        <div
          style={{
            background: 'rgba(31, 60, 198, 0.08)',
            border: '1px dashed var(--c-pen)',
            padding: '10px 14px',
            marginBottom: 32,
            fontSize: 13,
            color: 'var(--c-pen)',
            fontFamily: 'var(--c-font-body)',
            display: 'inline-block',
          }}
        >
          Synthesized preview — no memories captured yet. Real record keys pulled from{' '}
          <strong>{linkedItem?.title}</strong>; reflection body is sample copy.
        </div>
      )}

      <header style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <StickerPill variant="ink">dispatch</StickerPill>
          {linkedItem?.track && (
            <StickerPill variant="pen">Track {linkedItem.track}</StickerPill>
          )}
          {linkedItem?.category && (
            <Stamp size="sm" variant="plain">
              {linkedItem.category}
            </Stamp>
          )}
        </div>
        <h1
          style={{
            fontFamily: 'var(--c-font-body)',
            fontSize: 'clamp(30px, 4vw, 48px)',
            fontWeight: 500,
            letterSpacing: '-.01em',
            margin: 0,
            lineHeight: 1.1,
            maxWidth: '26ch',
          }}
        >
          {titleText}
        </h1>
        {speaker && (
          <p style={{ fontFamily: 'var(--c-font-body)', fontStyle: 'italic', color: 'var(--c-ink-muted)', fontSize: 18, margin: '8px 0 0' }}>
            with {speaker}
          </p>
        )}
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 340px) minmax(0, 1fr)',
          gap: 48,
          alignItems: 'start',
        }}
        className="memory-bed"
      >
        {/* left: polaroid + meta */}
        <div style={{ position: 'relative' }}>
          <PolaroidCard
            mood={mood}
            rotate={-3}
            tape
            size="lg"
            entrance
            caption={
              location ? location : linkedItem?.title ? 'in the room where it happened' : ''
            }
          />
          <MarginNote
            rotate={-6}
            size={22}
            style={{
              position: 'absolute',
              right: -8,
              bottom: 14,
              background: 'var(--c-creme)',
              padding: '2px 8px',
            }}
          >
            ✦ kept
          </MarginNote>
        </div>

        {/* right: body + tags */}
        <div>
          <div
            style={{
              position: 'relative',
              background: 'var(--c-paper)',
              padding: '28px 32px 36px',
              boxShadow: 'var(--c-shadow)',
              maxWidth: 640,
            }}
          >
            <Tape position="top-left" width={72} rotate={-8} />
            <Tape position="top-right" width={72} rotate={6} />

            <p
              style={{
                fontFamily: 'var(--c-font-body)',
                fontSize: 17,
                lineHeight: 1.7,
                color: 'var(--c-ink)',
                margin: 0,
                maxWidth: '44ch',
              }}
            >
              {bodyText}
            </p>

            {linkedItem?.tags && linkedItem.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
                {linkedItem.tags.slice(0, 6).map(t => (
                  <Stamp key={t} variant="outline" size="sm">
                    # {t}
                  </Stamp>
                ))}
              </div>
            )}

            <MarginNote rotate={1} size={22} style={{ marginTop: 24, display: 'block' }}>
              — written the next morning
            </MarginNote>
          </div>

          {/* below-card metadata strip */}
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              rowGap: 8,
              columnGap: 20,
              marginTop: 28,
              fontFamily: 'var(--c-font-body)',
              fontSize: 14,
              color: 'var(--c-ink-muted)',
            }}
          >
            {linkedItem?.start_time && (
              <>
                <dt style={{ fontFamily: 'var(--c-font-display)', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--c-ink)' }}>
                  when
                </dt>
                <dd style={{ margin: 0 }}>{linkedItem.start_time.slice(0, 5)} — {linkedItem.end_time?.slice(0, 5) ?? '—'}</dd>
              </>
            )}
            {location && (
              <>
                <dt style={{ fontFamily: 'var(--c-font-display)', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--c-ink)' }}>
                  where
                </dt>
                <dd style={{ margin: 0 }}>{location}</dd>
              </>
            )}
            {trip?.title && (
              <>
                <dt style={{ fontFamily: 'var(--c-font-display)', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--c-ink)' }}>
                  trip
                </dt>
                <dd style={{ margin: 0 }}>{trip.title}</dd>
              </>
            )}
          </dl>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .memory-bed { grid-template-columns: 1fr !important; gap: 28px !important; }
        }
      `}</style>
    </main>
  );
}
