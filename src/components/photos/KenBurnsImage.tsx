import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface KenBurnsImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  onClick?: () => void;
}

export function KenBurnsImage({ 
  src, 
  alt, 
  className,
  containerClassName,
  onClick,
}: KenBurnsImageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div 
      className={cn(
        "overflow-hidden relative",
        containerClassName
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={src}
        alt={alt}
        onClick={onClick}
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "w-full h-full object-cover transition-transform",
          isLoaded && !prefersReducedMotion && isHovered && "animate-ken-burns",
          onClick && "cursor-pointer",
          className
        )}
        loading="lazy"
      />
    </div>
  );
}
