import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Utensils, Waves, Home, Car, PartyPopper, Activity, Star } from 'lucide-react';
import type { LegacyActivity } from '@/hooks/use-database-itinerary';

interface TimelineItemProps {
  activity: LegacyActivity;
  isNext?: boolean;
  onClick?: () => void;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  activity: Activity,
  dining: Utensils,
  beach: Waves,
  accommodation: Home,
  transport: Car,
  event: PartyPopper,
};

const categoryColors: Record<string, string> = {
  activity: 'border-blue-500 bg-blue-50',
  dining: 'border-orange-500 bg-orange-50',
  beach: 'border-teal-500 bg-teal-50',
  accommodation: 'border-gray-500 bg-gray-50',
  transport: 'border-slate-500 bg-slate-50',
  event: 'border-amber-500 bg-amber-50',
};

export function TimelineItem({ activity, isNext, onClick }: TimelineItemProps) {
  const Icon = categoryIcons[activity.category] || Activity;
  const isCompleted = activity.status === 'done';
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-start gap-3 w-full text-left p-3 rounded-lg border-l-4 transition-all hover:shadow-md",
        categoryColors[activity.category] || 'border-gray-500 bg-gray-50',
        isCompleted && "opacity-60",
        activity.isChosen && !isCompleted && "ring-1 ring-amber-400/60",
        isNext && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Status indicator */}
      <div className="flex-shrink-0 mt-0.5">
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        ) : (
          <Circle className={cn(
            "w-5 h-5",
            isNext ? "text-primary fill-primary/20" : "text-muted-foreground"
          )} />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Icon className="w-4 h-4 text-muted-foreground" />
          {activity.time && (
            <span className="text-sm font-medium text-muted-foreground">
              {activity.time}
            </span>
          )}
          {isNext && (
            <span className="text-xs px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full">
              Up Next
            </span>
          )}
          {activity.isChosen && !isCompleted && (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400"
              title="Registered session"
            >
              <Star className="w-3 h-3 fill-current" />
              Registered
            </span>
          )}
        </div>
        <h4 className={cn(
          "font-semibold text-foreground mt-1",
          isCompleted && "line-through"
        )}>
          {activity.title}
        </h4>
        {activity.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
            {activity.description}
          </p>
        )}
        {activity.location && (
          <p className="text-xs text-muted-foreground mt-1">
            📍 {activity.location.name}
          </p>
        )}
      </div>
    </button>
  );
}
