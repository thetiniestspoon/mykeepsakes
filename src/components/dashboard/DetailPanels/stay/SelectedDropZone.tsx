import { useDroppable } from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Pencil, X, Calendar, Home } from 'lucide-react';
import { format } from 'date-fns';
import type { Accommodation } from '@/types/accommodation';
import { cn } from '@/lib/utils';

interface SelectedDropZoneProps {
  selected: Accommodation | null;
  isOver: boolean;
  onShowOnMap: () => void;
  onGetDirections: () => void;
  onUnselect: () => void;
  onEdit: () => void;
}

export function SelectedDropZone({
  selected,
  isOver,
  onShowOnMap,
  onGetDirections,
  onUnselect,
  onEdit,
}: SelectedDropZoneProps) {
  const { setNodeRef } = useDroppable({ id: 'selected-zone' });

  if (selected) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold">{selected.title}</h3>
                {selected.address && (
                  <p className="text-sm text-muted-foreground">{selected.address}</p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onUnselect} className="h-8 w-8 shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {(selected.check_in || selected.check_out) && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
                {selected.check_in && format(new Date(selected.check_in), 'MMM d')}
                {selected.check_in && selected.check_out && ' → '}
                {selected.check_out && format(new Date(selected.check_out), 'MMM d')}
              </span>
            </div>
          )}

          {selected.notes && (
            <p className="text-sm text-muted-foreground line-clamp-2">{selected.notes}</p>
          )}

          <div className="flex gap-2 flex-wrap">
            {selected.location_lat && selected.location_lng && (
              <>
                <Button variant="outline" size="sm" onClick={onShowOnMap}>
                  <MapPin className="w-4 h-4 mr-1" />
                  Map
                </Button>
                <Button variant="outline" size="sm" onClick={onGetDirections}>
                  <Navigation className="w-4 h-4 mr-1" />
                  Directions
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
        isOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      )}
    >
      <Home className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Drag an accommodation here to select it
      </p>
      <Badge variant="secondary" className="mt-2">
        Drop Zone
      </Badge>
    </div>
  );
}
