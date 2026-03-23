import { useState, useRef, useEffect } from 'react';
import { Camera, ChevronDown, ChevronUp, Loader2, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { TagChips } from '@/components/reflection/TagChips';
import { useCreateReflection } from '@/hooks/use-reflections';
import { useUploadMemoryMedia } from '@/hooks/use-memories';
import type { InsightTag } from '@/types/conference';
import type { ItineraryDay } from '@/types/trip';

interface ReflectionCaptureSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  days: ItineraryDay[];
  currentDayId?: string;
}

export function ReflectionCaptureSheet({
  open,
  onOpenChange,
  tripId,
  days,
  currentDayId,
}: ReflectionCaptureSheetProps) {
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
          mediaType: 'image',
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

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl px-4 pb-8 pt-4">
        <SheetHeader className="mb-3">
          <SheetTitle className="text-left">Quick Reflection</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Note textarea */}
          <Textarea
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What just struck you?"
            rows={4}
            className="resize-none"
          />

          {/* Tag chips */}
          <TagChips selected={tags} onToggle={handleTagToggle} />

          {/* Speaker & Session collapsible */}
          <div>
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowSpeakerFields((v) => !v)}
            >
              {showSpeakerFields ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Speaker &amp; session
            </button>

            {showSpeakerFields && (
              <div className="mt-2 space-y-2">
                <Input
                  value={speaker}
                  onChange={(e) => setSpeaker(e.target.value)}
                  placeholder="Speaker name"
                />
                <Input
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="Session title"
                />
              </div>
            )}
          </div>

          {/* Photo row */}
          <div className="flex items-center gap-3">
            {photoPreview ? (
              <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-0.5 right-0.5 p-0.5 bg-black/50 rounded-full text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-16 w-16 shrink-0 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Camera className="h-5 w-5" />
                <span className="text-xs mt-0.5">Photo</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoSelect}
            />

            {/* Save button */}
            <Button
              className="flex-1 h-12"
              disabled={isSaving || !note.trim()}
              onClick={handleSave}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
