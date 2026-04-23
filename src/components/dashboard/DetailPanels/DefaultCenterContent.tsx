import { lazy, Suspense } from 'react';
import { GenericSkeleton, AlbumSkeleton } from '@/components/LoadingSkeletons';
import '@/preview/collage/collage.css';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { Tape } from '@/preview/collage/ui/Tape';
import { MarginNote } from '@/preview/collage/ui/MarginNote';

// Lazy load components
const GuideTab = lazy(() => import('@/components/GuideTab'));
const AlbumTab = lazy(() => import('@/components/album/AlbumTab').then(m => ({ default: m.AlbumTab })));

interface DefaultCenterContentProps {
  focus: 'guide' | 'current-activity' | 'album';
}

/**
 * Default center column content — migrated to Collage direction (Phase 4d).
 *
 * The "no detail selected" landing state for the center column. Framed like
 * opening a field notebook to a blank page: quiet, expectant, inviting. The
 * three foci share a consistent header vocabulary (Rubik Mono eyebrow, IBM
 * Plex Serif title, Caveat margin note, tape accent). current-activity is
 * the honest empty state — it wears the field-notebook metaphor most visibly.
 * Presentation only; lazy-loaded tabs untouched.
 */
export function DefaultCenterContent({ focus }: DefaultCenterContentProps) {
  if (focus === 'guide') {
    return (
      <div
        className="collage-root"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--c-creme)',
        }}
      >
        <CenterHeader
          eyebrow="the guide"
          title="Destination Guide"
          marginNote="what to know before we land"
          tapeRotate={-5}
        />
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <Suspense fallback={<GenericSkeleton />}>
            <GuideTab />
          </Suspense>
        </div>
      </div>
    );
  }

  if (focus === 'current-activity') {
    return (
      <div
        className="collage-root"
        style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '32px 24px',
          background: 'var(--c-creme)',
          overflow: 'hidden',
        }}
      >
        {/* Ruled-notebook faint lines — decorative, evokes open page */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent 0 27px, rgba(29,29,27,.06) 27px 28px)',
            pointerEvents: 'none',
          }}
        />
        {/* Pen-blue margin rule (left edge of a notebook page) */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 'clamp(20px, 6vw, 56px)',
            width: 1,
            background: 'var(--c-pen)',
            opacity: 0.28,
            pointerEvents: 'none',
          }}
        />

        <MarginNote
          rotate={-6}
          size={20}
          style={{ position: 'absolute', top: 28, left: 28 }}
        >
          a page waiting for today
        </MarginNote>

        <div
          style={{
            position: 'relative',
            background: 'var(--c-paper)',
            boxShadow: 'var(--c-shadow)',
            padding: '32px 36px 36px',
            maxWidth: 420,
            transform: 'rotate(-0.6deg)',
          }}
        >
          <Tape position="top-left" rotate={-7} width={72} opacity={0.72} />
          <Tape position="top-right" rotate={5} width={56} opacity={0.6} />

          <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 16 }}>
            today
          </Stamp>

          <h2
            style={{
              fontFamily: 'var(--c-font-body)',
              fontWeight: 500,
              fontSize: 24,
              lineHeight: 1.15,
              letterSpacing: '-.005em',
              color: 'var(--c-ink)',
              margin: 0,
            }}
          >
            Nothing opened yet.
          </h2>

          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 15,
              lineHeight: 1.55,
              color: 'var(--c-ink-muted)',
              margin: '12px 0 0',
              maxWidth: '34ch',
              marginInline: 'auto',
            }}
          >
            Pick a moment from the itinerary, or tap a pin on the map, and its
            story will fill this page.
          </p>

          <MarginNote rotate={-1} size={20} style={{ display: 'block', marginTop: 18 }}>
            — blank until you choose
          </MarginNote>
        </div>
      </div>
    );
  }

  if (focus === 'album') {
    return (
      <div
        className="collage-root"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--c-creme)',
        }}
      >
        <CenterHeader
          eyebrow="the album"
          title="Trip Memories"
          marginNote="what we carried home"
          tapeRotate={4}
        />
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <Suspense fallback={<AlbumSkeleton />}>
            <AlbumTab />
          </Suspense>
        </div>
      </div>
    );
  }

  return null;
}

interface CenterHeaderProps {
  eyebrow: string;
  title: string;
  marginNote: string;
  tapeRotate: number;
}

function CenterHeader({ eyebrow, title, marginNote, tapeRotate }: CenterHeaderProps) {
  return (
    <header
      style={{
        position: 'relative',
        padding: '18px 20px 16px',
        borderBottom: '1px solid var(--c-line)',
        background: 'var(--c-paper)',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <Tape position="top-left" rotate={tapeRotate} width={64} opacity={0.68} />

      <div>
        <div
          style={{
            fontFamily: 'var(--c-font-display)',
            fontSize: 10,
            letterSpacing: '.26em',
            textTransform: 'uppercase',
            color: 'var(--c-pen)',
            marginBottom: 4,
          }}
        >
          {eyebrow}
        </div>
        <h2
          style={{
            fontFamily: 'var(--c-font-body)',
            fontWeight: 500,
            fontSize: 20,
            lineHeight: 1.15,
            letterSpacing: '-.005em',
            color: 'var(--c-ink)',
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>

      <MarginNote rotate={-1} size={18}>
        {marginNote}
      </MarginNote>
    </header>
  );
}
