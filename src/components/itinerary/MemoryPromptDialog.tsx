import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Camera, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemoryPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityTitle: string;
  activityId: string;
  dayId: string;
  onAddPhoto: () => void;
}

const SESSION_STORAGE_KEY = 'memory-prompt-dismissed';

export function MemoryPromptDialog({
  open,
  onOpenChange,
  activityTitle,
  activityId,
  dayId,
  onAddPhoto
}: MemoryPromptDialogProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false);
  
  // Check if user has dismissed prompts for this session
  const isDismissedForSession = sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
  
  // Don't show if dismissed for session
  useEffect(() => {
    if (open && isDismissedForSession) {
      onOpenChange(false);
    }
  }, [open, isDismissedForSession, onOpenChange]);
  
  const handleSkip = () => {
    if (dontAskAgain) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    }
    onOpenChange(false);
  };
  
  const handleAddPhoto = () => {
    onAddPhoto();
    onOpenChange(false);
  };
  
  if (isDismissedForSession) {
    return null;
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <DialogTitle className="text-xl">
            Completed: {activityTitle}
          </DialogTitle>
          <DialogDescription className="text-center">
            Capture this memory before moving on?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          <Button 
            onClick={handleAddPhoto}
            className="w-full gap-2"
            size="lg"
          >
            <Camera className="w-5 h-5" />
            Add Photo
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            className="w-full"
          >
            Skip for now
          </Button>
          
          <label className="flex items-center gap-2 justify-center cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Checkbox
              checked={dontAskAgain}
              onCheckedChange={(checked) => setDontAskAgain(checked === true)}
            />
            <span>Don't ask again today</span>
          </label>
        </div>
      </DialogContent>
    </Dialog>
  );
}
