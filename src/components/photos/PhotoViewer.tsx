import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Download, Share2, Pencil, Trash2 } from 'lucide-react';
import { getPhotoUrl } from '@/hooks/use-trip-data';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface Photo {
  id: string;
  storage_path: string;
  caption?: string | null;
  /** Optional memory id for memory_media photos — enables Edit/Delete flows upstream */
  memoryId?: string;
}

interface PhotoViewerProps {
  photos: Photo[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the user confirms deletion of the currently-viewed photo */
  onDelete?: (photo: Photo) => void;
  /** Called when the user taps Edit on the currently-viewed photo */
  onEdit?: (photo: Photo) => void;
}

export function PhotoViewer({ photos, initialIndex, open, onOpenChange, onDelete, onEdit }: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Reset to initial index when opening
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex]);

  const currentPhoto = photos[currentIndex];
  const photoUrl = currentPhoto ? getPhotoUrl(currentPhoto.storage_path) : '';

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  }, [photos.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, goToPrevious, goToNext]);

  const handleDownload = async () => {
    if (!currentPhoto) return;
    
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo-${currentPhoto.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download photo:', error);
    }
  };

  const handleEdit = () => {
    if (!currentPhoto || !onEdit) return;
    onEdit(currentPhoto);
  };

  const handleRequestDelete = () => {
    if (!currentPhoto || !onDelete) return;
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!currentPhoto || !onDelete) return;
    const photoToDelete = currentPhoto;
    // If this was the last photo, close the viewer after delete
    const willBeEmpty = photos.length <= 1;
    // Pre-advance index for a smoother transition when more photos remain
    if (!willBeEmpty && currentIndex >= photos.length - 1) {
      setCurrentIndex(currentIndex - 1);
    }
    onDelete(photoToDelete);
    setDeleteConfirmOpen(false);
    if (willBeEmpty) onOpenChange(false);
  };

  const handleShare = async () => {
    if (!navigator.share || !currentPhoto) return;

    try {
      await navigator.share({
        title: currentPhoto.caption || 'Trip Photo',
        url: photoUrl,
      });
    } catch {
      // User cancelled share - this is expected behavior, no action needed
    }
  };

  if (!currentPhoto) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>Photo Viewer</DialogTitle>
        </VisuallyHidden>
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Navigation arrows */}
        {photos.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12"
              onClick={goToNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </>
        )}

        {/* Main image container */}
        <div className="flex flex-col items-center justify-center h-full w-full p-4">
          <div 
            className="relative flex-1 flex items-center justify-center w-full overflow-hidden"
            style={{ touchAction: 'pinch-zoom' }}
          >
            <img
              src={photoUrl}
              alt={currentPhoto.caption || 'Trip photo'}
              className="max-w-full max-h-[70vh] object-contain select-none transition-transform duration-300"
              draggable={false}
              key={currentPhoto.id}
              style={{ animation: 'fadeIn 0.3s ease-out' }}
            />
          </div>

          {/* Footer with caption and controls */}
          <div className="w-full max-w-2xl py-4 px-2 text-center space-y-3">
            {currentPhoto.caption && (
              <p className="text-white text-sm">{currentPhoto.caption}</p>
            )}
            
            <div className="flex items-center justify-center gap-4">
              <span className="text-white/70 text-sm">
                {currentIndex + 1} of {photos.length}
              </span>
              
              <div className="flex flex-wrap items-center justify-center gap-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={handleEdit}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>

                {navigator.share && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                )}

                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:bg-red-500/20 hover:text-red-300"
                    onClick={handleRequestDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {onDelete && (
          <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the photo from your album. Can't be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Thumbnail navigation for multiple photos */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-lg max-w-[90vw] overflow-x-auto">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-12 h-12 rounded overflow-hidden flex-shrink-0 border-2 transition-all",
                  index === currentIndex 
                    ? "border-white" 
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <img
                  src={getPhotoUrl(photo.storage_path)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
