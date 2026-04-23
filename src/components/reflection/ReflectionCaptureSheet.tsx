import { useState, useRef, useEffect } from 'react';
import { Camera, ChevronDown, ChevronUp, Loader2, X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { TagChips } from '@/components/reflection/TagChips';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import { useCreateReflection } from '@/hooks/use-reflections';
import { useUploadMemoryMedia } from '@/hooks/use-memories';
import type { InsightTag } from '@/types/conference';
import type { ItineraryDay } from '@/types/trip';
import '@/preview/collage/collage.css';

interface ReflectionCaptureSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  days: ItineraryDay[];
  currentDayId?: string;
}

/**
 * Reflection capture sheet — migrated to Collage direction (Phase 4 #10).
 * Sheet (shadcn) primitive preserved for slide-up animation. Content slot
 * wrapped with `collage-root` + paper surface. Ruled textarea (IBM Plex),
 * tag StickerPills via <TagChips>, ink "KEEP IT" save button. All form
 * state, auto-focus, photo-upload flow, and mutation calls unchanged.
 */
export function ReflectionCaptureSheet({
  open,
  onOpenChange,
  tripId,
  days: _days,
  currentDayId,
}: ReflectionCaptureSheetProps) {
  void _days; // reserved for future day-picker UI; preserve prop contract
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<InsightTag[]>([]);
  const [speaker, setSpeaker] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [showSpeakerFields, setShowSpeakerFields] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createReflection = useCreateReflection();
  const uploadMedia = useUploadMemoryMedia();

  // Auto-focus textarea after sheet animation completes
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleTagToggle = (tag: InsightTag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetState = () => {
    setNote('');
    setTags([]);
    setSpeaker('');
    setSessionTitle('');
    setShowSpeakerFields(false);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!note.trim()) return;

    setIsSaving(true);
    try {
      const reflection = await createReflection.mutateAsync({
        tripId,
        note: note.trim(),
        tags: tags.length > 0 ? tags : undefined,
        speaker: speaker.trim() || undefined,
        sessionTitle: sessionTitle.trim() || undefined,
        dayId: currentDayId,
      });

      if (photoFile) {
        await uploadMedia.mutateAsync({
          memoryId: reflection.id,
          tripId,
          file: photoFile,
          mediaType: photoFile.type.startsWith('video/') ? 'video' : 'image',
        });
      }

      resetState();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save reflection:', error);
      // Error toasts handled by mutations
    } finally {
      setIsSaving(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--c-font-display)',
    fontSize: 10,
    letterSpacing: '.22em',
    textTransform: 'uppercase',
    color: 'var(--c-ink-muted)',
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    fontFamily: 'var(--c-font-body)',
    fontSize: 15,
    color: 'var(--c-ink)',
    background: 'var(--c-creme)',
    border: '1.5px solid var(--c-ink)',
    borderRadius: 'var(--c-r-sm)',
    padding: '10px 12px',
    outline: 'none',
    transition: 'border-color var(--c-t-fast) var(--c-ease-out)',
    boxSizing: 'border-box',
  };

  const focusOn = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'var(--c-pen)';
  };
  const focusOff = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'var(--c-ink)';
  };

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(true) : handleClose())}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none"
      >
        <div
          className="collage-root"
          style={{
            position: 'relative',
            background: 'var(--c-paper)',
            padding: '24px 20px 28px',
            borderTop: '1px solid var(--c-line)',
            boxShadow: 'var(--c-shadow)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Stamp variant="outline" size="sm" rotate={-3}>
                quick card
              </Stamp>
              <StickerPill variant="tape" rotate={-2}>
                reflection
              </StickerPill>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Note textarea — ruled index card */}
            <label style={{ display: 'block' }}>
              <span style={labelStyle}>the thought</span>
              <textarea
                ref={textareaRef}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="what just struck you?"
                rows={4}
                onFocus={focusOn}
                onBlur={focusOff}
                style={{
                  ...inputStyle,
                  resize: 'none',
                  fontSize: 15,
                  lineHeight: '24px',
                  minHeight: 108,
                  backgroundImage:
                    'repeating-linear-gradient(0deg, transparent 0 23px, rgba(31, 60, 198, 0.10) 23px 24px)',
                }}
              />
            </label>

            {/* Tag chips */}
            <div>
              <span style={labelStyle}>tags</span>
              <TagChips selected={tags} onToggle={handleTagToggle} />
            </div>

            {/* Speaker & Session collapsible */}
            <div>
              <button
                type="button"
                onClick={() => setShowSpeakerFields((v) => !v)}
                style={{
                  appearance: 'none',
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 10,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  color: 'var(--c-pen)',
                }}
                aria-expanded={showSpeakerFields}
              >
                {showSpeakerFields ? (
                  <ChevronUp style={{ width: 14, height: 14 }} aria-hidden />
                ) : (
                  <ChevronDown style={{ width: 14, height: 14 }} aria-hidden />
                )}
                speaker &amp; session
              </button>

              {showSpeakerFields && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'block' }}>
                    <span style={labelStyle}>speaker</span>
                    <input
                      type="text"
                      value={speaker}
                      onChange={(e) => setSpeaker(e.target.value)}
                      placeholder="Speaker name"
                      style={inputStyle}
                      onFocus={focusOn}
                      onBlur={focusOff}
                    />
                  </label>
                  <label style={{ display: 'block' }}>
                    <span style={labelStyle}>session</span>
                    <input
                      type="text"
                      value={sessionTitle}
                      onChange={(e) => setSessionTitle(e.target.value)}
                      placeholder="Session title"
                      style={inputStyle}
                      onFocus={focusOn}
                      onBlur={focusOff}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Photo + Save row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginTop: 4,
              }}
            >
              {photoPreview ? (
                <div
                  style={{
                    position: 'relative',
                    width: 64,
                    height: 64,
                    flexShrink: 0,
                    border: '1.5px solid var(--c-ink)',
                    borderRadius: 'var(--c-r-sm)',
                    overflow: 'hidden',
                    background: 'var(--c-paper)',
                  }}
                >
                  <img
                    src={photoPreview}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    aria-label="Remove photo"
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      width: 20,
                      height: 20,
                      display: 'grid',
                      placeItems: 'center',
                      padding: 0,
                      background: 'rgba(29, 29, 27, 0.7)',
                      color: 'var(--c-creme)',
                      border: 0,
                      borderRadius: 'var(--c-r-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    <X style={{ width: 12, height: 12 }} aria-hidden />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    appearance: 'none',
                    width: 64,
                    height: 64,
                    flexShrink: 0,
                    background: 'var(--c-creme)',
                    color: 'var(--c-ink-muted)',
                    border: '1.5px dashed var(--c-line)',
                    borderRadius: 'var(--c-r-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    transition:
                      'border-color var(--c-t-fast) var(--c-ease-out), color var(--c-t-fast) var(--c-ease-out)',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--c-pen)';
                    e.currentTarget.style.color = 'var(--c-pen)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--c-line)';
                    e.currentTarget.style.color = 'var(--c-ink-muted)';
                  }}
                >
                  <Camera style={{ width: 20, height: 20 }} aria-hidden />
                  <span
                    style={{
                      fontFamily: 'var(--c-font-display)',
                      fontSize: 9,
                      letterSpacing: '.22em',
                      textTransform: 'uppercase',
                    }}
                  >
                    photo
                  </span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                style={{ display: 'none' }}
                onChange={handlePhotoSelect}
              />

              <button
                type="button"
                disabled={isSaving || !note.trim()}
                onClick={handleSave}
                className="mk-collage-keepit"
                style={{
                  appearance: 'none',
                  flex: 1,
                  height: 48,
                  cursor: isSaving || !note.trim() ? 'not-allowed' : 'pointer',
                  background: isSaving || !note.trim() ? 'var(--c-ink-muted)' : 'var(--c-ink)',
                  color: 'var(--c-creme)',
                  border: 0,
                  borderRadius: 'var(--c-r-sm)',
                  padding: '0 18px',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 12,
                  letterSpacing: '.26em',
                  textTransform: 'uppercase',
                  boxShadow: isSaving || !note.trim() ? 'none' : 'var(--c-shadow-sm)',
                  opacity: isSaving || !note.trim() ? 0.6 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'transform var(--c-t-fast) var(--c-ease-out)',
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  'Keep it'
                )}
              </button>
            </div>
          </div>

          <style>{`
            .mk-collage-keepit:not(:disabled):hover { transform: translate(-1px, -1px); }
            .mk-collage-keepit:focus-visible {
              outline: 2px solid var(--c-pen);
              outline-offset: 3px;
            }
            @media (prefers-reduced-motion: reduce) {
              .mk-collage-keepit:not(:disabled):hover { transform: none; }
            }
          `}</style>
        </div>
      </SheetContent>
    </Sheet>
  );
}
