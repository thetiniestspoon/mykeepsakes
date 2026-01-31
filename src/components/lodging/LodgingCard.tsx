import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  MapPin, 
  ExternalLink, 
  Bed, 
  Bath, 
  Users, 
  DollarSign,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Archive,
  Edit2,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LodgingOption, useVoteLodging, useSelectLodging, useArchiveLodging, useDeleteLodging } from '@/hooks/use-lodging';
import { MapModal } from '@/components/map/MapModal';

interface LodgingCardProps {
  lodging: LodgingOption;
  onEdit: () => void;
}

export function LodgingCard({ lodging, onEdit }: LodgingCardProps) {
  const [mapOpen, setMapOpen] = useState(false);
  
  const voteLodging = useVoteLodging();
  const selectLodging = useSelectLodging();
  const archiveLodging = useArchiveLodging();
  const deleteLodging = useDeleteLodging();

  const hasLocation = lodging.location_lat && lodging.location_lng;
  const voteScore = lodging.votes_up - lodging.votes_down;

  return (
    <>
      <Card className={cn(
        "shadow-warm transition-all",
        lodging.is_selected && "ring-2 ring-primary bg-primary/5",
        lodging.is_archived && "opacity-60"
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {lodging.is_selected && (
                  <Badge variant="default" className="bg-primary gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Booked
                  </Badge>
                )}
                {lodging.is_archived && (
                  <Badge variant="secondary">Archived</Badge>
                )}
              </div>
              <CardTitle className="text-lg mt-1 line-clamp-2">{lodging.name}</CardTitle>
            </div>
            
            {/* Vote buttons */}
            <div className="flex flex-col items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => voteLodging.mutate({ id: lodging.id, voteType: 'up' })}
              >
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <span className={cn(
                "text-sm font-semibold",
                voteScore > 0 && "text-green-600",
                voteScore < 0 && "text-red-600"
              )}>
                {voteScore > 0 ? '+' : ''}{voteScore}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => voteLodging.mutate({ id: lodging.id, voteType: 'down' })}
              >
                <ThumbsDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Description */}
          {lodging.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {lodging.description}
            </p>
          )}
          
          {/* Specs */}
          <div className="flex flex-wrap gap-3 text-sm">
            {lodging.price_per_night && (
              <div className="flex items-center gap-1 text-primary font-semibold">
                <DollarSign className="w-4 h-4" />
                ${lodging.price_per_night}/night
              </div>
            )}
            {lodging.bedrooms && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Bed className="w-4 h-4" />
                {lodging.bedrooms} bed
              </div>
            )}
            {lodging.bathrooms && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Bath className="w-4 h-4" />
                {lodging.bathrooms} bath
              </div>
            )}
            {lodging.max_guests && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="w-4 h-4" />
                {lodging.max_guests} guests
              </div>
            )}
          </div>

          {lodging.total_price && (
            <div className="text-sm">
              <span className="text-muted-foreground">Total: </span>
              <span className="font-semibold">${lodging.total_price}</span>
            </div>
          )}
          
          {/* Amenities */}
          {lodging.amenities && lodging.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {lodging.amenities.slice(0, 5).map((a, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {a}
                </Badge>
              ))}
              {lodging.amenities.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{lodging.amenities.length - 5} more
                </Badge>
              )}
            </div>
          )}
          
          {/* Pros/Cons */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {lodging.pros && lodging.pros.length > 0 && (
              <div className="space-y-1">
                {lodging.pros.slice(0, 2).map((p, i) => (
                  <div key={i} className="flex items-start gap-1 text-green-600">
                    <span className="shrink-0">✓</span>
                    <span className="line-clamp-1">{p}</span>
                  </div>
                ))}
              </div>
            )}
            {lodging.cons && lodging.cons.length > 0 && (
              <div className="space-y-1">
                {lodging.cons.slice(0, 2).map((c, i) => (
                  <div key={i} className="flex items-start gap-1 text-red-600">
                    <span className="shrink-0">✗</span>
                    <span className="line-clamp-1">{c}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          {lodging.notes && (
            <p className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
              {lodging.notes}
            </p>
          )}
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {hasLocation && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setMapOpen(true)}
              >
                <MapPin className="w-4 h-4 mr-1" />
                Map
              </Button>
            )}
            
            {lodging.url && (
              <Button size="sm" variant="outline" asChild>
                <a href={lodging.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View Listing
                </a>
              </Button>
            )}
            
            {!lodging.is_selected && !lodging.is_archived && (
              <Button 
                size="sm" 
                variant="default"
                onClick={() => selectLodging.mutate(lodging.id)}
                disabled={selectLodging.isPending}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Book This
              </Button>
            )}
            
            <Button size="sm" variant="ghost" onClick={onEdit}>
              <Edit2 className="w-4 h-4" />
            </Button>
            
            {!lodging.is_archived ? (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => archiveLodging.mutate({ id: lodging.id, isArchived: true })}
              >
                <Archive className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => archiveLodging.mutate({ id: lodging.id, isArchived: false })}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Lodging Option</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{lodging.name}"? This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => deleteLodging.mutate(lodging.id)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Map Modal */}
      {hasLocation && (
        <MapModal
          key={`${lodging.location_lat}-${lodging.location_lng}`}
          open={mapOpen}
          onOpenChange={setMapOpen}
          lat={lodging.location_lat!}
          lng={lodging.location_lng!}
          name={lodging.name}
          address={lodging.address || undefined}
        />
      )}
    </>
  );
}
