import { useState } from 'react';
import { Waves, Settings, Sun, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareDialog } from '@/components/sharing/ShareDialog';
import { TripSelector } from '@/components/trips/TripSelector';
import { useActiveTrip, getTripMode } from '@/hooks/use-trip';
import { Badge } from '@/components/ui/badge';
import type { TripMode } from '@/types/trip';

const modeConfig: Record<TripMode, { label: string; className: string }> = {
  pre: { label: 'Upcoming', className: 'bg-blue-100 text-blue-700' },
  active: { label: 'Active Now', className: 'bg-green-100 text-green-700' },
  post: { label: 'Completed', className: 'bg-amber-100 text-amber-700' },
};

interface TripHeaderProps {
  onOpenSettings: () => void;
}

export function TripHeader({ onOpenSettings }: TripHeaderProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const { data: trip } = useActiveTrip();
  
  const mode = trip ? getTripMode(trip) : 'pre';
  const modeInfo = modeConfig[mode];
  
  return (
    <>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sunset-gradient rounded-full flex items-center justify-center shadow-warm">
              <Sun className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg font-semibold text-foreground">
                  {trip?.title || 'Trip Planner'}
                </h1>
                {trip && (
                  <Badge variant="secondary" className={modeInfo.className}>
                    {modeInfo.label}
                  </Badge>
                )}
              </div>
              {trip?.location_name && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Waves className="w-3 h-3" />
                  {trip.location_name}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <TripSelector className="hidden sm:flex" />
            <Button variant="ghost" size="icon" onClick={() => setShareOpen(true)}>
              <Share2 className="w-5 h-5" />
              <span className="sr-only">Share</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onOpenSettings}>
              <Settings className="w-5 h-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </div>
        </div>
      </header>
      
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} />
    </>
  );
}
