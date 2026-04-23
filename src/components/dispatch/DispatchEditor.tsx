import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy, Send, Check } from 'lucide-react';
import { useMemories, getMemoryMediaUrl } from '@/hooks/use-memories';
import { useCreateDispatch } from '@/hooks/use-dispatches';
import { useActiveTrip } from '@/hooks/use-trip';
import type { ItineraryDay, ItineraryItem } from '@/types/trip';
import { DispatchPreviewContent } from './DispatchPreview';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import { Tape } from '@/preview/collage/ui/Tape';
import '@/preview/collage/collage.css';

interface DispatchEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  day: ItineraryDay;
  activities: ItineraryItem[];
}

const AUTO_SELECT_TAGS = ['insight', 'quote', 'training-seed'];

/**
 * Dispatch composition surface — Collage "Split Workspace" (Phase 4 #3).
 *
 * Left pane (editor): crème bg, Stamp section headers ("the scene" /
 * "what we saw" / "the closing"), Plex Serif inputs with hairline underline
 * + pen-blue focus, Rubik Mono uppercase primary CTA.
 *
 * Right pane (preview): paper-card render of the dispatch as the recipient
 * will see it, visually echoing SharedDispatch (see ./DispatchPreview.tsx).
 *
 * Presentation only. All form state, selection logic, and the createDispatch
 * mutation are unchanged. Mobile: split collapses to stacked.
 */
