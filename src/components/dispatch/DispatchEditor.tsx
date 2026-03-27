import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, Eye, Send, Check } from 'lucide-react';
import { useMemories, getMemoryMediaUrl } from '@/hooks/use-memories';
import { useCreateDispatch } from '@/hooks/use-dispatches';
import type { ItineraryDay, ItineraryItem, Memory } from '@/types/trip';
import DispatchPreview from './DispatchPreview';

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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoSelectDone, setAutoSelectDone] = useState(false);

  // Auto-select reflections tagged insight / quote / training-seed on load
  useEffect(() => {
    if (dayReflections.length > 0 && !autoSelectDone) {
      const auto = new Set<string>();
      dayReflections.forEach((r) => {
        const tags = r.tags || [];
        if (tags.some((t) => ['insight', 'quote', 'training-seed'].includes(t)) &&
            !tags.includes('personal')) {
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Create Dispatch — {dayLabel}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Loading memories…
            </div>
          ) : shareUrl ? (
            /* Success state */
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="font-medium text-green-900 mb-1">Dispatch created!</p>
                <p className="text-sm text-green-700">Share this link with your team:</p>
              </div>
              <div className="flex gap-2">
                <code className="flex-1 text-xs bg-muted rounded px-3 py-2 overflow-x-auto select-all">
                  {shareUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
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
            <div className="space-y-6">
              {/* Section 1: Scene (photos) */}
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Scene — select photos
                </h3>
                {dayPhotos.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
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
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            selected
                              ? 'border-primary shadow-md'
                              : 'border-transparent opacity-70 hover:opacity-90'
                          }`}
                        >
                          <img
                            src={url}
                            alt={photo.title ?? 'Photo'}
                            className="w-full h-full object-cover"
                          />
                          {selected && (
                            <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Section 2: Insights (reflections, no personal) */}
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Insights — select reflections
                </h3>
                {dayReflections.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No reflections captured for this day yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {dayReflections.map((reflection) => {
                      const checked = selectedReflectionIds.has(reflection.id);
                      return (
                        <li
                          key={reflection.id}
                          className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/40 transition-colors"
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
                            <span className="text-sm text-foreground leading-relaxed">
                              {reflection.note}
                            </span>
                            {reflection.speaker && (
                              <span className="block text-xs text-muted-foreground mt-0.5">
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
                                    className="text-xs px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground"
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
              </section>

              {/* Section 3: Closing note */}
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Closing note (optional)
                </h3>
                <Textarea
                  placeholder="Add a closing reflection for this dispatch…"
                  value={closingNote}
                  onChange={(e) => setClosingNote(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </section>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setPreviewOpen(true)}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={
                    createDispatch.isPending ||
                    (selectedPhotoIds.size === 0 &&
                      selectedReflectionIds.size === 0 &&
                      !closingNote.trim())
                  }
                  className="flex-1 gap-2"
                >
                  <Send className="w-4 h-4" />
                  {createDispatch.isPending ? 'Creating…' : 'Create Dispatch'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DispatchPreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        dayTitle={dayLabel}
        selectedPhotos={selectedPhotos}
        selectedReflections={selectedReflections}
        closingNote={closingNote}
      />
    </>
  );
}
