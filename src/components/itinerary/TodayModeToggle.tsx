import { Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodayModeToggleProps {
  isTodayMode: boolean;
  onToggle: () => void;
  isActiveTrip: boolean;
}

export function TodayModeToggle({ isTodayMode, onToggle, isActiveTrip }: TodayModeToggleProps) {
  // Only show toggle during active trips
  if (!isActiveTrip) {
    return null;
  }
  
  return (
    <div className="flex items-center justify-center gap-1 p-1 bg-muted rounded-full">
      <button
        onClick={() => !isTodayMode && onToggle()}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
          !isTodayMode 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Calendar className="w-4 h-4" />
        <span>Timeline</span>
      </button>
      <button
        onClick={() => isTodayMode && onToggle()}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
          isTodayMode 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Clock className="w-4 h-4" />
        <span>Today</span>
      </button>
    </div>
  );
}
