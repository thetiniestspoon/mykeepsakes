import { getMemoryMediaUrl } from '@/hooks/use-memories';
import type { Memory } from '@/types/trip';

interface DispatchPreviewContentProps {
  dayTitle: string;
  selectedPhotos: Memory[];
  selectedReflections: Memory[];
  closingNote: string;
}

/**
 * Pure preview renderer — no Dialog wrapper.
 * Used inline on the right side of the DispatchEditor split-workspace view
 * (Phase 4 #3). When nothing is selected/written yet, shows a placeholder.
 */
export function DispatchPreviewContent({
  dayTitle,
  selectedPhotos,
  selectedReflections,
  closingNote,
}: DispatchPreviewContentProps) {
  const isEmpty =
    selectedPhotos.length === 0 &&
    selectedReflections.length === 0 &&
    !closingNote;

  return (
    <div className="space-y-6">
      {/* Day title */}
      <div className="border-b border-[var(--c-line)] pb-4">
        <h2 className="text-2xl font-display font-bold text-[var(--c-ink)]">{dayTitle}</h2>
      </div>

      {/* Scene: photo gallery */}
      {selectedPhotos.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--c-ink-muted)] mb-3">
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
                  className="aspect-square rounded-lg overflow-hidden bg-[var(--c-creme)]"
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
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--c-ink-muted)] mb-3">
            Insights
          </h3>
          <ul className="space-y-3">
            {selectedReflections.map((reflection) => (
              <li key={reflection.id} className="flex gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--c-pen)] shrink-0" />
                <div>
                  <p className="text-[var(--c-ink)] text-sm leading-relaxed">
                    {reflection.note}
                  </p>
                  {reflection.speaker && (
                    <p className="text-xs text-[var(--c-ink-muted)] mt-1">
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
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--c-ink-muted)] mb-3">
            Closing
          </h3>
          <blockquote className="border-l-4 border-[var(--c-pen)] pl-4 italic text-[var(--c-ink)] text-sm leading-relaxed">
            {closingNote}
          </blockquote>
        </section>
      )}

      {isEmpty && (
        <p className="text-center text-[var(--c-ink-muted)] text-sm py-8 italic">
          Pick photos or insights on the left — the preview will fill in here as you go.
        </p>
      )}
    </div>
  );
}
