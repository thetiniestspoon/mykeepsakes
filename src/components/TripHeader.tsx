import { useState } from 'react';
import { Settings, Sun, Share2, ChevronDown, MapPin, Calendar, Check, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ShareDialog } from '@/components/sharing/ShareDialog';
import { CreateTripDialog } from '@/components/trips/CreateTripDialog';
import { useTrips, useActiveTrip, useSelectTrip, getTripMode } from '@/hooks/use-trip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Trip, TripMode } from '@/types/trip';

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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: trip } = useActiveTrip();
  const { data: trips = [], isLoading: tripsLoading } = useTrips();
  const selectTrip = useSelectTrip();

  const mode = trip ? getTripMode(trip) : 'pre';
  const modeInfo = modeConfig[mode];

  const handleSelectTrip = (t: Trip) => {
    selectTrip.mutate(t.id);
  };

  // Only show the switcher chevron if there are multiple trips (or loading)
  const hasMultipleTrips = tripsLoading || trips.length > 1;

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Trip name area -- tappable to switch trips */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={!hasMultipleTrips}>
              <button
                className={cn(
                  "flex items-center gap-3 text-left min-w-0 rounded-lg px-2 py-1.5 -ml-2 transition-colors",
                  hasMultipleTrips && "hover:bg-secondary/50 active:bg-secondary/70 cursor-pointer"
                )}
              >
                <div className="w-10 h-10 bg-sunset-gradient rounded-full flex items-center justify-center shadow-warm shrink-0">
                  <Sun className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-lg font-semibold text-foreground truncate max-w-[180px] sm:max-w-none">
                      {trip?.title || 'Trip Planner'}
                    </h1>
                    {trip && (
                      <Badge variant="secondary" className={cn("shrink-0 text-xs", modeInfo.className)}>
                        {modeInfo.label}
                      </Badge>
                    )}
                    {hasMultipleTrips && (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  {trip?.location_name && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{trip.location_name}</span>
                    </p>
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-72">
              {tripsLoading ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Loading trips...
                </div>
              ) : trips.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No trips yet
                </div>
              ) : (
                trips.map((t) => {
                  const tripMode = getTripMode(t);
                  const isActive = trip?.id === t.id;

                  return (
                    <DropdownMenuItem
                      key={t.id}
                      onClick={() => handleSelectTrip(t)}
                      className="flex flex-col items-start gap-1 py-3"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={cn("font-medium truncate max-w-[160px]", isActive && "text-foreground")}>
                          {t.title}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="secondary" className={cn("text-xs", modeConfig[tripMode].className)}>
                            {modeConfig[tripMode].label}
                          </Badge>
                          {isActive && <Check className="w-4 h-4 text-green-500" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {t.location_name && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {t.location_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(t.start_date), 'MMM d')} - {format(new Date(t.end_date), 'MMM d')}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  );
                })
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Trip
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1">
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
      <CreateTripDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </>
  );
}
