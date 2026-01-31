import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Plus, Calendar, MapPin, Check, Loader2 } from 'lucide-react';
import { useTrips, useActiveTrip, getTripMode } from '@/hooks/use-trip';
import { useQueryClient } from '@tanstack/react-query';
import { CreateTripDialog } from './CreateTripDialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Trip, TripMode } from '@/types/trip';

const modeColors: Record<TripMode, string> = {
  pre: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  post: 'bg-amber-100 text-amber-700',
};

const modeLabels: Record<TripMode, string> = {
  pre: 'Upcoming',
  active: 'Active',
  post: 'Completed',
};

interface TripSelectorProps {
  className?: string;
}

export function TripSelector({ className }: TripSelectorProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: trips = [], isLoading } = useTrips();
  const { data: activeTrip } = useActiveTrip();
  const queryClient = useQueryClient();

  const handleSelectTrip = (trip: Trip) => {
    // For now, we invalidate the active-trip query to trigger a refetch
    // In a full implementation, you'd store the selected trip in localStorage/state
    queryClient.setQueryData(['active-trip'], trip);
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={cn("gap-2", className)}>
            {activeTrip ? (
              <>
                <span className="max-w-[120px] truncate">{activeTrip.title}</span>
                <Badge variant="secondary" className={cn("text-xs", modeColors[getTripMode(activeTrip)])}>
                  {modeLabels[getTripMode(activeTrip)]}
                </Badge>
              </>
            ) : (
              <span>Select Trip</span>
            )}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64">
          {trips.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No trips yet
            </div>
          ) : (
            trips.map((trip) => {
              const mode = getTripMode(trip);
              const isActive = activeTrip?.id === trip.id;
              
              return (
                <DropdownMenuItem
                  key={trip.id}
                  onClick={() => handleSelectTrip(trip)}
                  className="flex flex-col items-start gap-1 py-3"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{trip.title}</span>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className={cn("text-xs", modeColors[mode])}>
                        {modeLabels[mode]}
                      </Badge>
                      {isActive && <Check className="w-4 h-4 text-green-500" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {trip.location_name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {trip.location_name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(trip.start_date), 'MMM d')} - {format(new Date(trip.end_date), 'MMM d')}
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

      <CreateTripDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </>
  );
}
