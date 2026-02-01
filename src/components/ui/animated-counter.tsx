import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface AnimatedCounterProps {
  value: number;
  className?: string;
  duration?: number;
}

export function AnimatedCounter({ 
  value, 
  className,
  duration = 500,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      if (prefersReducedMotion) {
        setDisplayValue(value);
      } else {
        setIsAnimating(true);
        
        // Animate from old to new value
        const startValue = prevValue.current;
        const endValue = value;
        const startTime = performance.now();
        
        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Ease out cubic
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          const currentValue = Math.round(startValue + (endValue - startValue) * easeProgress);
          
          setDisplayValue(currentValue);
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            setIsAnimating(false);
          }
        };
        
        requestAnimationFrame(animate);
      }
      
      prevValue.current = value;
    }
  }, [value, duration, prefersReducedMotion]);

  return (
    <span 
      className={cn(
        "inline-block tabular-nums transition-transform",
        isAnimating && "scale-110",
        className
      )}
    >
      {displayValue}
    </span>
  );
}
