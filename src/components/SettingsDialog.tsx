import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useUpdatePin } from '@/hooks/use-trip-data';
import { useActiveTrip, useDeleteTrip } from '@/hooks/use-trip';
import { LogOut, Key, Download, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { ExportDialog } from '@/components/export/ExportDialog';
import { TripSelector } from '@/components/trips/TripSelector';
import { EmojiPinPad } from '@/components/auth/emoji-pin-pad';
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

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPin: string;
  onLogout: () => void;
}

export function SettingsDialog({ open, onOpenChange, currentPin, onLogout }: SettingsDialogProps) {
  const [pinStep, setPinStep] = useState<'idle' | 'create' | 'confirm'>('idle');
  const [firstPin, setFirstPin] = useState<string[]>([]);
  const [pinError, setPinError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const updatePin = useUpdatePin();
  const { data: trip } = useActiveTrip();
  const deleteTrip = useDeleteTrip();

  const handleStartPinChange = () => {
    setPinStep('create');
    setFirstPin([]);
    setPinError(null);
  };

  const handleFirstPin = (emojiPin: string[]) => {
    setFirstPin(emojiPin);
    setPinStep('confirm');
    setPinError(null);
  };

  const handleConfirmPin = async (emojiPin: string[]) => {
    if (emojiPin.join('') !== firstPin.join('')) {
      setPinError('PINs do not match. Try again.');
      setTimeout(() => {
        setPinStep('create');
        setFirstPin([]);
        setPinError(null);
      }, 1500);
      return;
    }

    updatePin.mutate(emojiPin, {
      onSuccess: () => {
        setPinStep('idle');
        setFirstPin([]);
        setPinError(null);
      },
      onError: () => {
        setPinError('Failed to update PIN.');
        setPinStep('idle');
        setFirstPin([]);
      },
    });
  };

  const handleCancelPinChange = () => {
    setPinStep('idle');
    setFirstPin([]);
    setPinError(null);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('ptown-authenticated');
    onLogout();
    onOpenChange(false);
  };

  const handleDeleteTrip = () => {
    if (!trip) return;
    deleteTrip.mutate(trip.id, {
      onSuccess: () => {
        setDeleteConfirmOpen(false);
      }
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Settings</DialogTitle>
            <DialogDescription>
              Manage your trip planner settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Trip Selector (mobile) */}
            <div className="sm:hidden space-y-2">
              <Label className="text-sm font-medium">Current Trip</Label>
              <TripSelector className="w-full justify-between" />
            </div>

            <Separator className="sm:hidden" />

            {/* Export Section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Trip
              </Label>
              <p className="text-xs text-muted-foreground">
                Download your trip data and photos as a ZIP file.
              </p>
              <Button
                variant="outline"
                onClick={() => setExportOpen(true)}
                disabled={!trip}
                className="w-full gap-2"
              >
                <Download className="w-4 h-4" />
                Export to ZIP
              </Button>
            </div>

            <Separator />

            {/* Change PIN Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Key className="w-4 h-4" />
                Change PIN
              </div>

              {pinStep === 'idle' && (
                <Button
                  variant="outline"
                  onClick={handleStartPinChange}
                  className="w-full"
                >
                  Set New Emoji PIN
                </Button>
              )}

              {pinStep === 'create' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Choose your new 4-emoji PIN
                  </p>
                  <EmojiPinPad
                    onSubmit={handleFirstPin}
                    error={pinError}
                    submitLabel="Next"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelPinChange}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {pinStep === 'confirm' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Confirm your new PIN
                  </p>
                  <EmojiPinPad
                    onSubmit={handleConfirmPin}
                    loading={updatePin.isPending}
                    error={pinError}
                    submitLabel="Update PIN"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelPinChange}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Danger Zone */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Danger Zone
              </Label>

              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={!trip}
                className="w-full gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="w-4 h-4" />
                Delete Current Trip
              </Button>
            </div>

            <Separator />

            {/* Logout Section */}
            <div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
              <p className="mt-2 text-xs text-center text-muted-foreground">
                You'll need to enter the PIN again to access the trip planner.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trip?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{trip?.title}" and all its data including itinerary,
              photos, and memories. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTrip}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTrip.isPending}
            >
              {deleteTrip.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Trip'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
