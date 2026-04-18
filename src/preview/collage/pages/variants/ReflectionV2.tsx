import { useMemo, useState } from 'react';
import { useActiveTrip, useTripDays } from '@/hooks/use-trip';
import { useItineraryItems } from '@/hooks/use-itinerary';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { PolaroidCard, resolveMood } from '../../ui/PolaroidCard';
import { MarginNote } from '../../ui/MarginNote';
import type { ItineraryItem } from '@/types/trip';

/**
 * Reflection V2 — Index Card (horizontal).
 *
 * Preview-only rendering of the Reflection Capture Sheet as a wide, short
 * index card (~540×300px desktop) centered over a dimmed backdrop. Two
 * columns:
 *
 *   LEFT (1/3): a small PolaroidCard preview of the linked session (mood
 *   derived from category/time-of-day via resolveMood), the today chip, and
 *   the session title in IBM Plex.
 *
 *   RIGHT (2/3): the ruled textarea (smaller than V1), the tag row
 *   (StickerPills), and the ink "KEEP IT" button.
 *
 * Decorative extras: rotated paperclip emoji + "QUICK CARD" stamp in the
 * top-left, close × in the top-right, and a "#CPE · reflection" sticker
 * anchored to the card. No Supabase writes. Entrance uses `collage-enter`;
 * `prefers-reduced-motion` is honored via collage.css.
 */
