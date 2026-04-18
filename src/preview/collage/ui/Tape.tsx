import { CSSProperties } from 'react';

interface Props {
  /** Positioning within the parent (which should be position:relative). */
  position?: 'top' | 'top-left' | 'top-right' | 'left' | 'right';
  /** Rotation in degrees. Default slight variance based on position. */
  rotate?: number;
  /** Width in px. */
  width?: number;
  /** Yellow fill opacity 0..1 (default 0.72). */
  opacity?: number;
  style?: CSSProperties;
}

/**
 * Decorative tape strip. Absolutely positioned — parent must be positioned.
 * aria-hidden always; purely decorative.
 */
export function Tape({ position = 'top', rotate, width = 88, opacity = 0.72, style }: Props) {
  const pos: CSSProperties = (() => {
    switch (position) {
      case 'top-left':
        return { top: -10, left: 12, transform: `rotate(${rotate ?? -6}deg)` };
      case 'top-right':
        return { top: -10, right: 12, transform: `rotate(${rotate ?? 4}deg)` };
      case 'left':
        return { top: '35%', left: -18, transform: `rotate(${rotate ?? -85}deg)` };
      case 'right':
        return { top: '35%', right: -18, transform: `rotate(${rotate ?? 85}deg)` };
      case 'top':
      default:
        return {
          top: -10,
          left: '50%',
          transform: `translateX(-50%) rotate(${rotate ?? -2}deg)`,
        };
    }
  })();

  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        width,
        height: 22,
        background: `rgba(246, 213, 92, ${opacity})`,
        boxShadow: '0 1px 2px rgba(0, 0, 0, .12)',
        pointerEvents: 'none',
        ...pos,
        ...style,
      }}
    />
  );
}
