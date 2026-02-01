import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface AnimatedTabContentProps {
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

// Order of tabs for determining slide direction
const tabOrder = ['itinerary', 'map', 'album', 'guide', 'contacts', 'lodging', 'favorites'];

export function AnimatedTabContent({ 
  activeTab, 
  children,
  className,
}: AnimatedTabContentProps) {
  const prefersReducedMotion = useReducedMotion();
  const [displayedTab, setDisplayedTab] = useState(activeTab);
  const [animation, setAnimation] = useState<'none' | 'slide-left' | 'slide-right'>('none');
  const prevTabRef = useRef(activeTab);

  useEffect(() => {
    if (activeTab !== prevTabRef.current) {
      if (prefersReducedMotion) {
        setDisplayedTab(activeTab);
      } else {
        // Determine direction based on tab order
        const prevIndex = tabOrder.indexOf(prevTabRef.current);
        const newIndex = tabOrder.indexOf(activeTab);
        const direction = newIndex > prevIndex ? 'slide-left' : 'slide-right';
        
        setAnimation(direction);
        
        // After exit animation, update content and play enter animation
        const timer = setTimeout(() => {
          setDisplayedTab(activeTab);
          setAnimation('none');
        }, 150);
        
        return () => clearTimeout(timer);
      }
      
      prevTabRef.current = activeTab;
    }
  }, [activeTab, prefersReducedMotion]);

  const getAnimationClass = () => {
    if (prefersReducedMotion || animation === 'none') return '';
    
    return animation === 'slide-left' 
      ? 'animate-slide-in-right' 
      : 'animate-slide-in-left';
  };

  return (
    <div className={cn("overflow-hidden", className)}>
      <div className={cn("transition-opacity", getAnimationClass())}>
        {children}
      </div>
    </div>
  );
}