export function ReflectionV2() {
  const { data: trip } = useActiveTrip();
  const { data: days = [] } = useTripDays(trip?.id);
  const { data: items = [] } = useItineraryItems(trip?.id);

  const todayISO = new Date().toISOString().slice(0, 10);
  const todayDay = useMemo(
    () => days.find(d => d.date === todayISO) ?? days[0],
    [days, todayISO],
  );

  const dayItems = useMemo<ItineraryItem[]>(() => {
    if (!todayDay) return items;
    return items.filter(i => i.day_id === todayDay.id);
  }, [items, todayDay]);

  const linkedItem = useMemo<ItineraryItem | undefined>(() => {
    return (
      dayItems.find(i => i.speaker && i.category === 'worship') ??
      dayItems.find(i => i.speaker && i.category === 'workshop') ??
      dayItems.find(i => i.speaker) ??
      dayItems[0] ??
      items[0]
    );
  }, [dayItems, items]);

  const mood = resolveMood(linkedItem?.category, linkedItem?.start_time ?? null);

  const [body, setBody] = useState<string>('');

  const TAGS = ['heavy', 'clear', 'tender', 'yes', 'hmm'] as const;
  type Tag = typeof TAGS[number];
  const [tags, setTags] = useState<Set<Tag>>(new Set());
  const toggleTag = (t: Tag) => {
    setTags(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  if (!trip) return <div style={{ padding: 80 }}>Loading…</div>;

  const chipDate = (() => {
    const d = todayDay ? new Date(todayDay.date + 'T00:00:00') : new Date();
    const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
    const monthDay = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${weekday} · ${monthDay}`;
  })();

  const sessionTitle = linkedItem?.title ?? 'this quiet moment';
  const speakerShort = linkedItem?.speaker ? linkedItem.speaker.split(/[,(]/)[0].trim() : null;
  const category = linkedItem?.category;

  return (
    <main
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 120px)',
        padding: '24px 16px',
      }}
    >
      {/* Dimmed backdrop */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(29, 29, 27, 0.45)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          placeItems: 'start center',
          paddingTop: 'clamp(24px, 5vw, 64px)',
          paddingBottom: 64,
        }}
      >
        <article
          className="collage-enter reflection-v2-card"
          style={{
            position: 'relative',
            width: 'min(540px, 100%)',
            minHeight: 300,
            background: 'var(--c-paper)',
            padding: 'clamp(20px, 3vw, 28px)',
            paddingTop: 40,
            boxShadow: 'var(--c-shadow)',
            display: 'grid',
            gridTemplateColumns: 'minmax(140px, 180px) minmax(0, 1fr)',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {/* Top-left: paperclip + QUICK CARD stamp */}
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              zIndex: 2,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                fontSize: 18,
                transform: 'rotate(-18deg)',
                lineHeight: 1,
              }}
            >
              📎
            </span>
            <Stamp variant="outline" size="sm" rotate={-3}>
              quick card
            </Stamp>
          </div>

          {/* Close × */}
          <button
            type="button"
            aria-label="close (demo)"
            onClick={() => {
              /* demo only */
            }}
            style={{
              position: 'absolute',
              top: 10,
              right: 12,
              appearance: 'none',
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              width: 28,
              height: 28,
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--c-font-body)',
              fontSize: 20,
              lineHeight: 1,
              color: 'var(--c-ink)',
              zIndex: 2,
            }}
          >
            ×
          </button>

          {/* LEFT column */}
          <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              paddingTop: 8,
            }}
          >
            <PolaroidCard
              mood={mood}
              rotate={-4}
              size="sm"
              tape
              overline={category ?? undefined}
              caption={chipDate}
            />
            <div
              style={{
                fontFamily: 'var(--c-font-body)',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--c-ink)',
                textAlign: 'center',
                lineHeight: 1.35,
                marginTop: 2,
              }}
            >
              {sessionTitle}
              {speakerShort ? (
                <div
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontWeight: 400,
                    fontStyle: 'italic',
                    fontSize: 12,
                    color: 'var(--c-ink-muted)',
                    marginTop: 2,
                  }}
                >
                  — {speakerShort}
                </div>
              ) : null}
            </div>
          </section>

          {/* RIGHT column */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <StickerPill variant="tape" rotate={-2}>
                #CPE · reflection
              </StickerPill>
            </div>

            <label style={{ display: 'block' }}>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 10,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  color: 'var(--c-ink-muted)',
                  marginBottom: 6,
                }}
              >
                the thought
              </span>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={4}
                placeholder="what don't you want to forget?"
                className="reflection-v2-body"
                style={{
                  width: '100%',
                  resize: 'vertical',
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 15,
                  lineHeight: '24px',
                  color: 'var(--c-ink)',
                  background: 'var(--c-creme)',
                  backgroundImage:
                    'repeating-linear-gradient(0deg, transparent 0 23px, rgba(31, 60, 198, 0.10) 23px 24px)',
                  border: '1.5px solid var(--c-ink)',
                  borderRadius: 'var(--c-r-sm)',
                  padding: '10px 12px',
                  outline: 'none',
                  transition: 'border-color var(--c-t-fast) var(--c-ease-out)',
                  minHeight: 108,
                }}
                onFocus={ev => (ev.currentTarget.style.borderColor = 'var(--c-pen)')}
                onBlur={ev => (ev.currentTarget.style.borderColor = 'var(--c-ink)')}
              />
            </label>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {TAGS.map(t => {
                const isOn = tags.has(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    aria-pressed={isOn}
                    style={{
                      appearance: 'none',
                      border: 0,
                      padding: 0,
                      background: 'transparent',
                      cursor: 'pointer',
                      transform: isOn ? 'translate(-1px,-1px)' : undefined,
                      transition: 'transform var(--c-t-fast) var(--c-ease-out)',
                    }}
                  >
                    <StickerPill variant={isOn ? 'pen' : 'ink'}>
                      #{t}
                    </StickerPill>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginTop: 4,
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  /* demo only */
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
                  transform: 'rotate(-2deg)',
                  transition: 'transform var(--c-t-fast) var(--c-ease-out)',
                }}
                onMouseOver={ev =>
                  (ev.currentTarget.style.transform = 'rotate(-2deg) translate(-2px,-2px)')
                }
                onMouseOut={ev => (ev.currentTarget.style.transform = 'rotate(-2deg)')}
              >
                keep it
              </button>
              <MarginNote rotate={-2} size={18}>
                saves automatically
              </MarginNote>
            </div>
          </section>
        </article>

        <p
          style={{
            position: 'relative',
            zIndex: 1,
            marginTop: 18,
            fontFamily: 'var(--c-font-body)',
            fontSize: 12,
            fontStyle: 'italic',
            color: 'var(--c-creme)',
            textAlign: 'center',
            maxWidth: 540,
            lineHeight: 1.5,
          }}
        >
          (demo: the sheet appears after tapping ✎ Reflect on the Dashboard)
        </p>
      </div>

      <style>{`
        @media (max-width: 540px) {
          .reflection-v2-card {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
