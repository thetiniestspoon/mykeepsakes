import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUpdatePin } from '@/hooks/use-trip-data';
import { useActiveTrip, useDeleteTrip } from '@/hooks/use-trip';
import { Loader2 } from 'lucide-react';
import { ExportDialog } from '@/components/export/ExportDialog';
import { TripSelector } from '@/components/trips/TripSelector';
import { CollageEmojiPad } from '@/components/auth/CollageEmojiPad';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
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
import '@/preview/collage/collage.css';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPin: string;
  onLogout: () => void;
}

/**
 * Settings dialog — migrated to Collage direction (Phase 4 #12).
 * usePin / updatePin / deleteTrip / logout logic unchanged; only chrome restyled.
 * Shadcn Dialog keeps its overlay/positioning; we wrap DialogContent's children
 * with `<div className="collage-root">` so tokens apply inside.
 */
export function SettingsDialog({ open, onOpenChange, onLogout }: SettingsDialogProps) {
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
    sessionStorage.removeItem('mk-authenticated');
    onLogout();
    onOpenChange(false);
  };

  const handleDeleteTrip = () => {
    if (!trip) return;
    deleteTrip.mutate(trip.id, {
      onSuccess: () => {
        setDeleteConfirmOpen(false);
      },
    });
  };

  // Reusable inline-styled button using Collage tokens.
  const collageButton = (
    opts: {
      variant?: 'solid' | 'outline' | 'ghost' | 'danger';
      disabled?: boolean;
      onClick?: () => void;
      children: React.ReactNode;
      full?: boolean;
    },
  ) => {
    const { variant = 'outline', disabled, onClick, children, full = true } = opts;
    const base: React.CSSProperties = {
      appearance: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      width: full ? '100%' : undefined,
      padding: '12px 16px',
      fontFamily: 'var(--c-font-display)',
      fontSize: 11,
      letterSpacing: '.22em',
      textTransform: 'uppercase',
      borderRadius: 'var(--c-r-sm)',
      opacity: disabled ? 0.45 : 1,
      transition: 'transform var(--c-t-fast) var(--c-ease-out)',
    };
    const byVariant: Record<string, React.CSSProperties> =
      variant === 'solid'
        ? {
            solid: {
              background: 'var(--c-ink)',
              color: 'var(--c-creme)',
              border: 0,
              boxShadow: 'var(--c-shadow-sm)',
            },
          }
        : variant === 'danger'
        ? {
            danger: {
              background: 'transparent',
              color: '#A83232',
              border: '1.5px solid #A83232',
            },
          }
        : variant === 'ghost'
        ? {
            ghost: {
              background: 'transparent',
              color: 'var(--c-ink-muted)',
              border: '1px dashed var(--c-line)',
            },
          }
        : {
            outline: {
              background: 'var(--c-creme)',
              color: 'var(--c-ink)',
              border: '1.5px solid var(--c-ink)',
            },
          };
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{ ...base, ...Object.values(byVariant)[0] }}
      >
        {children}
      </button>
    );
  };

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
        margin: '4px 0',
      }}
    />
  );

  const helpText: React.CSSProperties = {
    fontFamily: 'var(--c-font-body)',
    fontStyle: 'italic',
    fontSize: 13,
    color: 'var(--c-ink-muted)',
    margin: '4px 0 8px',
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none">
          <div
            className="collage-root"
            style={{
              background: 'var(--c-paper)',
              position: 'relative',
              padding: '28px 28px 28px',
              boxShadow: 'var(--c-shadow)',
              border: '1px solid var(--c-line)',
            }}
          >
            <DialogHeader className="text-left space-y-2">
              <Stamp variant="ink" size="sm" rotate={-2}>
                settings
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
                  Inside the cover
                </h2>
              </DialogTitle>
              <DialogDescription asChild>
                <p
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontStyle: 'italic',
                    color: 'var(--c-ink-muted)',
                    margin: 0,
                    fontSize: 14,
                  }}
                >
                  Manage your trip planner settings
                </p>
              </DialogDescription>
            </DialogHeader>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
              {/* Trip Selector (mobile) */}
              <div className="sm:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sectionLabel('current trip')}
                <TripSelector className="w-full justify-between" />
              </div>

              <div className="sm:hidden">{hairline}</div>

              {/* Export Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sectionLabel('export trip')}
                <p style={helpText}>
                  Download your trip data and photos as a ZIP file.
                </p>
                {collageButton({
                  variant: 'outline',
                  onClick: () => setExportOpen(true),
                  disabled: !trip,
                  children: 'Export to ZIP',
                })}
              </div>

              {hairline}

              {/* Change PIN Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sectionLabel('change pin')}

                {pinStep === 'idle' &&
                  collageButton({
                    variant: 'outline',
                    onClick: handleStartPinChange,
                    children: 'Set new emoji PIN',
                  })}

                {pinStep === 'create' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p
                      style={{
                        ...helpText,
                        textAlign: 'center',
                        margin: 0,
                      }}
                    >
                      Choose your new 4-emoji PIN
                    </p>
                    <CollageEmojiPad
                      onSubmit={handleFirstPin}
                      error={pinError}
                      submitLabel="Next"
                    />
                    {collageButton({
                      variant: 'ghost',
                      onClick: handleCancelPinChange,
                      children: 'Cancel',
                    })}
                  </div>
                )}

                {pinStep === 'confirm' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p
                      style={{
                        ...helpText,
                        textAlign: 'center',
                        margin: 0,
                      }}
                    >
                      Confirm your new PIN
                    </p>
                    <CollageEmojiPad
                      onSubmit={handleConfirmPin}
                      loading={updatePin.isPending}
                      error={pinError}
                      submitLabel="Update PIN"
                    />
                    {collageButton({
                      variant: 'ghost',
                      onClick: handleCancelPinChange,
                      children: 'Cancel',
                    })}
                  </div>
                )}
              </div>

              {hairline}

              {/* Danger Zone */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Stamp
                  variant="plain"
                  size="sm"
                  style={{ color: '#A83232', padding: 0 }}
                >
                  danger zone
                </Stamp>
                {collageButton({
                  variant: 'danger',
                  onClick: () => setDeleteConfirmOpen(true),
                  disabled: !trip,
                  children: 'Delete current trip',
                })}
              </div>

              {hairline}

              {/* Logout */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {collageButton({
                  variant: 'outline',
                  onClick: handleLogout,
                  children: 'Sign out',
                })}
                <p
                  style={{
                    ...helpText,
                    textAlign: 'center',
                    margin: '6px 0 0',
                  }}
                >
                  You'll need to enter the PIN again to access the trip planner.
                </p>
              </div>

              <div style={{ marginTop: 6, textAlign: 'center' }}>
                <StickerPill variant="pen" style={{ opacity: 0.75 }}>
                  mk · settings
                </StickerPill>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <div className="collage-root">
            <AlertDialogHeader>
              <AlertDialogTitle asChild>
                <h2
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 22,
                    fontWeight: 500,
                    color: 'var(--c-ink)',
                    margin: 0,
                  }}
                >
                  Delete trip?
                </h2>
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <p
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontStyle: 'italic',
                    color: 'var(--c-ink-muted)',
                    fontSize: 14,
                    margin: '8px 0 0',
                  }}
                >
                  This will permanently delete &ldquo;{trip?.title}&rdquo; and all its data
                  including itinerary, photos, and memories. This action cannot be undone.
                </p>
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
                    Deleting…
                  </>
                ) : (
                  'Delete trip'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
