import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Link, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ScrapedLodgingData {
  name?: string;
  description?: string;
  address?: string;
  price_per_night?: number;
  bedrooms?: number;
  bathrooms?: number;
  max_guests?: number;
  amenities?: string[];
  photos?: string[];
  url?: string;
}

interface LodgingUrlImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: (data: ScrapedLodgingData) => void;
}

export function LodgingUrlImporter({ open, onOpenChange, onImportSuccess }: LodgingUrlImporterProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('scrape-lodging', {
        body: { url: url.trim() },
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to extract property details');
      }

      const scrapedData = data.data as ScrapedLodgingData;
      
      if (!scrapedData.name) {
        throw new Error('Could not extract property name. Try a different URL or enter details manually.');
      }

      toast({
        title: 'Property imported!',
        description: `"${scrapedData.name}" has been extracted. Review and save the details.`,
      });

      onImportSuccess(scrapedData);
      setUrl('');
      onOpenChange(false);
    } catch (err) {
      console.error('Import error:', err);
      const message = err instanceof Error ? err.message : 'Failed to import property';
      setError(message);
      toast({
        title: 'Import failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setUrl('');
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Import from URL
          </DialogTitle>
          <DialogDescription>
            Paste a listing URL from Airbnb, VRBO, or similar sites to automatically extract property details.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="import-url">Property Listing URL</Label>
            <Input
              id="import-url"
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              placeholder="https://airbnb.com/rooms/..."
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && url.trim()) {
                  handleImport();
                }
              }}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Major sites (Airbnb, VRBO, Booking.com) may be restricted. Works best with smaller rental sites and direct property listings.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!url.trim() || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Extracting...
              </>
            ) : (
              'Import Property'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
