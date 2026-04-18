import { useMemo } from 'react';
import { useActiveTrip } from '@/hooks/use-trip';
import { useMemories } from '@/hooks/use-memories';
import { useItineraryItems } from '@/hooks/use-itinerary';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { PolaroidCard, resolveMood } from '../../ui/PolaroidCard';
import { MarginNote } from '../../ui/MarginNote';
import type { ItineraryItem, Memory } from '@/types/trip';

/**
 * Memory V2 — Pinned Letter.
 * Polaroid pinned top-center with a pen-blue pushpin.
 * Paper "letter" flows below in a reading column — more personal, less dashboard.
 */
export function MemoryV2() {
  const { data: trip } = useActiveTrip();
  const { data: memories = [] } = useMemories(trip?.id);
  const { data: items = [] } = useItineraryItems(trip?.id);

  const realMemory = memories[0] as Memory | undefined;
  const sampleItem = useMemo<ItineraryItem | undefined>(() => {
    if (realMemory) return undefined;
    return (
      items.find(i => i.category === 'worship' && i.speaker) ??
      items.find(i => i.category === 'workshop' && i.speaker) ??
      items.find(i => i.speaker) ??
      items[0]
    );
  }, [items, realMemory]);

  const isSynth = !realMemory && !!sampleItem;

  if (!trip) return <div style={{ padding: 80 }}>Loading…</div>;
  if (!realMemory && !sampleItem) {
    return <div style={{ padding: 80, color: 'var(--c-ink-muted)' }}>No memories or items.</div>;
  }

  const titleText = realMemory?.title ?? sampleItem?.title ?? 'Untitled';
  const speaker = realMemory?.itinerary_item?.speaker ?? sampleItem?.speaker ?? null;
  const linkedItem = realMemory?.itinerary_item ?? sampleItem;
  const location = realMemory?.location?.name ?? sampleItem?.location?.name ?? trip.location_name;
  const mood = resolveMood(linkedItem?.category, linkedItem?.start_time ?? null);

  const letterBody = realMemory?.note ??
    `Dear future-self,

We were in the room a little after opening worship. ${speaker ? `${speaker.split(/[,(]/)[0].trim()} said something about ` : 'Someone said something about '}the way grief and laughter sit together in chaplaincy, and I wrote it down but you'll have to trust me on the exact words.

What I want you to remember is not the quote but the quiet that came after. A pause where nobody tried to fix it.

Carry that home.`;

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 120px)',
        padding: 'clamp(32px, 5vw, 72px) clamp(24px, 4vw, 64px) 80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {isSynth && (
        <div
          style={{
            background: 'rgba(31, 60, 198, 0.08)',
            border: '1px dashed var(--c-pen)',
            padding: '8px 12px',
            marginBottom: 32,
            fontSize: 12,
            color: 'var(--c-pen)',
            fontFamily: 'var(--c-font-body)',
            display: 'inline-block',
          }}
        >
          Synthesized preview — real keys from <strong>{linkedItem?.title}</strong>; body is sample.
        </div>
      )}

      {/* Pinned polaroid */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <PolaroidCard
          mood={mood}
          rotate={-2}
          size="md"
          entrance
          tape={false}
          overline={linkedItem?.category}
          caption={location ?? ''}
        />
        {/* Pushpin */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 20,
            height: 20,
            borderRadius: 999,
            background: 'radial-gradient(circle at 35% 30%, #4a6ce0 10%, #1F3CC6 60%, #0D1E6A 100%)',
            boxShadow: '0 4px 8px -2px rgba(0,0,0,.35)',
            border: '2px solid var(--c-creme)',
            zIndex: 5,
          }}
        />
      </div>

      {/* Meta strip: date · location · speaker */}
      <div
        style={{
          display: 'inline-flex',
          gap: 20,
          alignItems: 'center',
          fontFamily: 'var(--c-font-display)',
          fontSize: 10,
          letterSpacing: '.24em',
          textTransform: 'uppercase',
          color: 'var(--c-ink-muted)',
          marginBottom: 40,
          flexWrap: 'wrap',
          justifyContent: 'center',
          padding: '0 24px',
        }}
      >
        {linkedItem?.start_time && (
          <>
            <span>{linkedItem.start_time.slice(0, 5)}</span>
            <span aria-hidden>·</span>
          </>
        )}
        {location && (
          <>
            <span>{location}</span>
            <span aria-hidden>·</span>
          </>
        )}
        <span>{trip.title.split(/[-–]/)[0].trim()}</span>
      </div>

      {/* Letter title */}
      <Stamp variant="ink" size="md" rotate={-2} style={{ marginBottom: 24 }}>
        dispatch · {new Date().toLocaleString('en-US', { month: 'short' }).toLowerCase()}
      </Stamp>

      <h1
        style={{
          fontFamily: 'var(--c-font-body)',
          fontSize: 'clamp(28px, 3.5vw, 40px)',
          fontWeight: 500,
          letterSpacing: '-.01em',
          textAlign: 'center',
          margin: '0 0 8px',
          lineHeight: 1.15,
          maxWidth: '22ch',
        }}
      >
        {titleText}
      </h1>
      {speaker && (
        <p
          style={{
            fontFamily: 'var(--c-font-body)',
            fontStyle: 'italic',
            color: 'var(--c-ink-muted)',
            margin: '0 0 32px',
            fontSize: 17,
            textAlign: 'center',
          }}
        >
          with {speaker}
        </p>
      )}

      {/* Letter paper */}
      <article
        style={{
          background: 'var(--c-paper)',
          padding: 'clamp(32px, 5vw, 56px)',
          boxShadow: 'var(--c-shadow)',
          maxWidth: 640,
          width: '100%',
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent 0 26px, rgba(31, 60, 198, 0.08) 26px 27px)',
          position: 'relative',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--c-font-body)',
            fontSize: 17,
            lineHeight: '27px',
            color: 'var(--c-ink)',
            margin: 0,
            whiteSpace: 'pre-line',
            maxWidth: '52ch',
          }}
        >
          {letterBody}
        </p>

        {linkedItem?.tags && linkedItem.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 28, flexWrap: 'wrap' }}>
            {linkedItem.tags.slice(0, 5).map(t => (
              <Stamp key={t} variant="outline" size="sm">
                # {t}
              </Stamp>
            ))}
          </div>
        )}

        <MarginNote rotate={2} size={22} style={{ display: 'block', marginTop: 28 }}>
          — written the next morning, keeping it
        </MarginNote>
      </article>

      <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <StickerPill variant="ink">send this as a dispatch</StickerPill>
        <StickerPill variant="pen">keep private</StickerPill>
      </div>
    </main>
  );
}
