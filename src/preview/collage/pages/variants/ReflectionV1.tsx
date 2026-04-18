import { useMemo, useState } from 'react';
import { useActiveTrip, useTripDays } from '@/hooks/use-trip';
import { useItineraryItems } from '@/hooks/use-itinerary';
import { Stamp } from '../../ui/Stamp';
import { Tape } from '../../ui/Tape';
import { StickerPill } from '../../ui/StickerPill';
import { MarginNote } from '../../ui/MarginNote';
import type { ItineraryItem } from '@/types/trip';

/**
 * Reflection V1 — Notebook Page (vertical sheet).
 *
 * Preview-only rendering of the Reflection Capture Sheet as a tall, centered
 * paper card over a dimmed backdrop — as if the bottom-sheet modal is open.
 * The sheet is ~420px wide on desktop. Composition, top-down:
 *
 *   1. Header ribbon: Rubik Mono "NEW REFLECTION" with tape strips left/right
 *      + a non-functional close × button in the corner.
 *   2. Day chip: a taped crème pill showing today's localized date, plus a
 *      small ink-dashed "change day" affordance (demo: inert).
 *   3. Session link row: a compact "← reflecting on <title> by <speaker>"
 *      line pulled from real itinerary data (useItineraryItems filtered for
 *      today). A chevron hints at swap-in-place (demo: inert).
 *   4. Body: the ONE hero field. A ruled (horizontal-line background)
 *      textarea with IBM Plex Serif italic placeholder.
 *   5. Tags: 3–5 StickerPills for emotion tags — toggled via local state.
 *   6. Footer: an ink "KEEP IT" submit button + Caveat margin note
 *      "saves automatically".
 *
 * No Supabase writes. Entrance uses `collage-enter` for a soft fade-in;
 * `prefers-reduced-motion` is honored globally via collage.css.
 */
