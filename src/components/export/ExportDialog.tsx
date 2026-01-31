import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Download, FileArchive, Image, Loader2, CheckCircle } from 'lucide-react';
import { useActiveTrip } from '@/hooks/use-trip';
import { useExportTrip } from '@/hooks/use-export';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const [includePhotos, setIncludePhotos] = useState(true);
  const { data: trip } = useActiveTrip();
  const { exportTrip, isExporting, progress } = useExportTrip();

  const handleExport = () => {
    if (!trip) return;
    exportTrip({ tripId: trip.id, includePhotos });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileArchive className="w-5 h-5" />
            Export Trip
          </DialogTitle>
          <DialogDescription>
            Download your trip data as a ZIP file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* What's included */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Export includes:</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Trip details & itinerary</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>All locations & contacts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Memories & notes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Formatted itinerary (Markdown)</span>
              </div>
            </div>
          </div>

          {/* Photo toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Image className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label htmlFor="photos-toggle" className="text-sm font-medium">
                  Include photos
                </Label>
                <p className="text-xs text-muted-foreground">
                  May increase download time
                </p>
              </div>
            </div>
            <Switch
              id="photos-toggle"
              checked={includePhotos}
              onCheckedChange={setIncludePhotos}
            />
          </div>

          {/* Progress */}
          {isExporting && progress && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{progress}</span>
            </div>
          )}

          {/* Export button */}
          <Button
            onClick={handleExport}
            disabled={isExporting || !trip}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download ZIP
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
