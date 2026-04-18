import { ReactNode, CSSProperties } from 'react';

interface Props {
  children: ReactNode;
  rotate?: number; // default -2
  color?: 'pen' | 'ink';
  size?: number;   // px, default 20
  style?: CSSProperties;
  className?: string;
}

/**
 * Caveat handwriting accent. Per DESIGN-SYSTEM: decorative only, never AT-critical.
 * aria-hidden by default because the same info should appear in the document flow.
 */
export function MarginNote({
  children,
  rotate = -2,
  color = 'pen',
  size = 20,
  style,
  className = '',
}: Props) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        fontFamily: 'var(--c-font-script)',
        fontWeight: 600,
        fontSize: size,
        color: color === 'pen' ? 'var(--c-pen)' : 'var(--c-ink)',
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        display: 'inline-block',
        lineHeight: 1.1,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
