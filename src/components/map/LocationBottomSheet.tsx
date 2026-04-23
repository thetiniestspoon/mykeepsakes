import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  Star,
  Camera,
  Navigation,
  Phone,
  Check,
  ExternalLink,
  MapPin,
  Loader2,
} from 'lucide-react';
import { useFavorites, useToggleFavorite } from '@/hooks/use-trip-data';
import { useToggleLocationVisit } from '@/hooks/use-locations';
import { MemoryCaptureDialog } from '@/components/album/MemoryCaptureDialog';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import '@/preview/collage/collage.css';
import type { Location } from '@/types/trip';

/**
 * Location bottom sheet — migrated to Collage direction (Phase 4 #6).
 * Shadcn Sheet primitive is preserved (slide-up anim, focus trap, escape-to-close).
 * Content slot is wrapped with `<div className="collage-root">` so Collage tokens apply
 * inside without leaking to sibling overlays. Data hooks (useFavorites / useToggleFavorite /
 * useToggleLocationVisit / MemoryCaptureDialog) are unchanged.
 */

interface LocationBottomSheetProps {
  location: Location | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId?: string;
  days?: Array<{ id: string; date: string; title: string | null }>;
  allLocations?: Location[];
}

export function LocationBottomSheet({
  location,
  open,
  onOpenChange,
  tripId,
  days = [],
  allLocations = [],
}: LocationBottomSheetProps) {
  const [memoryCaptureOpen, setMemoryCaptureOpen] = useState(false);

  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const toggleVisit = useToggleLocationVisit();

  if (!location) return null;

  const isFavorite = favorites?.[location.id] ?? false;
  const isVisited = !!location.visited_at;

  const handleToggleFavorite = () => {
    toggleFavorite.mutate({
      itemId: location.id,
      itemType: 'location',
      isFavorite: !isFavorite,
    });
  };

  const handleToggleVisited = () => {
    toggleVisit.mutate({
      id: location.id,
      visited: !isVisited,
    });
  };

  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
    window.open(url, '_blank');
  };

  const handleCall = () => {
    if (location.phone) {
      window.open(`tel:${location.phone}`, '_self');
    }
  };

  const handleWebsite = () => {
    if (location.url) {
      window.open(location.url, '_blank');
    }
  };

  // Shared collage-button style for the action grid.
  const actionButton: React.CSSProperties = {
    appearance: 'none',
    cursor: 'pointer',
    padding: '12px 10px',
    background: 'var(--c-paper)',
    color: 'var(--c-ink)',
    border: '1.5px solid var(--c-ink)',
    borderRadius: 'var(--c-r-sm)',
    fontFamily: 'var(--c-font-display)',
    fontSize: 10,
    letterSpacing: '.2em',
    textTransform: 'uppercase',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 68,
    transition: 'transform 140ms ease-out, background 140ms ease-out',
  };

  const activeButton: React.CSSProperties = {
    ...actionButton,
    background: 'var(--c-pen)',
    color: 'var(--c-creme)',
    borderColor: 'var(--c-pen)',
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="p-0 border-0 bg-transparent"
        >
          <div
            className="collage-root"
            style={{
              background: 'var(--c-paper)',
              borderTop: '1.5px solid var(--c-ink)',
              borderLeft: '1px solid var(--c-line)',
              borderRight: '1px solid var(--c-line)',
              boxShadow: 'var(--c-shadow)',
              padding: '22px 22px 28px',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <SheetHeader className="text-left space-y-2">
              <div style={{ display: 'flex', alignItems: 'start', gap: 14 }}>
                <div
                  aria-hidden
                  style={{
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isVisited ? '#3C7A4E' : 'var(--c-ink)',
                    color: 'var(--c-creme)',
                    flexShrink: 0,
                    boxShadow: 'var(--c-shadow-sm)',
                    borderRadius: 'var(--c-r-sm)',
                  }}
                >
                  {isVisited ? <Check size={22} /> : <MapPin size={22} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {location.category && (
                    <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 6 }}>
                      {location.category}
                    </Stamp>
                  )}
                  <SheetTitle asChild>
                    <h2
                      style={{
                        fontFamily: 'var(--c-font-body)',
                        fontSize: 22,
                        fontWeight: 500,
                        letterSpacing: '-.005em',
                        margin: 0,
                        color: 'var(--c-ink)',
                        lineHeight: 1.15,
                      }}
                    >
                      {location.name}
                    </h2>
                  </SheetTitle>
                  {location.address && (
                    <SheetDescription asChild>
                      <div style={{ marginTop: 6 }}>
                        <MarginNote rotate={-1} size={18} color="ink">
                          {location.address}
                        </MarginNote>
                      </div>
                    </SheetDescription>
                  )}
                </div>
              </div>
            </SheetHeader>

            {/* Notes */}
            {location.notes && (
              <div
                style={{
                  marginTop: 16,
                  marginBottom: 16,
                  padding: '10px 12px',
                  background: 'var(--c-creme)',
                  border: '1px solid var(--c-line)',
                  borderLeft: '3px solid var(--c-pen)',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 14,
                    color: 'var(--c-ink)',
                    margin: 0,
                    lineHeight: 1.45,
                  }}
                >
                  {location.notes}
                </p>
              </div>
            )}

            {/* Action grid */}
            <div
              style={{
                marginTop: 18,
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={handleToggleVisited}
                disabled={toggleVisit.isPending}
                style={isVisited ? activeButton : actionButton}
              >
                {toggleVisit.isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Check size={18} />
                )}
                <span>{isVisited ? 'Visited' : 'Mark Visited'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={toggleFavorite.isPending}
                style={isFavorite ? { ...activeButton, background: 'var(--c-tape)', color: 'var(--c-ink)', borderColor: 'var(--c-ink)' } : actionButton}
              >
                <Star size={18} style={{ fill: isFavorite ? 'var(--c-ink)' : 'transparent' }} />
                <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
              </button>

              <button
                type="button"
                onClick={() => setMemoryCaptureOpen(true)}
                style={actionButton}
              >
                <Camera size={18} />
                <span>Add Memory</span>
              </button>

              <button
                type="button"
                onClick={handleNavigate}
                style={actionButton}
              >
                <Navigation size={18} />
                <span>Navigate</span>
              </button>

              {location.phone && (
                <button
                  type="button"
                  onClick={handleCall}
                  style={actionButton}
                >
                  <Phone size={18} />
                  <span>Call</span>
                </button>
              )}

              {location.url && (
                <button
                  type="button"
                  onClick={handleWebsite}
                  style={actionButton}
                >
                  <ExternalLink size={18} />
                  <span>Website</span>
                </button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Memory Capture Dialog */}
      <MemoryCaptureDialog
        open={memoryCaptureOpen}
        onOpenChange={setMemoryCaptureOpen}
        tripId={tripId}
        days={days}
        locations={allLocations}
        preselectedLocationId={location.id}
      />
    </>
  );
}
