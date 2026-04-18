import { ReactNode, CSSProperties } from 'react';
import { Tape } from './Tape';

export type Mood = 'sage' | 'gold' | 'sky' | 'dawn' | 'clay' | 'ink';

const MOOD_GRADIENTS: Record<Mood, string> = {
  sage: 'linear-gradient(155deg, #4a6b3e 0%, #8ba66e 45%, #d6c084 90%)',
  gold: 'linear-gradient(160deg, #8E7E59 0%, #C2A87A 30%, #D9BE8C 60%, #6B5840 100%)',
  sky:  'linear-gradient(140deg, #5b7fa8 0%, #8aaecc 50%, #d6e3ee 100%)',
  dawn: 'linear-gradient(180deg, #f8c291 0%, #f3c9b9 55%, #fde0cf 100%)',
  clay: 'linear-gradient(200deg, #b0785a 0%, #d7a379 45%, #f0d3ae 100%)',
  ink:  'linear-gradient(135deg, #2A2724 0%, #4a4338 50%, #7a7160 100%)',
};

interface Props {
  mood?: Mood;
  rotate?: number;             // degrees — ±3..6 is the house range
  caption?: ReactNode;          // rendered in Caveat under the photo
  overline?: ReactNode;         // small ink label above the photo
  tape?: boolean;               // show a tape strip across top
  size?: 'sm' | 'md' | 'lg';    // affects width + photo aspect
  entrance?: boolean;           // apply .collage-enter animation
  entranceDelayMs?: number;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;         // overlay nodes on top of photo (e.g. stamps)
}

/**
 * The Collage photo-card. White paper, sharp corners, shadow, CSS-gradient "photo".
 * Per DESIGN-SYSTEM: radii 0 (sharp as polaroids), padding reads as polaroid border.
 */
export function PolaroidCard({
  mood = 'sage',
  rotate = 0,
  caption,
  overline,
  tape = false,
  size = 'md',
  entrance = false,
  entranceDelayMs = 0,
  onClick,
  className = '',
  style,
  children,
}: Props) {
  const sizeMap = {
    sm: { width: 180, aspect: '4/5',  padBottom: 40 },
    md: { width: 240, aspect: '4/5',  padBottom: 48 },
    lg: { width: 320, aspect: '5/6',  padBottom: 56 },
  }[size];

  return (
    <article
      onClick={onClick}
      className={[
        'collage-polaroid',
        entrance ? 'collage-enter' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={{
        position: 'relative',
        background: 'var(--c-paper)',
        padding: `16px 16px ${sizeMap.padBottom}px`,
        boxShadow: 'var(--c-shadow)',
        width: sizeMap.width,
        cursor: onClick ? 'pointer' : 'default',
        transform: `rotate(${rotate}deg)`,
        transformOrigin: 'center',
        transition:
          'transform var(--c-t-fast) var(--c-ease-out), box-shadow var(--c-t-fast) var(--c-ease-out)',
        // for the keyframe
        ['--c-rot' as any]: `${rotate}deg`,
        animationDelay: entrance ? `${entranceDelayMs}ms` : undefined,
        ...style,
      }}
    >
      {tape && <Tape position="top" />}
      {overline && (
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
          {overline}
        </div>
      )}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: sizeMap.aspect,
          background: MOOD_GRADIENTS[mood],
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
      {caption && (
        <div
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 12,
            textAlign: 'center',
            fontFamily: 'var(--c-font-script)',
            fontWeight: 600,
            fontSize: 17,
            color: 'var(--c-ink)',
            lineHeight: 1.2,
          }}
        >
          {caption}
        </div>
      )}
    </article>
  );
}

/** Resolve an itinerary category + time-of-day into a mood. Heuristic. */
export function resolveMood(category?: string | null, startTime?: string | null): Mood {
  const cat = (category ?? '').toLowerCase();
  if (cat === 'worship') return 'gold';
  if (cat === 'workshop' || cat === 'seminar') return 'sage';
  if (cat === 'transport') return 'sky';
  if (cat === 'meal' || cat === 'dining') {
    const hour = parseInt((startTime ?? '').slice(0, 2), 10);
    if (!Number.isNaN(hour)) {
      if (hour < 10) return 'dawn';
      if (hour >= 17) return 'clay';
    }
    return 'dawn';
  }
  if (cat === 'social' || cat === 'event') return 'clay';
  if (cat === 'accommodation') return 'ink';
  // default: use time of day
  const hour = parseInt((startTime ?? '').slice(0, 2), 10);
  if (!Number.isNaN(hour)) {
    if (hour < 10) return 'dawn';
    if (hour < 14) return 'sage';
    if (hour < 18) return 'gold';
    return 'clay';
  }
  return 'sage';
}
