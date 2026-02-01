import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface AnimatedCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function AnimatedCheckbox({ 
  checked, 
  onCheckedChange, 
  className,
  disabled = false,
}: AnimatedCheckboxProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger animation on check
  useEffect(() => {
    if (checked && !prefersReducedMotion) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [checked, prefersReducedMotion]);

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative w-5 h-5 rounded border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked 
          ? "bg-primary border-primary" 
          : "bg-background border-input hover:border-primary/50",
        isAnimating && "bg-green-500 border-green-500",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          "absolute inset-0 w-full h-full text-primary-foreground p-0.5",
          checked ? "opacity-100" : "opacity-0",
          !prefersReducedMotion && checked && "animate-checkmark-draw"
        )}
        style={{
          strokeDasharray: 24,
          strokeDashoffset: prefersReducedMotion || !checked ? 0 : 24,
        }}
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      
      {/* Ripple effect on check */}
      {isAnimating && !prefersReducedMotion && (
        <span 
          className="absolute inset-0 rounded bg-green-400 animate-ripple pointer-events-none"
        />
      )}
    </button>
  );
}
