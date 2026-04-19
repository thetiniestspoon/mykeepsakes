import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, Send, Check } from 'lucide-react';
import { useMemories, getMemoryMediaUrl } from '@/hooks/use-memories';
import { useCreateDispatch } from '@/hooks/use-dispatches';
import type { ItineraryDay, ItineraryItem, Memory } from '@/types/trip';
import { DispatchPreviewContent } from './DispatchPreview';
import { Stamp } from '@/preview/collage/ui/Stamp';

interface DispatchEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  day: ItineraryDay;
  activities: ItineraryItem[];
}

const AUTO_SELECT_TAGS = ['insight', 'quote', 'training-seed'];

export default function DispatchEditor({
  open,
  onOpenChange,
  tripId,
  day,
  activities: _activities,
}: DispatchEditorProps) {
  const { data: allMemories = [], isLoading } = useMemories(tripId);
  const createDispatch = useCreateDispatch();

  // Derived: photos and reflections for this day
  const dayPhotos = useMemo(
    () =>
      allMemories.filter(
        (m) =>
          m.day_id === day.id &&
          m.memory_type === 'photo' &&
          m.media &&
          m.media.length > 0,
      ),
    [allMemories, day.id],
  );

  const dayReflections = useMemo(
    () =>
      allMemories.filter(
        (m) =>
          m.day_id === day.id &&
          m.memory_type === 'reflection' &&
          !(m.tags ?? []).includes('personal'),
      ),
    [allMemories, day.id],
  );

  // Selection state
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [selectedReflectionIds, setSelectedReflectionIds] = useState<Set<string>>(new Set());
  const [closingNote, setClosingNote] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoSelectDone, setAutoSelectDone] = useState(false);

  // Auto-select reflections tagged insight / quote / training-seed on load
  useEffect(() => {
    if (dayReflections.length > 0 && !autoSelectDone) {
      const auto = new Set<string>();
      dayReflections.forEach((r) => {
        const tags = r.tags || [];
        if (
          tags.some((t) => AUTO_SELECT_TAGS.includes(t)) &&
          !tags.includes('personal')
        ) {
          auto.add(r.id);
        }
      });
      setSelectedReflectionIds(auto);
      setAutoSelectDone(true);
    }
  }, [dayReflections, autoSelectDone]);

  const togglePhoto = (id: string) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleReflection = (id: string) => {
    setSelectedReflectionIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedPhotos = dayPhotos.filter((m) => selectedPhotoIds.has(m.id));
  const selectedReflections = dayReflections.filter((m) =>
    selectedReflectionIds.has(m.id),
  );

  const buildItems = (): Omit<
    import('@/types/conference').DispatchItem,
    'id' | 'dispatch_id' | 'created_at'
  >[] => {
    const items: Omit<
      import('@/types/conference').DispatchItem,
      'id' | 'dispatch_id' | 'created_at'
    >[] = [];
    selectedPhotos.forEach((m, i) =>
      items.push({
        item_type: 'photo',
        item_id: m.id,
        sort_order: i,
        section: 'scene',
      }),
    );
    selectedReflections.forEach((m, i) =>
      items.push({
        item_type: 'reflection',
        item_id: m.id,
        sort_order: i,
        section: 'insight',
      }),
    );
    return items;
  };

  const handleCreate = async () => {
    try {
      const result = await createDispatch.mutateAsync({
        tripId,
        dayId: day.id,
        closingNote,
        items: buildItems(),
      });
      const url = `${window.location.origin}/mykeepsakes/shared/${result.shareToken}/dispatch/${result.dispatch.id}`;
      setShareUrl(url);
    } catch {
      // error toast handled by hook
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const dayLabel = day.title ?? day.date;
  const nothingPicked =
    selectedPhotoIds.size === 0 &&
    selectedReflectionIds.size === 0 &&
    !closingNote.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(1200px,95vw)] w-full max-h-[95vh] overflow-y-auto p-0">
        <div className="collage-root p-6 sm:p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-display text-xl text-[var(--c-ink)]">
              Create Dispatch — {dayLabel}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="py-12 text-center text-[var(--c-ink-muted)] text-sm">
              Loading memories…
            </div>
          ) : shareUrl ? (
            /* Success state */
            <div className="space-y-4 py-4 max-w-xl mx-auto">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
                <Check className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-medium text-emerald-900 mb-1">Dispatch created!</p>
                <p className="text-sm text-emerald-700">Share this link with your team:</p>
              </div>
              <div className="flex gap-2">
                <code className="flex-1 text-xs bg-[var(--c-creme)] border border-[var(--c-line)] rounded px-3 py-2 overflow-x-auto select-all text-[var(--c-ink)]">
                  {shareUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            /* Split workspace: editor left, live preview right */
            <div
              className="grid gap-6 md:gap-8"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
            >
              {/* LEFT — editor */}
              <section
                className="space-y-6"
                style={{
                  background: 'var(--c-paper)',
                  boxShadow: 'var(--c-shadow)',
                  padding: 'clamp(20px, 2.5vw, 28px)',
                }}
              >
                <Stamp variant="outline" size="sm" rotate={-3}>
                  source · select
                </Stamp>

                {/* Scene (photos) */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--c-ink-muted)] mb-3">
                    Scene — select photos
                  </h3>
                  {dayPhotos.length === 0 ? (
                    <p className="text-sm text-[var(--c-ink-muted)] italic">
                      No photos captured for this day yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {dayPhotos.map((photo) => {
                        const firstMedia = photo.media?.[0];
                        if (!firstMedia) return null;
                        const url = getMemoryMediaUrl(firstMedia.storage_path);
                        const selected = selectedPhotoIds.has(photo.id);
                        return (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => togglePhoto(photo.id)}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-pen)] ${
                              selected
                                ? 'border-[var(--c-pen)] shadow-md'
                                : 'border-transparent opacity-70 hover:opacity-90'
                            }`}
                            aria-pressed={selected}
                          >
                            <img
                              src={url}
                              alt={photo.title ?? 'Photo'}
                              className="w-full h-full object-cover"
                            />
                            {selected && (
                              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--c-pen)] flex items-center justify-center">
                                <Check className="w-3 h-3 text-[var(--c-creme)]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Insights (reflections) */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--c-ink-muted)] mb-3">
                    Insights — select reflections
                  </h3>
                  {dayReflections.length === 0 ? (
                    <p className="text-sm text-[var(--c-ink-muted)] italic">
                      No reflections captured for this day yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {dayReflections.map((reflection) => {
                        const checked = selectedReflectionIds.has(reflection.id);
                        return (
                          <li
                            key={reflection.id}
                            className="flex items-start gap-3 rounded-lg border border-[var(--c-line)] p-3 hover:bg-[var(--c-creme)] transition-colors"
                          >
                            <Checkbox
                              id={`reflection-${reflection.id}`}
                              checked={checked}
                              onCheckedChange={() => toggleReflection(reflection.id)}
                              className="mt-0.5 shrink-0"
                            />
                            <label
                              htmlFor={`reflection-${reflection.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <span className="text-sm text-[var(--c-ink)] leading-relaxed">
                                {reflection.note}
                              </span>
                              {reflection.speaker && (
                                <span className="block text-xs text-[var(--c-ink-muted)] mt-0.5">
                                  — {reflection.speaker}
                                  {reflection.session_title &&
                                    `, ${reflection.session_title}`}
                                </span>
                              )}
                              {(reflection.tags ?? []).length > 0 && (
                                <span className="flex flex-wrap gap-1 mt-1">
                                  {(reflection.tags ?? []).map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--c-tape)]/30 text-[var(--c-ink)]"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </span>
                              )}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Closing note */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--c-ink-muted)] mb-3">
                    Closing note (optional)
                  </h3>
                  <Textarea
                    placeholder="Add a closing reflection for this dispatch…"
                    value={closingNote}
                    onChange={(e) => setClosingNote(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </section>

              {/* RIGHT — live preview */}
              <section
                style={{
                  background: 'var(--c-paper)',
                  boxShadow: 'var(--c-shadow)',
                  padding: 'clamp(20px, 2.5vw, 28px)',
                }}
              >
                <Stamp variant="filled" size="sm" rotate={3} style={{ marginBottom: 18 }}>
                  preview
                </Stamp>
                <DispatchPreviewContent
                  dayTitle={dayLabel}
                  selectedPhotos={selectedPhotos}
                  selectedReflections={selectedReflections}
                  closingNote={closingNote}
                />
              </section>
            </div>
          )}

          {/* Actions — sit outside the split so they're always anchored */}
          {!isLoading && !shareUrl && (
            <div className="flex gap-2 pt-6 mt-6 border-t border-[var(--c-line)] max-w-xl mx-auto">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createDispatch.isPending || nothingPicked}
                className="flex-1 gap-2"
              >
                <Send className="w-4 h-4" />
                {createDispatch.isPending ? 'Creating…' : 'Create Dispatch'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
