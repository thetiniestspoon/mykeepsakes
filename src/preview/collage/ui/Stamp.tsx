import { ReactNode, CSSProperties } from 'react';

interface Props {
  children: ReactNode;
  variant?: 'ink' | 'pen' | 'outline' | 'plain';
  rotate?: number; // degrees
  size?: 'sm' | 'md' | 'lg';
  as?: 'span' | 'div';
  style?: CSSProperties;
  className?: string;
}

/**
 * Rubber-stamp label. Rubik Mono One, uppercase, wide-tracked.
 * Per DESIGN-SYSTEM.md: never below 14px — below that it stops being a stamp.
 */
export function Stamp({
  children,
  variant = 'ink',
  rotate = 0,
  size = 'sm',
  as: Tag = 'span',
  style,
  className = '',
}: Props) {
  const sizeMap = {
    sm: { fontSize: 10, padding: '6px 10px', tracking: '.24em' },
    md: { fontSize: 12, padding: '8px 14px', tracking: '.24em' },
    lg: { fontSize: 16, padding: '10px 18px', tracking: '.22em' },
  }[size];

  const variantStyle: CSSProperties =
    variant === 'ink'
      ? { background: 'var(--c-ink)', color: 'var(--c-creme)' }
      : variant === 'pen'
      ? { background: 'var(--c-pen)', color: 'var(--c-creme)' }
      : variant === 'outline'
      ? { background: 'transparent', color: 'var(--c-pen)', border: '1.5px dashed currentColor' }
      : { background: 'transparent', color: 'var(--c-ink)' };

  return (
    <Tag
      className={className}
      style={{
        display: 'inline-block',
        fontFamily: 'var(--c-font-display)',
        fontSize: sizeMap.fontSize,
        letterSpacing: sizeMap.tracking,
        textTransform: 'uppercase',
        padding: variant === 'plain' ? 0 : sizeMap.padding,
        borderRadius: 'var(--c-r-sm)',
        whiteSpace: 'nowrap',
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        boxShadow: variant === 'ink' || variant === 'pen' ? 'var(--c-shadow-sm)' : undefined,
        lineHeight: 1,
        ...variantStyle,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
