import { useMemo, useState } from 'react';
import { useActiveTrip } from '@/hooks/use-trip';
import { useMemories } from '@/hooks/use-memories';
import { useItineraryItems } from '@/hooks/use-itinerary';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { PolaroidCard, resolveMood } from '../../ui/PolaroidCard';
import { MarginNote } from '../../ui/MarginNote';
import type { ItineraryItem, Memory } from '@/types/trip';

/**
 * Dispatch V2 — Split Workspace (Source + Draft).
 * Two columns on desktop, stacked on mobile. LEFT is the memory/source
 * material being transformed into a dispatch (PolaroidCard + ruled meta +
 * a list of attachable itinerary items). RIGHT is the composition surface:
 * Caveat subject line, a continuous letter-prose textarea with IBM Plex
 * italic placeholder, a live paragraph count in Rubik Mono, and a stamp
 * SEND button.
 *
 * Preview only. No Supabase writes. Draft state is local React state.
 */
export function DispatchV2() {
  const { data: trip } = useActiveTrip();
  const { data: memories = [] } = useMemories(trip?.id);
  const { data: items = [] } = useItineraryItems(trip?.id);

  const realMemory = memories[0] as Memory | undefined;
  const sampleItem = useMemo<ItineraryItem | undefined>(() => {
    return (
      items.find(i => i.category === 'worship' && i.speaker) ??
      items.find(i => i.category === 'workshop' && i.speaker) ??
      items.find(i => i.speaker) ??
      items[0]
    );
  }, [items]);

  const linkedItem = realMemory?.itinerary_item ?? sampleItem;
  const mood = resolveMood(linkedItem?.category, linkedItem?.start_time ?? null);
  const location =
    realMemory?.location?.name ?? sampleItem?.location?.name ?? trip?.location_name ?? '';
  const speaker = linkedItem?.speaker ?? null;
  const referenceTitle = linkedItem?.title ?? 'Opening worship';

  // Candidate attachables — a few itinerary items the dispatch could cite.
  const attachables = useMemo<ItineraryItem[]>(() => {
    const pool = items.filter(i => i.id !== linkedItem?.id);
    return pool.slice(0, 4);
  }, [items, linkedItem?.id]);

  const [subject, setSubject] = useState<string>(() =>
    referenceTitle ? `after ${referenceTitle.toLowerCase()}` : 'after the morning session'
  );
  const [body, setBody] = useState<string>(
    () =>
      `Dear you —\n\n` +
      `I'm writing from the ${location || 'room'} the morning after ${referenceTitle}. ` +
      `${speaker ? `${speaker.split(/[,(]/)[0].trim()} said something I'll try to get right: that chaplaincy is the practice of staying when staying is the harder thing. ` : ''}` +
      `What I want to keep is the quiet after — where nobody tried to fix anything.\n\n` +
      `I'll bring more of this home with me. For now: one sentence on the porch, one on the page, and the rest I'll carry.`
  );
  const [attached, setAttached] = useState<Set<string>>(new Set());

  if (!trip) return <div style={{ padding: 80 }}>Loading…</div>;

  const toggleAttached = (id: string) => {
    setAttached(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Rough paragraph count — the indicator at the bottom.
  const paragraphs = body
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean).length;
  const paragraphLabel =
    paragraphs === 0
      ? 'empty draft'
      : paragraphs === 1
      ? 'about 1 paragraph'
      : `about ${paragraphs} paragraphs`;

  return (
    <main
      style={{
        padding: 'clamp(32px, 4vw, 64px) clamp(16px, 3vw, 48px) 96px',
        minHeight: 'calc(100vh - 120px)',
        display: 'grid',
        placeItems: 'start center',
      }}
    >
      <DemoBanner />

      <div
        className="dispatch-v2-split"
        style={{
          width: '100%',
          maxWidth: 1180,
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 360px) minmax(0, 1fr)',
          gap: 36,
          alignItems: 'start',
        }}
      >
        {/* LEFT — SOURCE */}
        <section
          style={{
            position: 'relative',
            background: 'var(--c-paper)',
            padding: 'clamp(24px, 3vw, 36px)',
            boxShadow: 'var(--c-shadow)',
          }}
        >
          <Stamp variant="outline" size="sm" rotate={-3} style={{ marginBottom: 18 }}>
            source
          </Stamp>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <PolaroidCard
              mood={mood}
              rotate={-3}
              size="md"
              tape
              entrance
              overline={linkedItem?.category}
              caption={location || trip.title}
            />
          </div>

          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: '72px 1fr',
              rowGap: 0,
              columnGap: 12,
              fontFamily: 'var(--c-font-body)',
              fontSize: 14,
              margin: '4px 0 20px',
            }}
          >
            <dt style={MetaDt}>when</dt>
            <dd style={MetaDd}>
              {linkedItem?.start_time
                ? `${linkedItem.start_time.slice(0, 5)}${linkedItem.end_time ? ` — ${linkedItem.end_time.slice(0, 5)}` : ''}`
                : '—'}
            </dd>

            <dt style={MetaDt}>where</dt>
            <dd style={MetaDd}>{location || '—'}</dd>

            {speaker && (
              <>
                <dt style={MetaDt}>with</dt>
                <dd style={MetaDd}>{speaker}</dd>
              </>
            )}

            <dt style={MetaDt}>trip</dt>
            <dd style={MetaDd}>{trip.title.replace(/\s*[–-].*$/, '')}</dd>
          </dl>

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
            also tag
          </div>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'grid',
              gap: 6,
            }}
          >
            {attachables.length === 0 && (
              <li
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontStyle: 'italic',
                  color: 'var(--c-ink-muted)',
                  fontSize: 14,
                }}
              >
                No other itinerary items to attach.
              </li>
            )}
            {attachables.map(it => {
              const isOn = attached.has(it.id);
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => toggleAttached(it.id)}
                    style={{
                      appearance: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      background: isOn ? 'rgba(31, 60, 198, 0.08)' : 'transparent',
                      border: `1px ${isOn ? 'solid' : 'dashed'} ${
                        isOn ? 'var(--c-pen)' : 'var(--c-line)'
                      }`,
                      borderRadius: 'var(--c-r-sm)',
                      fontFamily: 'var(--c-font-body)',
                      fontSize: 14,
                      color: 'var(--c-ink)',
                      lineHeight: 1.4,
                      transition: 'background var(--c-t-fast), border-color var(--c-t-fast)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--c-font-display)',
                        fontSize: 9,
                        letterSpacing: '.22em',
                        textTransform: 'uppercase',
                        color: 'var(--c-ink-muted)',
                        display: 'block',
                        marginBottom: 4,
                      }}
                    >
                      {it.category}
                      {it.start_time ? ` · ${it.start_time.slice(0, 5)}` : ''}
                    </span>
                    <span style={{ fontWeight: 500 }}>{it.title}</span>
                    {isOn && (
                      <MarginNote
                        rotate={-2}
                        size={18}
                        style={{ display: 'block', marginTop: 4 }}
                      >
                        ✓ attached
                      </MarginNote>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* RIGHT — DRAFT */}
        <section
          style={{
            position: 'relative',
            background: 'var(--c-paper)',
            padding: 'clamp(32px, 4vw, 56px)',
            boxShadow: 'var(--c-shadow)',
          }}
        >
          <Stamp variant="ink" size="md" rotate={-2} style={{ marginBottom: 18 }}>
            draft · dispatch
          </Stamp>

          <label style={{ display: 'block', marginBottom: 24 }}>
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
              subject
            </span>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="a line for the envelope"
              style={{
                width: '100%',
                fontFamily: 'var(--c-font-script)',
                fontWeight: 600,
                fontSize: 'clamp(24px, 2.8vw, 30px)',
                color: 'var(--c-ink)',
                background: 'var(--c-creme)',
                border: '1.5px solid var(--c-ink)',
                borderRadius: 'var(--c-r-sm)',
                padding: '10px 14px',
                outline: 'none',
                transition: 'border-color var(--c-t-fast) var(--c-ease-out)',
              }}
              onFocus={ev => (ev.currentTarget.style.borderColor = 'var(--c-pen)')}
              onBlur={ev => (ev.currentTarget.style.borderColor = 'var(--c-ink)')}
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
                marginBottom: 8,
              }}
            >
              letter
            </span>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={14}
              placeholder="Start anywhere. One sentence is enough to begin."
              className="dispatch-v2-body"
              style={{
                width: '100%',
                resize: 'vertical',
                fontFamily: 'var(--c-font-body)',
                fontSize: 17,
                lineHeight: '27px',
                color: 'var(--c-ink)',
                background: 'var(--c-creme)',
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent 0 26px, rgba(31, 60, 198, 0.08) 26px 27px)',
                border: '1.5px solid var(--c-ink)',
                borderRadius: 'var(--c-r-sm)',
                padding: '14px 16px',
                outline: 'none',
                transition: 'border-color var(--c-t-fast) var(--c-ease-out)',
                minHeight: 360,
              }}
              onFocus={ev => (ev.currentTarget.style.borderColor = 'var(--c-pen)')}
              onBlur={ev => (ev.currentTarget.style.borderColor = 'var(--c-ink)')}
            />
          </label>

          {/* live counter */}
          <div
            style={{
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--c-font-display)',
                fontSize: 10,
                letterSpacing: '.24em',
                textTransform: 'uppercase',
                color: 'var(--c-ink-muted)',
              }}
            >
              {paragraphLabel} · {attached.size} attached
            </span>
            <MarginNote rotate={-2} size={20}>
              — demo · no writes
            </MarginNote>
          </div>

          <div
            style={{
              marginTop: 28,
              display: 'flex',
              gap: 14,
              alignItems: 'center',
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
              send
            </button>
            <StickerPill variant="pen">save as draft</StickerPill>
          </div>
        </section>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .dispatch-v2-split { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}

function DemoBanner() {
  return (
    <div
      style={{
        background: 'rgba(31, 60, 198, 0.08)',
        border: '1px dashed var(--c-pen)',
        padding: '8px 12px',
        marginBottom: 28,
        fontSize: 12,
        color: 'var(--c-pen)',
        fontFamily: 'var(--c-font-body)',
        display: 'inline-block',
        letterSpacing: '.02em',
      }}
    >
      <strong>Demo</strong> — dispatch editor preview · no writes to Supabase.
    </div>
  );
}

const MetaDt: React.CSSProperties = {
  fontFamily: 'var(--c-font-display)',
  fontSize: 10,
  letterSpacing: '.22em',
  textTransform: 'uppercase',
  color: 'var(--c-ink)',
  padding: '8px 0',
  borderBottom: '1px dashed var(--c-line)',
  alignSelf: 'center',
};

const MetaDd: React.CSSProperties = {
  fontFamily: 'var(--c-font-body)',
  fontSize: 14,
  color: 'var(--c-ink)',
  margin: 0,
  padding: '8px 0',
  borderBottom: '1px dashed var(--c-line)',
  lineHeight: 1.4,
};
