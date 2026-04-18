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

/**
 * Memory V3 — Scrapbook Spread.
 * Full two-page open-book spread. Tape strip crosses the gutter.
 * Left: polaroid + a ruled-line meta list (when/where/who/track).
 * Right: the reflection body + tags + a handwritten marginalia block.
 */
export function MemoryV3() {
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

  const body =
    realMemory?.note ??
    `This is what a dispatch looks like the day after a session. A line or two you don't want to lose. A name. A question that changed something. The Caveat accents are yours — write in the margins without editing.`;

  return (
    <main
      style={{
        padding: 'clamp(32px, 4vw, 64px) clamp(16px, 3vw, 48px) 80px',
        minHeight: 'calc(100vh - 120px)',
        display: 'grid',
        placeItems: 'start center',
      }}
    >
      {isSynth && (
        <div
          style={{
            background: 'rgba(31, 60, 198, 0.08)',
            border: '1px dashed var(--c-pen)',
            padding: '8px 12px',
            marginBottom: 20,
            fontSize: 12,
            color: 'var(--c-pen)',
            fontFamily: 'var(--c-font-body)',
            display: 'inline-block',
          }}
        >
          Synthesized preview — real keys from <strong>{linkedItem?.title}</strong>; body is sample.
        </div>
      )}

      <div
        className="scrap-spread"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          width: '100%',
          maxWidth: 1160,
          background: 'var(--c-paper)',
          boxShadow: 'var(--c-shadow)',
          position: 'relative',
        }}
      >
        {/* Tape across gutter */}
        <span
          aria-hidden
          className="scrap-gutter-tape"
          style={{
            position: 'absolute',
            top: '8%',
            left: '50%',
            width: 92,
            height: 24,
            background: 'rgba(246, 213, 92, .72)',
            boxShadow: '0 1px 2px rgba(0,0,0,.12)',
            transform: 'translateX(-50%) rotate(-4deg)',
            zIndex: 5,
            pointerEvents: 'none',
          }}
        />
        <span
          aria-hidden
          className="scrap-gutter-tape"
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '50%',
            width: 80,
            height: 22,
            background: 'rgba(246, 213, 92, .6)',
            boxShadow: '0 1px 2px rgba(0,0,0,.12)',
            transform: 'translateX(-50%) rotate(3deg)',
            zIndex: 5,
            pointerEvents: 'none',
          }}
        />
        {/* Gutter line */}
        <div
          aria-hidden
          className="scrap-gutter"
          style={{
            position: 'absolute',
            left: '50%',
            top: 40,
            bottom: 40,
            width: 1,
            background: 'var(--c-line)',
            transform: 'translateX(-50%)',
          }}
        />

        {/* LEFT page: polaroid + meta list */}
        <section
          className="scrap-page"
          style={{
            padding: 'clamp(32px, 4vw, 56px)',
            position: 'relative',
            minHeight: 560,
          }}
        >
          <Tape position="top-left" rotate={-8} width={64} />

          <Stamp variant="outline" size="sm" rotate={-3} style={{ marginBottom: 20 }}>
            from the book
          </Stamp>

          <div style={{ position: 'relative', display: 'inline-block' }}>
            <PolaroidCard
              mood={mood}
              rotate={-4}
              size="md"
              entrance
              tape
              caption={location ?? ''}
              overline={linkedItem?.category}
            />
            <MarginNote
              rotate={-7}
              size={22}
              style={{
                position: 'absolute',
                right: -18,
                bottom: 4,
                background: 'var(--c-paper)',
                padding: '2px 6px',
              }}
            >
              ✦ kept
            </MarginNote>
          </div>

          {/* Ruled meta list */}
          <dl
            style={{
              marginTop: 36,
              display: 'grid',
              gridTemplateColumns: '84px 1fr',
              rowGap: 0,
              columnGap: 16,
              fontFamily: 'var(--c-font-body)',
              fontSize: 14,
            }}
          >
            <dt style={MetaDt}>when</dt>
            <dd style={MetaDd}>
              {linkedItem?.start_time
                ? `${linkedItem.start_time.slice(0, 5)}${linkedItem.end_time ? ` — ${linkedItem.end_time.slice(0, 5)}` : ''}`
                : '—'}
            </dd>

            <dt style={MetaDt}>where</dt>
            <dd style={MetaDd}>{location ?? '—'}</dd>

            {speaker && (
              <>
                <dt style={MetaDt}>with</dt>
                <dd style={MetaDd}>{speaker}</dd>
              </>
            )}

            {linkedItem?.track && (
              <>
                <dt style={MetaDt}>track</dt>
                <dd style={MetaDd}>Track {linkedItem.track}</dd>
              </>
            )}

            <dt style={MetaDt}>trip</dt>
            <dd style={MetaDd}>{trip.title.replace(/\s*[–-].*$/, '')}</dd>
          </dl>
        </section>

        {/* RIGHT page: reflection body + tags + marginalia */}
        <section
          className="scrap-page"
          style={{
            padding: 'clamp(32px, 4vw, 56px)',
            position: 'relative',
            minHeight: 560,
          }}
        >
          <Tape position="top-right" rotate={6} width={64} />

          <Stamp variant="ink" size="md" rotate={2} style={{ marginBottom: 24 }}>
            what I want to keep
          </Stamp>

          <h1
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 'clamp(24px, 2.6vw, 32px)',
              fontWeight: 500,
              letterSpacing: '-.01em',
              margin: '0 0 20px',
              lineHeight: 1.2,
              maxWidth: '24ch',
              color: 'var(--c-ink)',
            }}
          >
            {titleText}
          </h1>

          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 16,
              lineHeight: 1.7,
              color: 'var(--c-ink)',
              margin: 0,
              maxWidth: '44ch',
            }}
          >
            {body}
          </p>

          {linkedItem?.tags && linkedItem.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
              {linkedItem.tags.slice(0, 6).map(t => (
                <Stamp key={t} variant="outline" size="sm">
                  # {t}
                </Stamp>
              ))}
            </div>
          )}

          {/* Marginalia block — handwritten-looking aside */}
          <div
            style={{
              marginTop: 36,
              padding: '16px 20px',
              borderLeft: '3px solid var(--c-pen)',
              background: 'rgba(31, 60, 198, 0.04)',
            }}
          >
            <MarginNote rotate={-1} size={22} style={{ display: 'block' }}>
              question I want to sit with:
            </MarginNote>
            <MarginNote rotate={1} size={22} color="ink" style={{ display: 'block', marginTop: 6 }}>
              where was grace, even when I didn't name it?
            </MarginNote>
          </div>

          <div style={{ marginTop: 28, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <StickerPill variant="ink">send as dispatch</StickerPill>
            <StickerPill variant="pen">pin to favorites</StickerPill>
          </div>
        </section>

        {/* Page numbers */}
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            left: 48,
            right: 48,
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'var(--c-font-display)',
            fontSize: 10,
            letterSpacing: '.3em',
            color: 'var(--c-ink-muted)',
          }}
        >
          <span>— keep —</span>
          <span>— carry —</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .scrap-spread { grid-template-columns: 1fr !important; }
          .scrap-gutter, .scrap-gutter-tape { display: none !important; }
          .scrap-page:first-of-type { border-bottom: 1px solid var(--c-line); }
        }
      `}</style>
    </main>
  );
}

const MetaDt: React.CSSProperties = {
  fontFamily: 'var(--c-font-display)',
  fontSize: 10,
  letterSpacing: '.22em',
  textTransform: 'uppercase',
  color: 'var(--c-ink)',
  padding: '10px 0',
  borderBottom: '1px dashed var(--c-line)',
  alignSelf: 'center',
};

const MetaDd: React.CSSProperties = {
  fontFamily: 'var(--c-font-body)',
  fontSize: 15,
  color: 'var(--c-ink)',
  margin: 0,
  padding: '10px 0',
  borderBottom: '1px dashed var(--c-line)',
  lineHeight: 1.4,
};