export default function DispatchEditor({
  open,
  onOpenChange,
  tripId,
  day,
  activities: _activities,
}: DispatchEditorProps) {
  const { data: allMemories = [], isLoading } = useMemories(tripId);
  const { data: trip } = useActiveTrip();
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleReflection = (id: string) => {
    setSelectedReflectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

  // ── shared inline styles (Collage vocabulary) ─────────────────────────────
  const sectionEyebrow: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--c-font-display)',
    fontSize: 10,
    letterSpacing: '.24em',
    textTransform: 'uppercase',
    color: 'var(--c-ink-muted)',
    marginBottom: 10,
    marginTop: 0,
  };

  const hint: React.CSSProperties = {
    fontFamily: 'var(--c-font-body)',
    fontStyle: 'italic',
    fontSize: 14,
    color: 'var(--c-ink-muted)',
    margin: 0,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(1200px,95vw)] w-full max-h-[95vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none">
        <div
          className="collage-root dispatch-editor-root"
          style={{
            background: 'var(--c-creme)',
            padding: 'clamp(20px, 3vw, 32px)',
            boxShadow: 'var(--c-shadow)',
            position: 'relative',
          }}
        >
          <DialogHeader className="mb-6 text-left">
            <Stamp variant="ink" size="sm" rotate={-2} style={{ marginBottom: 10 }}>
              compose · dispatch
            </Stamp>
            <DialogTitle asChild>
              <h2
                style={{
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 'clamp(20px, 2.4vw, 26px)',
                  letterSpacing: '-.005em',
                  color: 'var(--c-ink)',
                  margin: '6px 0 4px',
                  lineHeight: 1.1,
                }}
              >
                {dayLabel}
              </h2>
            </DialogTitle>
            <p
              style={{
                ...hint,
                margin: '4px 0 0',
              }}
            >
              Gather the scene, the insights, and a closing note — then send the letter.
            </p>
          </DialogHeader>

          {isLoading ? (
            <div
              style={{
                padding: '48px 16px',
                textAlign: 'center',
                fontFamily: 'var(--c-font-body)',
                color: 'var(--c-ink-muted)',
                fontSize: 14,
              }}
            >
              <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 10 }}>
                gathering memories
              </Stamp>
              <MarginNote rotate={-2} size={22} style={{ display: 'block' }}>
                one moment…
              </MarginNote>
            </div>
          ) : shareUrl ? (
            /* ── Success state — paper card with tape corners ──────────────── */
            <article
              style={{
                maxWidth: 560,
                margin: '0 auto',
                padding: '36px 28px 30px',
                background: 'var(--c-paper)',
                boxShadow: 'var(--c-shadow)',
                position: 'relative',
                textAlign: 'center',
              }}
            >
              <Tape position="top-left" rotate={-6} width={72} />
              <Tape position="top-right" rotate={5} width={72} />

              <Stamp variant="pen" size="sm" rotate={-2} style={{ marginBottom: 14 }}>
                dispatch sent
              </Stamp>
              <h3
                style={{
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 22,
                  letterSpacing: '-.01em',
                  color: 'var(--c-ink)',
                  margin: '6px 0 10px',
                }}
              >
                The letter is ready.
              </h3>
              <p
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontStyle: 'italic',
                  fontSize: 15,
                  color: 'var(--c-ink-muted)',
                  margin: '0 0 20px',
                  lineHeight: 1.6,
                }}
              >
                Share this link with your team.
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'stretch',
                  marginBottom: 20,
                }}
              >
                <code
                  style={{
                    flex: 1,
                    fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
                    fontSize: 12,
                    background: 'var(--c-creme)',
                    border: '1px solid var(--c-line)',
                    borderRadius: 'var(--c-r-sm)',
                    padding: '10px 12px',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                    color: 'var(--c-ink)',
                    textAlign: 'left',
                  }}
                  // select-all
                  onClick={(e) => {
                    const range = document.createRange();
                    range.selectNodeContents(e.currentTarget);
                    const sel = window.getSelection();
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                  }}
                >
                  {shareUrl}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label={copied ? 'Copied' : 'Copy link'}
                  style={{
                    appearance: 'none',
                    cursor: 'pointer',
                    padding: '10px 12px',
                    background: 'var(--c-creme)',
                    color: 'var(--c-ink)',
                    border: '1.5px solid var(--c-ink)',
                    borderRadius: 'var(--c-r-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform var(--c-t-fast) var(--c-ease-out)',
                  }}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                style={{
                  appearance: 'none',
                  cursor: 'pointer',
                  border: 0,
                  padding: '12px 22px',
                  background: 'var(--c-ink)',
                  color: 'var(--c-creme)',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 12,
                  letterSpacing: '.26em',
                  textTransform: 'uppercase',
                  borderRadius: 'var(--c-r-sm)',
                  boxShadow: 'var(--c-shadow-sm)',
                }}
              >
                close
              </button>

              <div style={{ marginTop: 18 }}>
                <StickerPill variant="tape" rotate={-1}>
                  a dispatch from the road
                </StickerPill>
              </div>
            </article>
          ) : (
            /* ── Split workspace: editor LEFT, live preview RIGHT ─────────── */
            <div
              className="dispatch-split"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: 'clamp(20px, 2.5vw, 32px)',
                alignItems: 'start',
              }}
            >
              {/* LEFT — EDITOR */}
              <section
                className="dispatch-editor-pane"
                style={{
                  position: 'relative',
                  background: 'var(--c-creme)',
                  border: '1px solid var(--c-line)',
                  padding: 'clamp(20px, 2.5vw, 28px)',
                }}
              >
                <Stamp variant="outline" size="sm" rotate={-3} style={{ marginBottom: 20 }}>
                  source · select
                </Stamp>

                {/* Section 1 — Scene (photos) */}
                <div style={{ marginBottom: 28 }}>
                  <Stamp variant="ink" size="sm" rotate={-1} style={{ marginBottom: 10 }}>
                    the scene
                  </Stamp>
                  <p style={{ ...hint, margin: '0 0 12px' }}>
                    Which photos tell it?
                  </p>
                  {dayPhotos.length === 0 ? (
                    <p
                      style={{
                        ...hint,
                        padding: '14px 12px',
                        border: '1px dashed var(--c-line)',
                        borderRadius: 'var(--c-r-sm)',
                      }}
                    >
                      No photos captured for this day yet.
                    </p>
                  ) : (
                    <div
                      className="dispatch-photo-grid"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
                        gap: 8,
                      }}
                    >
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
                            aria-pressed={selected}
                            style={{
                              appearance: 'none',
                              cursor: 'pointer',
                              position: 'relative',
                              aspectRatio: '1 / 1',
                              padding: 4,
                              background: 'var(--c-paper)',
                              border: `1.5px solid ${selected ? 'var(--c-pen)' : 'var(--c-line)'}`,
                              borderRadius: 'var(--c-r-sm)',
                              boxShadow: selected
                                ? 'var(--c-shadow-sm)'
                                : 'none',
                              transition:
                                'border-color var(--c-t-fast) var(--c-ease-out), box-shadow var(--c-t-fast) var(--c-ease-out), transform var(--c-t-fast) var(--c-ease-out)',
                              opacity: selected ? 1 : 0.88,
                            }}
                          >
                            <img
                              src={url}
                              alt={photo.title ?? 'Photo'}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                            />
                            {selected && (
                              <span
                                aria-hidden
                                style={{
                                  position: 'absolute',
                                  top: 2,
                                  right: 2,
                                  width: 18,
                                  height: 18,
                                  borderRadius: '50%',
                                  background: 'var(--c-pen)',
                                  color: 'var(--c-creme)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section 2 — What we saw (reflections / insights) */}
                <div style={{ marginBottom: 28 }}>
                  <Stamp variant="ink" size="sm" rotate={-1} style={{ marginBottom: 10 }}>
                    what we saw
                  </Stamp>
                  <p style={{ ...hint, margin: '0 0 12px' }}>
                    The insights worth passing on.
                  </p>
                  {dayReflections.length === 0 ? (
                    <p
                      style={{
                        ...hint,
                        padding: '14px 12px',
                        border: '1px dashed var(--c-line)',
                        borderRadius: 'var(--c-r-sm)',
                      }}
                    >
                      No reflections captured for this day yet.
                    </p>
                  ) : (
                    <ul
                      style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      {dayReflections.map((reflection) => {
                        const checked = selectedReflectionIds.has(reflection.id);
                        const inputId = `reflection-${reflection.id}`;
                        return (
                          <li key={reflection.id}>
                            <label
                              htmlFor={inputId}
                              style={{
                                display: 'flex',
                                gap: 10,
                                alignItems: 'flex-start',
                                padding: '10px 12px',
                                cursor: 'pointer',
                                background: checked
                                  ? 'rgba(31, 60, 198, 0.06)'
                                  : 'var(--c-paper)',
                                border: `1px ${checked ? 'solid' : 'dashed'} ${
                                  checked ? 'var(--c-pen)' : 'var(--c-line)'
                                }`,
                                borderRadius: 'var(--c-r-sm)',
                                transition:
                                  'background var(--c-t-fast) var(--c-ease-out), border-color var(--c-t-fast) var(--c-ease-out)',
                              }}
                            >
                              <input
                                id={inputId}
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleReflection(reflection.id)}
                                style={{
                                  marginTop: 4,
                                  accentColor: 'var(--c-pen)',
                                  width: 16,
                                  height: 16,
                                  flexShrink: 0,
                                  cursor: 'pointer',
                                }}
                              />
                              <span style={{ flex: 1, minWidth: 0 }}>
                                <span
                                  style={{
                                    display: 'block',
                                    fontFamily: 'var(--c-font-body)',
                                    fontSize: 14,
                                    lineHeight: 1.55,
                                    color: 'var(--c-ink)',
                                  }}
                                >
                                  {reflection.note}
                                </span>
                                {reflection.speaker && (
                                  <span
                                    style={{
                                      display: 'block',
                                      fontFamily: 'var(--c-font-display)',
                                      fontSize: 9,
                                      letterSpacing: '.22em',
                                      textTransform: 'uppercase',
                                      color: 'var(--c-ink-muted)',
                                      marginTop: 6,
                                    }}
                                  >
                                    {'—'} {reflection.speaker}
                                    {reflection.session_title
                                      ? ` · ${reflection.session_title}`
                                      : ''}
                                  </span>
                                )}
                                {(reflection.tags ?? []).length > 0 && (
                                  <span
                                    style={{
                                      display: 'flex',
                                      flexWrap: 'wrap',
                                      gap: 4,
                                      marginTop: 6,
                                    }}
                                  >
                                    {(reflection.tags ?? []).map((tag) => (
                                      <span
                                        key={tag}
                                        style={{
                                          fontFamily: 'var(--c-font-display)',
                                          fontSize: 9,
                                          letterSpacing: '.16em',
                                          textTransform: 'uppercase',
                                          padding: '2px 6px',
                                          borderRadius: 2,
                                          background: 'rgba(246, 213, 92, 0.45)',
                                          color: 'var(--c-ink)',
                                        }}
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </span>
                                )}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Section 3 — The closing note */}
                <div>
                  <Stamp variant="ink" size="sm" rotate={-1} style={{ marginBottom: 10 }}>
                    the closing
                  </Stamp>
                  <p style={{ ...hint, margin: '0 0 10px' }}>
                    A sentence or two to land the letter. Optional.
                  </p>
                  <label htmlFor="dispatch-closing-note" style={sectionEyebrow}>
                    closing note
                  </label>
                  <textarea
                    id="dispatch-closing-note"
                    value={closingNote}
                    onChange={(e) => setClosingNote(e.target.value)}
                    rows={4}
                    placeholder="What I want to keep…"
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      fontFamily: 'var(--c-font-body)',
                      fontSize: 15,
                      lineHeight: 1.6,
                      color: 'var(--c-ink)',
                      background: 'var(--c-paper)',
                      border: '1px solid var(--c-line)',
                      borderBottom: '1.5px solid var(--c-ink)',
                      borderRadius: 'var(--c-r-sm)',
                      padding: '10px 12px',
                      outline: 'none',
                      minHeight: 96,
                      transition:
                        'border-color var(--c-t-fast) var(--c-ease-out)',
                    }}
                    onFocus={(ev) => {
                      ev.currentTarget.style.borderColor = 'var(--c-pen)';
                      ev.currentTarget.style.borderBottomColor = 'var(--c-pen)';
                    }}
                    onBlur={(ev) => {
                      ev.currentTarget.style.borderColor = 'var(--c-line)';
                      ev.currentTarget.style.borderBottomColor = 'var(--c-ink)';
                    }}
                  />
                </div>
              </section>

              {/* RIGHT — LIVE PREVIEW (paper card, ink border, tape corners) */}
              <section
                className="dispatch-preview-pane"
                style={{
                  position: 'relative',
                  background: 'var(--c-paper)',
                  border: '1px solid var(--c-ink)',
                  boxShadow: 'var(--c-shadow)',
                  padding: 'clamp(24px, 3vw, 36px)',
                }}
              >
                <Tape position="top-left" rotate={-6} width={64} />
                <Tape position="top-right" rotate={5} width={64} />

                <div style={{ marginBottom: 18 }}>
                  <Stamp variant="ink" size="sm" rotate={3}>
                    preview
                  </Stamp>
                </div>

                <DispatchPreviewContent
                  dayTitle={dayLabel}
                  selectedPhotos={selectedPhotos}
                  selectedReflections={selectedReflections}
                  closingNote={closingNote}
                  tripTitle={trip?.title}
                />
              </section>
            </div>
          )}

          {/* Actions — Rubik Mono uppercase CTAs */}
          {!isLoading && !shareUrl && (
            <div
              className="dispatch-actions"
              style={{
                display: 'flex',
                gap: 12,
                paddingTop: 20,
                marginTop: 20,
                borderTop: '1px dashed var(--c-line)',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <MarginNote rotate={-2} size={20} style={{ marginRight: 'auto' }}>
                {nothingPicked ? 'pick one to begin' : 'ready when you are'}
              </MarginNote>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                style={{
                  appearance: 'none',
                  cursor: 'pointer',
                  padding: '12px 20px',
                  background: 'transparent',
                  color: 'var(--c-ink)',
                  border: '1.5px dashed var(--c-ink)',
                  borderRadius: 'var(--c-r-sm)',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 11,
                  letterSpacing: '.24em',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                }}
              >
                cancel
              </button>

              <button
                type="button"
                onClick={handleCreate}
                disabled={createDispatch.isPending || nothingPicked}
                style={{
                  appearance: 'none',
                  cursor:
                    createDispatch.isPending || nothingPicked
                      ? 'not-allowed'
                      : 'pointer',
                  padding: '12px 22px',
                  background: 'var(--c-ink)',
                  color: 'var(--c-creme)',
                  border: 0,
                  borderRadius: 'var(--c-r-sm)',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 11,
                  letterSpacing: '.26em',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                  boxShadow: 'var(--c-shadow-sm)',
                  opacity:
                    createDispatch.isPending || nothingPicked ? 0.45 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition:
                    'transform var(--c-t-fast) var(--c-ease-out), opacity var(--c-t-fast) var(--c-ease-out)',
                }}
              >
                <Send className="w-4 h-4" />
                {createDispatch.isPending ? 'sending…' : 'publish'}
              </button>
            </div>
          )}

          <style>{`
            @media (max-width: 860px) {
              .dispatch-split {
                grid-template-columns: 1fr !important;
              }
            }
            @media print {
              .dispatch-editor-root {
                background: #fff !important;
                box-shadow: none !important;
                padding: 0 !important;
              }
              .dispatch-editor-pane,
              .dispatch-actions {
                display: none !important;
              }
              .dispatch-preview-pane {
                box-shadow: none !important;
                border: none !important;
                padding: 16pt 8pt !important;
              }
              .dispatch-preview-pane > span[aria-hidden="true"] {
                display: none !important;
              }
              .dispatch-preview-photos {
                break-inside: avoid;
                page-break-inside: avoid;
              }
              .dispatch-preview-photos > div {
                box-shadow: none !important;
                border: 1px solid #ccc;
              }
            }
            @media (prefers-reduced-motion: reduce) {
              .dispatch-editor-root * {
                transition: none !important;
                animation: none !important;
              }
            }
          `}</style>
        </div>
      </DialogContent>
    </Dialog>
  );
}
