import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getMemoryMediaUrl } from '@/hooks/use-memories';
import type { Memory } from '@/types/trip';

interface DispatchPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayTitle: string;
  selectedPhotos: Memory[];
  selectedReflections: Memory[];
  closingNote: string;
}

export default function DispatchPreview({
  open,
  onOpenChange,
  dayTitle,
  selectedPhotos,
  selectedReflections,
  closingNote,
}: DispatchPreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Dispatch Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Day title */}
          <div className="border-b border-border pb-4">
            <h2 className="text-2xl font-display font-bold text-foreground">{dayTitle}</h2>
          </div>

          {/* Scene: photo gallery */}
          {selectedPhotos.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Scene
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedPhotos.map((photo) => {
                  const firstMedia = photo.media?.[0];
                  if (!firstMedia) return null;
                  const url = getMemoryMediaUrl(firstMedia.storage_path);
                  return (
                    <div
                      key={photo.id}
                      className="aspect-square rounded-lg overflow-hidden bg-muted"
                    >
                      <img
                        src={url}
                        alt={photo.title ?? 'Photo'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Insights */}
          {selectedReflections.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Insights
              </h3>
              <ul className="space-y-3">
                {selectedReflections.map((reflection) => (
                  <li key={reflection.id} className="flex gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <div>
                      <p className="text-foreground text-sm leading-relaxed">
                        {reflection.note}
                      </p>
                      {reflection.speaker && (
                        <p className="text-xs text-muted-foreground mt-1">
                          — {reflection.speaker}
                          {reflection.session_title && `, ${reflection.session_title}`}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Closing note */}
          {closingNote && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Closing
              </h3>
              <blockquote className="border-l-4 border-primary pl-4 italic text-foreground text-sm leading-relaxed">
                {closingNote}
              </blockquote>
            </section>
          )}

          {selectedPhotos.length === 0 &&
            selectedReflections.length === 0 &&
            !closingNote && (
              <p className="text-center text-muted-foreground text-sm py-8">
                Nothing selected yet. Go back and choose photos, insights, or add a closing note.
              </p>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
