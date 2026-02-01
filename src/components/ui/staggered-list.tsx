import React, { Children } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface StaggeredListProps {
  children: React.ReactNode;
  className?: string;
  /** Delay between each item in ms */
  staggerDelay?: number;
  /** Maximum items to stagger (rest appear instantly) */
  maxStagger?: number;
  /** Animation variant */
  variant?: 'fade' | 'slide';
}

export function StaggeredList({
  children,
  className,
  staggerDelay = 50,
  maxStagger = 10,
  variant = 'fade',
}: StaggeredListProps) {
  const prefersReducedMotion = useReducedMotion();

  const childArray = Children.toArray(children);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {childArray.map((child, index) => {
        const delay = Math.min(index, maxStagger) * staggerDelay;
        const animationClass = variant === 'fade' 
          ? 'animate-stagger-fade-in' 
          : 'animate-stagger-slide-in';
        
        return (
          <div
            key={index}
            className={cn('opacity-0', animationClass)}
            style={{ 
              animationDelay: `${delay}ms`,
              animationFillMode: 'forwards',
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
