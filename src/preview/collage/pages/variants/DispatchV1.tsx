import { useMemo, useState } from 'react';
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
 * Dispatch V1 — Three Drawers (Scene · Insight · Closing).
 * Composition of a dispatch presented as three horizontal drawers on a single
 * reading page. Each drawer carries a Rubik Mono overline label plus a ruled
 * textarea styled as letter paper. Caveat-styled title field at the top,
 * ink stamp "SEND DISPATCH" button at the bottom, and a linked-memory
 * Polaroid anchored in the margin on desktop.
 *
 * Preview only. No Supabase writes. Pre-fills from a real Sankofa
 * itinerary item so the demo reads like actual material.
 */
export function DispatchV1() {
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
  const referenceTitle = linkedItem?.title ?? 'Opening worship';
  const speaker = linkedItem?.speaker ?? null;

  const [title, setTitle] = useState<string>(() =>
    referenceTitle ? `A letter after ${referenceTitle.toLowerCase()}` : 'A letter from Sankofa'
  );
  const [scene, setScene] = useState<string>(
    () =>
      `We were in the room for ${referenceTitle}${speaker ? ` with ${speaker.split(/[,(]/)[0].trim()}` : ''}. ` +
      `I'll try to describe it without editing the light — there was a hush, the kind that happens when people stop performing and begin listening.`
  );
  const [insight, setInsight] = useState<string>(
    `What I want you to keep is that grief and laughter sat next to each other the whole hour and nobody tried to move them apart. That felt like permission.`
  );
  const [closing, setClosing] = useState<string>(
    `Carry it home. We'll talk more on the porch.`
  );

  if (!trip) return <div style={{ padding: 80 }}>Loading…</div>;

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
        className="dispatch-v1-wrap"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 1080,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 280px',
          gap: 40,
          alignItems: 'start',
        }}
      >
        {/* Letter sheet */}
        <article
          style={{
            position: 'relative',
            background: 'var(--c-paper)',
            padding: 'clamp(32px, 4vw, 56px)',
            boxShadow: 'var(--c-shadow)',
          }}
        >
          <Tape position="top-left" rotate={-6} width={78} />
          <Tape position="top-right" rotate={5} width={72} />

          <Stamp variant="ink" size="md" rotate={-2} style={{ marginBottom: 18 }}>
            dispatch · draft
          </Stamp>

          {/* Caveat-styled title field */}
          <label style={{ display: 'block', marginBottom: 28 }}>
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
              title your dispatch
            </span>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="a letter from the room"
              style={{
                width: '100%',
                fontFamily: 'var(--c-font-script)',
                fontWeight: 600,
                fontSize: 'clamp(26px, 3.2vw, 34px)',
                lineHeight: 1.15,
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

          {/* Three drawers */}
          <Drawer
            label="scene"
            overline={`where it happened · ${location || 'the room'}`}
            value={scene}
            onChange={setScene}
            rows={5}
          />
          <Drawer
            label="insight"
            overline="what I want you to keep"
            value={insight}
            onChange={setInsight}
            rows={4}
          />
          <Drawer
            label="closing"
            overline="a line for the porch"
            value={closing}
            onChange={setClosing}
            rows={2}
          />

          <div
            style={{
              marginTop: 36,
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
              alignItems: 'center',
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
                padding: '12px 18px',
                background: 'var(--c-ink)',
                color: 'var(--c-creme)',
                fontFamily: 'var(--c-font-display)',
                fontSize: 13,
                letterSpacing: '.24em',
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
              send dispatch
            </button>
            <StickerPill variant="pen">save as draft</StickerPill>
            <MarginNote rotate={2} size={22} style={{ marginLeft: 4 }}>
              — demo · no writes
            </MarginNote>
          </div>
        </article>

        {/* Margin polaroid (desktop) */}
        <aside className="dispatch-v1-margin" style={{ paddingTop: 24 }}>
          <Stamp variant="outline" size="sm" rotate={-4} style={{ marginBottom: 16 }}>
            linked memory
          </Stamp>
          <PolaroidCard
            mood={mood}
            rotate={-3}
            size="sm"
            tape
            entrance
            overline={linkedItem?.category}
            caption={location || trip.title}
          />
          <div style={{ marginTop: 16 }}>
            <MarginNote rotate={-1} size={22} style={{ display: 'block' }}>
              from {referenceTitle}
            </MarginNote>
            {speaker && (
              <MarginNote rotate={2} size={20} color="ink" style={{ display: 'block', marginTop: 4 }}>
                with {speaker.split(/[,(]/)[0].trim()}
              </MarginNote>
            )}
          </div>
        </aside>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .dispatch-v1-wrap { grid-template-columns: 1fr !important; }
          .dispatch-v1-margin { order: -1; }
        }
      `}</style>
    </main>
  );
}

interface DrawerProps {
  label: string;
  overline: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
}

function Drawer({ label, overline, value, onChange, rows }: DrawerProps) {
  return (
    <section style={{ marginBottom: 28 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 14,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <Stamp variant="ink" size="sm">
          {label}
        </Stamp>
        <span
          style={{
            fontFamily: 'var(--c-font-body)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--c-ink-muted)',
          }}
        >
          {overline}
        </span>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        style={{
          width: '100%',
          resize: 'vertical',
          fontFamily: 'var(--c-font-body)',
          fontSize: 16,
          lineHeight: '27px',
          color: 'var(--c-ink)',
          background: 'var(--c-creme)',
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent 0 26px, rgba(31, 60, 198, 0.08) 26px 27px)',
          border: '1.5px solid var(--c-ink)',
          borderRadius: 'var(--c-r-sm)',
          padding: '12px 14px',
          outline: 'none',
          transition: 'border-color var(--c-t-fast) var(--c-ease-out)',
        }}
        onFocus={ev => (ev.currentTarget.style.borderColor = 'var(--c-pen)')}
        onBlur={ev => (ev.currentTarget.style.borderColor = 'var(--c-ink)')}
      />
    </section>
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
