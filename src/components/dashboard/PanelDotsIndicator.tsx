import { cn } from '@/lib/utils';

interface PanelDotsIndicatorProps {
  activeIndex: number;
  onDotClick: (index: number) => void;
}

const panels = [
  { label: 'Itinerary' },
  { label: 'Details' },
  { label: 'Map' },
];

export function PanelDotsIndicator({ activeIndex, onDotClick }: PanelDotsIndicatorProps) {
  return (
    <nav className="flex items-center justify-center gap-8 py-3 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      {panels.map((panel, i) => (
        <button
          key={i}
          onClick={() => onDotClick(i)}
          className="flex flex-col items-center gap-1.5 min-w-[60px] touch-manipulation"
          aria-label={`Go to ${panel.label}`}
          aria-current={i === activeIndex ? 'page' : undefined}
        >
          <span 
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-200",
              i === activeIndex
                ? "bg-primary scale-110"
                : "border-2 border-muted-foreground/50 hover:border-muted-foreground"
            )} 
          />
          <span 
            className={cn(
              "text-xs transition-colors duration-200",
              i === activeIndex
                ? "text-primary font-medium"
                : "text-muted-foreground"
            )}
          >
            {panel.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
