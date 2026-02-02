import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Link } from 'lucide-react';
import { useAddAccommodation } from '@/hooks/use-accommodations';
import { toast } from 'sonner';

interface AddLodgingLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return '';
  }
}

export function AddLodgingLinkDialog({ open, onOpenChange }: AddLodgingLinkDialogProps) {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [urlError, setUrlError] = useState('');

  const addMutation = useAddAccommodation();

  const resetForm = () => {
    setUrl('');
    setLabel('');
    setUrlError('');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setUrlError('');
  };

  const handleSubmit = () => {
    // Validate URL if provided
    let finalUrl = url.trim();
    
    // Add https:// if no protocol
    if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }

    if (finalUrl && !isValidUrl(finalUrl)) {
      setUrlError('Please enter a valid URL');
      return;
    }

    // Use label or extract domain as name
    const title = label.trim() || (finalUrl ? getDomainFromUrl(finalUrl) : '') || 'Untitled Listing';

    addMutation.mutate(
      {
        title,
        url: finalUrl || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Listing added');
          handleClose();
        },
        onError: () => {
          toast.error('Failed to add listing');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Add Listing Link
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="label">Title *</Label>
            <Input
              id="label"
              placeholder="e.g., Beach House Option"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              A name for this listing
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Listing URL (optional)</Label>
            <Input
              id="url"
              placeholder="https://airbnb.com/rooms/..."
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className={urlError ? 'border-destructive' : ''}
            />
            {urlError && (
              <p className="text-sm text-destructive">{urlError}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={addMutation.isPending || !label.trim()}>
            {addMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
