import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface FavoriteHeartProps {
  isFavorite: boolean;
  onToggle: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function FavoriteHeart({ 
  isFavorite, 
  onToggle, 
  className,
  size = 'md',
}: FavoriteHeartProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  const handleClick = () => {
    if (!isFavorite && !prefersReducedMotion) {
      setIsAnimating(true);
      setShowParticles(true);
      setTimeout(() => setIsAnimating(false), 400);
      setTimeout(() => setShowParticles(false), 600);
    }
    onToggle();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "relative p-1.5 rounded-full transition-colors",
        isFavorite 
          ? "text-beach-sunset-gold bg-beach-sunset-gold/20" 
          : "text-muted-foreground hover:text-beach-sunset-gold",
        className
      )}
    >
      <Star 
        className={cn(
          sizeConfig[size],
          isFavorite && "fill-current",
          isAnimating && "animate-heart-burst"
        )} 
      />
      
      {/* Particle burst effect */}
      {showParticles && !prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className="absolute w-1.5 h-1.5 bg-beach-sunset-gold rounded-full"
              style={{
                top: '50%',
                left: '50%',
                animation: `particle-burst-${i} 0.5s ease-out forwards`,
              }}
            />
          ))}
        </div>
      )}
      
      <style>{`
        @keyframes particle-burst-0 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-150%, -200%) scale(1); opacity: 0; }
        }
        @keyframes particle-burst-1 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(50%, -180%) scale(1); opacity: 0; }
        }
        @keyframes particle-burst-2 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(120%, -100%) scale(1); opacity: 0; }
        }
        @keyframes particle-burst-3 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-180%, -80%) scale(1); opacity: 0; }
        }
        @keyframes particle-burst-4 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(0%, -220%) scale(1); opacity: 0; }
        }
      `}</style>
    </button>
  );
}
