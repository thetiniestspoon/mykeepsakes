import { useState } from 'react';
import { Settings, Share2, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareDialog } from '@/components/sharing/ShareDialog';
import { ContactsFAB } from './ContactsFAB';
import { useActiveTrip, getTripMode } from '@/hooks/use-trip';
import { Badge } from '@/components/ui/badge';
import type { TripMode } from '@/types/trip';
import { cn } from '@/lib/utils';

const modeConfig: Record<TripMode, { label: string; className: string }> = {
  pre: { label: 'Upcoming', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  active: { label: 'Active', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  post: { label: 'Complete', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
};

interface CompactHeaderProps {
  onOpenSettings: () => void;
}

/**
 * Compact header for dashboard view
 * Single-line with trip info, status badge, and action buttons
 */
export function CompactHeader({ onOpenSettings }: CompactHeaderProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const { data: trip } = useActiveTrip();
  
  const mode = trip ? getTripMode(trip) : 'pre';
  const modeInfo = modeConfig[mode];

  return (
    <>
      <div className="flex items-center justify-between h-12 px-4">
        {/* Left: Trip info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-sunset-gradient rounded-full flex items-center justify-center shadow-warm flex-shrink-0">
            <Sun className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-sm text-foreground truncate">
                {trip?.title || 'Trip Planner'}
              </h1>
              {trip && (
                <Badge 
                  variant="secondary" 
                  className={cn("text-[10px] px-1.5 py-0", modeInfo.className)}
                >
                  {modeInfo.label}
                </Badge>
              )}
            </div>
            {trip?.location_name && (
              <p className="text-[10px] text-muted-foreground truncate">
                {trip.location_name}
              </p>
            )}
          </div>
        </div>
        
        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <ContactsFAB />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShareOpen(true)}>
            <Share2 className="w-4 h-4" />
            <span className="sr-only">Share</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onOpenSettings}>
            <Settings className="w-4 h-4" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </div>
      
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} />
    </>
  );
}