export function ReflectionV1() {
  const { data: trip } = useActiveTrip();
  const { data: days = [] } = useTripDays(trip?.id);
  const { data: items = [] } = useItineraryItems(trip?.id);

  // Find today's day — fall back to first day of the trip for preview purposes
  // so the sheet always has something to reflect on.
  const todayISO = new Date().toISOString().slice(0, 10);
  const todayDay = useMemo(
    () => days.find(d => d.date === todayISO) ?? days[0],
    [days, todayISO],
  );

  const dayItems = useMemo<ItineraryItem[]>(() => {
    if (!todayDay) return items;
    return items.filter(i => i.day_id === todayDay.id);
  }, [items, todayDay]);

  // Prefer an item that has a speaker (so the "by X" line lands) but fall
  // back to whatever's there.
  const linkedItem = useMemo<ItineraryItem | undefined>(() => {
    return (
      dayItems.find(i => i.speaker && i.category === 'worship') ??
      dayItems.find(i => i.speaker && i.category === 'workshop') ??
      dayItems.find(i => i.speaker) ??
      dayItems[0] ??
      items[0]
    );
  }, [dayItems, items]);

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

  // Pretty date: "Tue · Apr 21"
  const chipDate = (() => {
    const d = todayDay ? new Date(todayDay.date + 'T00:00:00') : new Date();
    const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
    const monthDay = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${weekday} · ${monthDay}`;
  })();

  const sessionTitle = linkedItem?.title ?? 'this quiet moment';
  const speakerShort = linkedItem?.speaker ? linkedItem.speaker.split(/[,(]/)[0].trim() : null;

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

      {/* Sheet card */}
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
          className="collage-enter"
          style={{
            position: 'relative',
            width: 'min(420px, 100%)',
            background: 'var(--c-paper)',
            padding: 'clamp(28px, 4vw, 36px) clamp(24px, 3.5vw, 32px) 28px',
            boxShadow: 'var(--c-shadow)',
          }}
        >
          {/* Decorative tape strips at the top corners */}
          <Tape position="top-left" rotate={-6} width={76} />
          <Tape position="top-right" rotate={5} width={76} />

          {/* Close × (demo-only) */}
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

          {/* Header ribbon */}
          <header style={{ textAlign: 'center', marginBottom: 20, marginTop: 4 }}>
            <Stamp variant="ink" size="md" rotate={-2}>
              new reflection
            </Stamp>
          </header>

          {/* Day chip + change day */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 18,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                position: 'relative',
                padding: '8px 14px',
                background: 'var(--c-creme)',
                border: '1.5px solid var(--c-ink)',
                borderRadius: 'var(--c-r-sm)',
                fontFamily: 'var(--c-font-body)',
                fontWeight: 500,
                fontSize: 14,
                color: 'var(--c-ink)',
                boxShadow: 'var(--c-shadow-sm)',
                transform: 'rotate(-1deg)',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: -7,
                  left: '50%',
                  transform: 'translateX(-50%) rotate(3deg)',
                  width: 42,
                  height: 12,
                  background: 'rgba(246, 213, 92, 0.72)',
                  boxShadow: '0 1px 2px rgba(0,0,0,.12)',
                }}
              />
              {chipDate}
            </span>
            <button
              type="button"
              onClick={() => {
                /* demo only */
              }}
              style={{
                appearance: 'none',
                background: 'transparent',
                border: 0,
                padding: '4px 0',
                cursor: 'pointer',
                fontFamily: 'var(--c-font-body)',
                fontSize: 12,
                color: 'var(--c-ink-muted)',
                borderBottom: '1px dashed var(--c-ink)',
                lineHeight: 1.2,
              }}
            >
              change day
            </button>
          </div>

          {/* Session link row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              padding: '10px 12px',
              marginBottom: 18,
              background: 'rgba(31, 60, 198, 0.06)',
              border: '1px dashed var(--c-pen)',
              borderRadius: 'var(--c-r-sm)',
              fontFamily: 'var(--c-font-body)',
              fontSize: 13.5,
              color: 'var(--c-ink)',
              lineHeight: 1.4,
            }}
          >
            <span aria-hidden="true" style={{ color: 'var(--c-pen)', marginTop: 1 }}>
              ←
            </span>
            <span style={{ flex: 1 }}>
              you're reflecting on{' '}
              <strong style={{ fontWeight: 500 }}>{sessionTitle}</strong>
              {speakerShort ? (
                <>
                  {' '}by <em style={{ fontStyle: 'italic' }}>{speakerShort}</em>
                </>
              ) : null}
            </span>
            <button
              type="button"
              aria-label="change session (demo)"
              onClick={() => {
                /* demo only */
              }}
              style={{
                appearance: 'none',
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                color: 'var(--c-pen)',
                fontFamily: 'var(--c-font-body)',
                fontSize: 16,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ›
            </button>
          </div>

          {/* BODY — the hero field */}
          <label style={{ display: 'block', marginBottom: 18 }}>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--c-font-display)',
                fontSize: 10,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                color: 'var(--c-ink-muted)',
                marginBottom: 8,
              }}
            >
              the thought
            </span>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={6}
              placeholder="what don't you want to forget?"
              className="reflection-v1-body"
              style={{
                width: '100%',
                resize: 'vertical',
                fontFamily: 'var(--c-font-body)',
                fontSize: 17,
                lineHeight: '27px',
                color: 'var(--c-ink)',
                background: 'var(--c-creme)',
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent 0 26px, rgba(31, 60, 198, 0.10) 26px 27px)',
                border: '1.5px solid var(--c-ink)',
                borderRadius: 'var(--c-r-sm)',
                padding: '12px 14px',
                outline: 'none',
                transition: 'border-color var(--c-t-fast) var(--c-ease-out)',
                minHeight: 180,
                fontStyle: body ? 'normal' : undefined,
              }}
              onFocus={ev => (ev.currentTarget.style.borderColor = 'var(--c-pen)')}
              onBlur={ev => (ev.currentTarget.style.borderColor = 'var(--c-ink)')}
            />
          </label>

          {/* TAGS */}
          <div style={{ marginBottom: 22 }}>
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
              how it landed
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
          </div>

          {/* FOOTER — submit */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
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
                padding: '12px 22px',
                background: 'var(--c-ink)',
                color: 'var(--c-creme)',
                fontFamily: 'var(--c-font-display)',
                fontSize: 14,
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
            <MarginNote rotate={-2} size={20}>
              saves automatically
            </MarginNote>
          </div>
        </article>

        {/* Demo-context label */}
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
            maxWidth: 420,
            lineHeight: 1.5,
          }}
        >
          (demo: the sheet appears after tapping ✎ Reflect on the Dashboard)
        </p>
      </div>
    </main>
  );
}
