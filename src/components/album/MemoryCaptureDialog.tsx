import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, X, Loader2, ImagePlus } from 'lucide-react';
import { format } from 'date-fns';
import { useCreateMemory, useUploadMemoryMedia } from '@/hooks/use-memories';
import { toast } from 'sonner';
import type { Location } from '@/types/trip';

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
}

export function MemoryCaptureDialog({
  open,
  onOpenChange,
  tripId,
  days,
  locations,
  preselectedDayId,
  preselectedLocationId
}: MemoryCaptureDialogProps) {
  const [note, setNote] = useState('');
  const [selectedDayId, setSelectedDayId] = useState<string>(preselectedDayId || '');
  const [selectedLocationId, setSelectedLocationId] = useState<string>(preselectedLocationId || '');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const createMemory = useCreateMemory();
  const uploadMedia = useUploadMemoryMedia();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Add new files
    setSelectedFiles(prev => [...prev, ...files]);
    
    // Create preview URLs
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
        itinerary_item_id: null
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-beach-sunset-coral" />
            Add Memory
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo/Video Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Photos & Videos</Label>
            <div className="flex flex-wrap gap-2">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <ImagePlus className="w-6 h-6" />
                <span className="text-xs mt-1">Add</span>
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

          {/* Note */}
          <div>
            <Label htmlFor="note" className="text-sm font-medium">Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What happened? What do you want to remember?"
              rows={3}
              className="mt-1.5"
            />
          </div>

          {/* Day Selection */}
          <div>
            <Label className="text-sm font-medium">Day (optional)</Label>
            <Select value={selectedDayId} onValueChange={setSelectedDayId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No specific day</SelectItem>
                {days.map(day => (
                  <SelectItem key={day.id} value={day.id}>
                    {format(new Date(day.date), 'EEE, MMM d')}
                    {day.title && ` - ${day.title}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Selection */}
          <div>
            <Label className="text-sm font-medium">Location (optional)</Label>
            <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No specific location</SelectItem>
                {locations.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={isUploading || (!note.trim() && selectedFiles.length === 0)}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Memory'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
