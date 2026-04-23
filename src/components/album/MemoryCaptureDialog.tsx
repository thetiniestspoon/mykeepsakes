import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Loader2, ImagePlus } from 'lucide-react';
import { format } from 'date-fns';
import { useCreateMemory, useUploadMemoryMedia } from '@/hooks/use-memories';
import { toast } from 'sonner';
import type { Location } from '@/types/trip';
import { TagChips } from '@/components/reflection/TagChips';
import type { InsightTag } from '@/types/conference';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import { Tape } from '@/preview/collage/ui/Tape';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import '@/preview/collage/collage.css';

interface Day {
  id: string;
  date: string;
  title: string | null;
}

interface MemoryCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string | undefined;
  days: Day[];
  locations: Location[];
  preselectedDayId?: string;
  preselectedLocationId?: string;
  itineraryItemId?: string;
}

/**
 * Memory capture dialog — migrated to Collage direction (Phase 4 #4).
 * Scrapbook Spread vocabulary: polaroid-style photo tray, stamps as section
 * labels, Caveat margin note, tape accent. Upload + create-memory mutation
 * logic unchanged; presentation only.
 */
export function MemoryCaptureDialog({
  open,
  onOpenChange,
  tripId,
  days,
  locations,
  preselectedDayId,
  preselectedLocationId,
  itineraryItemId
}: MemoryCaptureDialogProps) {
  const [note, setNote] = useState('');
  const [selectedDayId, setSelectedDayId] = useState<string>(preselectedDayId || '');
  const [selectedLocationId, setSelectedLocationId] = useState<string>(preselectedLocationId || '');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [tags, setTags] = useState<InsightTag[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMemory = useCreateMemory();
  const uploadMedia = useUploadMemoryMedia();

  const handleToggleTag = (tag: InsightTag) =>
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Reset input value so picking the same file again (or picking any file in
    // a subsequent "Add" tap) reliably fires onChange. Important on iOS Safari
    // where `multiple` behavior can be flaky — sequential picks must keep working.
    e.target.value = '';
    if (files.length === 0) return;

    setSelectedFiles(prev => [...prev, ...files]);
    const newUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setNote('');
    setSelectedDayId(preselectedDayId || '');
    setSelectedLocationId(preselectedLocationId || '');
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setTags([]);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!tripId) {
      toast.error('No trip selected');
      return;
    }

    if (!note.trim() && selectedFiles.length === 0) {
      toast.error('Add a note or some photos');
      return;
    }

    setIsUploading(true);

    try {
      // Create the memory first
      const memory = await createMemory.mutateAsync({
        trip_id: tripId,
        note: note.trim() || null,
        title: null,
        day_id: selectedDayId || null,
        location_id: selectedLocationId || null,
        itinerary_item_id: itineraryItemId ?? null,
        memory_type: 'photo',
        tags: tags.length > 0 ? tags : undefined
      });

      // Upload all selected files
      for (const file of selectedFiles) {
        const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
        await uploadMedia.mutateAsync({
          memoryId: memory.id,
          tripId,
          file,
          mediaType
        });
      }

      toast.success('Memory saved!');
      handleClose();
    } catch (error) {
      console.error('Failed to save memory:', error);
      // Error toast is already handled by the mutation
    } finally {
      setIsUploading(false);
    }
  };

  const disabled = isUploading || (!note.trim() && selectedFiles.length === 0);

  // Section label — small display stamp treated as eyebrow.
  const sectionLabel = (text: string) => (
    <Stamp variant="plain" size="sm" style={{ color: 'var(--c-ink-muted)', padding: 0 }}>
      {text}
    </Stamp>
  );

  const hairline = (
    <div
      aria-hidden
      style={{
        height: 1,
        background: 'var(--c-line)',
        margin: '2px 0',
      }}
    />
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none">
        <div
          className="collage-root"
          style={{
            background: 'var(--c-paper)',
            position: 'relative',
            padding: '28px 24px 24px',
            boxShadow: 'var(--c-shadow)',
            border: '1px solid var(--c-line)',
          }}
        >
          <Tape position="top-right" rotate={5} width={68} />

          <DialogHeader className="text-left space-y-2">
            <Stamp variant="ink" size="sm" rotate={-2}>
              keep this
            </Stamp>
            <DialogTitle asChild>
              <h2
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 24,
                  fontWeight: 500,
                  letterSpacing: '-.005em',
                  margin: '10px 0 2px',
                  color: 'var(--c-ink)',
                }}
              >
                A new memory
              </h2>
            </DialogTitle>
            <p
              style={{
                fontFamily: 'var(--c-font-body)',
                fontStyle: 'italic',
                color: 'var(--c-ink-muted)',
                margin: 0,
                fontSize: 14,
              }}
            >
              A photo, a line, a tag or two — paste it into the book.
            </p>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
            {/* Photo/Video Selection — "tray" of polaroid-style chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sectionLabel('photos & video')}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {previewUrls.map((url, index) => (
                  <div
                    key={index}
                    className="group"
                    style={{
                      position: 'relative',
                      background: 'var(--c-paper)',
                      padding: 6,
                      paddingBottom: 14,
                      boxShadow: 'var(--c-shadow-sm)',
                      border: '1px solid var(--c-line)',
                      transform: `rotate(${index % 2 === 0 ? -2 : 2}deg)`,
                      width: 84,
                    }}
                  >
                    <img
                      src={url}
                      alt=""
                      style={{
                        width: '100%',
                        height: 72,
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    <button
                      onClick={() => removeFile(index)}
                      type="button"
                      aria-label="Remove photo"
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: 'var(--c-ink)',
                        color: 'var(--c-creme)',
                        border: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--c-shadow-sm)',
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                  style={{
                    width: 84,
                    height: 92,
                    background: 'var(--c-creme)',
                    border: '1.5px dashed var(--c-line)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--c-ink-muted)',
                    cursor: 'pointer',
                    borderRadius: 'var(--c-r-sm)',
                    fontFamily: 'var(--c-font-display)',
                    fontSize: 10,
                    letterSpacing: '.22em',
                    textTransform: 'uppercase',
                    gap: 4,
                  }}
                >
                  <ImagePlus className="w-5 h-5" />
                  <span>add</span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {hairline}

            {/* Note */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
              {sectionLabel('the line')}
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What happened? What do you want to remember?"
                rows={3}
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 15,
                  background: 'var(--c-creme)',
                  border: '1px solid var(--c-line)',
                  borderRadius: 'var(--c-r-sm)',
                  color: 'var(--c-ink)',
                  padding: '10px 12px',
                  lineHeight: 1.5,
                }}
              />
              <MarginNote
                rotate={-3}
                size={18}
                style={{
                  alignSelf: 'flex-end',
                  marginTop: -4,
                }}
              >
                in your own words
              </MarginNote>
            </div>

            {hairline}

            {/* Tags */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sectionLabel('tags (optional)')}
              <TagChips selected={tags} onToggle={handleToggleTag} />
            </div>

            {hairline}

            {/* Day + Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sectionLabel('day (optional)')}
                <Select
                  value={selectedDayId || 'none'}
                  onValueChange={(v) => setSelectedDayId(v === 'none' ? '' : v)}
                >
                  <SelectTrigger
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      background: 'var(--c-creme)',
                      border: '1px solid var(--c-line)',
                      borderRadius: 'var(--c-r-sm)',
                      color: 'var(--c-ink)',
                    }}
                  >
                    <SelectValue placeholder="No specific day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific day</SelectItem>
                    {days.map(day => (
                      <SelectItem key={day.id} value={day.id}>
                        {format(new Date(day.date), 'EEE, MMM d')}
                        {day.title && ` — ${day.title}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sectionLabel('where (optional)')}
                <Select
                  value={selectedLocationId || 'none'}
                  onValueChange={(v) => setSelectedLocationId(v === 'none' ? '' : v)}
                >
                  <SelectTrigger
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      background: 'var(--c-creme)',
                      border: '1px solid var(--c-line)',
                      borderRadius: 'var(--c-r-sm)',
                      color: 'var(--c-ink)',
                    }}
                  >
                    <SelectValue placeholder="No specific location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific location</SelectItem>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={isUploading}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'var(--c-creme)',
                  color: 'var(--c-ink)',
                  border: '1.5px solid var(--c-ink)',
                  borderRadius: 'var(--c-r-sm)',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 11,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  opacity: isUploading ? 0.45 : 1,
                  transition: 'transform var(--c-t-fast) var(--c-ease-out)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={disabled}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'var(--c-ink)',
                  color: 'var(--c-creme)',
                  border: 0,
                  borderRadius: 'var(--c-r-sm)',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 11,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.45 : 1,
                  boxShadow: 'var(--c-shadow-sm)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'transform var(--c-t-fast) var(--c-ease-out)',
                }}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save memory'
                )}
              </button>
            </div>

            <div style={{ marginTop: 2, textAlign: 'center' }}>
              <StickerPill variant="pen" style={{ opacity: 0.75 }}>
                mk · capture
              </StickerPill>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
