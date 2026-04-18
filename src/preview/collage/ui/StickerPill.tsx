import { ReactNode, CSSProperties } from 'react';

interface Props {
  children: ReactNode;
  variant?: 'pen' | 'ink' | 'tape';
  rotate?: number;
  style?: CSSProperties;
  className?: string;
}

/**
 * Ink/pen-backgrounded label with Rubik Mono One. Flat 2px radius — not a rounded pill.
 */
export function StickerPill({
  children,
  variant = 'pen',
  rotate = 0,
  style,
  className = '',
}: Props) {
  const v =
    variant === 'pen'
      ? { background: 'var(--c-pen)', color: 'var(--c-creme)' }
      : variant === 'ink'
      ? { background: 'var(--c-ink)', color: 'var(--c-creme)' }
      : { background: 'var(--c-tape)', color: 'var(--c-ink)' };

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        fontFamily: 'var(--c-font-display)',
        fontSize: 10,
        letterSpacing: '.22em',
        textTransform: 'uppercase',
        padding: '10px 14px',
        borderRadius: 'var(--c-r-sm)',
        boxShadow: 'var(--c-shadow-sm)',
        lineHeight: 1,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        ...v,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
