import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface ConfettiProps {
  trigger: boolean;
  duration?: number;
  particleCount?: number;
  onComplete?: () => void;
}

// Beach-themed colors
const confettiColors = [
  'hsl(15, 75%, 60%)',   // coral
  'hsl(40, 90%, 60%)',   // gold
  'hsl(165, 40%, 70%)',  // seafoam
  'hsl(195, 50%, 75%)',  // ocean light
  'hsl(24, 85%, 55%)',   // primary orange
];

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  size: number;
}

export function Confetti({ 
  trigger, 
  duration = 3000, 
  particleCount = 40,
  onComplete,
}: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (trigger && !prefersReducedMotion) {
      // Generate particles
      const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100, // percentage across container
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        delay: Math.random() * 300,
        rotation: Math.random() * 360,
        size: Math.random() * 8 + 4,
      }));
      
      setParticles(newParticles);
      
      // Clear particles after animation
      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [trigger, duration, particleCount, prefersReducedMotion, onComplete]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${particle.x}%`,
            top: '-20px',
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animationDelay: `${particle.delay}ms`,
            transform: `rotate(${particle.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
