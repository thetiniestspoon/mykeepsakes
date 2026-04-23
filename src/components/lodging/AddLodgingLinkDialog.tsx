import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useAddAccommodation } from '@/hooks/use-accommodations';
import { toast } from 'sonner';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import '@/preview/collage/collage.css';

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

/**
 * Add-link dialog migrated to Collage (Phase 4 #9).
 * Preserves URL validation + addMutation. Shadcn Dialog keeps its
 * overlay/positioning; we wrap the content with <div className="collage-root">
 * per the SettingsDialog pattern so tokens apply inside without leaking out.
 */
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
    const title =
      label.trim() || (finalUrl ? getDomainFromUrl(finalUrl) : '') || 'Untitled Listing';

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
      },
    );
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    appearance: 'none',
    padding: '10px 12px',
    fontFamily: 'var(--c-font-body)',
    fontSize: 15,
    color: 'var(--c-ink)',
    background: 'var(--c-creme)',
    border: '1.5px solid var(--c-ink)',
    borderRadius: 'var(--c-r-sm)',
    outline: 'none',
    transition: 'border-color var(--c-t-fast) var(--c-ease-out)',
  };

  const helpText: React.CSSProperties = {
    fontFamily: 'var(--c-font-body)',
    fontStyle: 'italic',
    fontSize: 12,
    color: 'var(--c-ink-muted)',
    margin: '4px 0 0',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--c-font-display)',
    fontSize: 10,
    letterSpacing: '.22em',
    textTransform: 'uppercase',
    color: 'var(--c-ink-muted)',
    display: 'block',
    marginBottom: 6,
  };

  const disabled = addMutation.isPending || !label.trim();

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : handleClose())}>
      <DialogContent className="sm:max-w-md p-0 border-0 bg-transparent shadow-none">
        <div
          className="collage-root"
          style={{
            background: 'var(--c-paper)',
            position: 'relative',
            padding: '28px 28px 24px',
            boxShadow: 'var(--c-shadow)',
            border: '1px solid var(--c-line)',
          }}
        >
          <DialogHeader className="text-left space-y-2">
            <Stamp variant="ink" size="sm" rotate={-2}>
              new link
            </Stamp>
            <DialogTitle asChild>
              <h2
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 22,
                  fontWeight: 500,
                  letterSpacing: '-.005em',
                  margin: '10px 0 0',
                  color: 'var(--c-ink)',
                }}
              >
                Pin a room to the board
              </h2>
            </DialogTitle>
            <DialogDescription asChild>
              <p
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontStyle: 'italic',
                  color: 'var(--c-ink-muted)',
                  margin: '4px 0 0',
                  fontSize: 14,
                }}
              >
                Save a listing link so you can come back to it.
              </p>
            </DialogDescription>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 20 }}>
            <div>
              <label htmlFor="lodging-label" style={labelStyle}>
                title *
              </label>
              <input
                id="lodging-label"
                type="text"
                placeholder="e.g., Beach House Option"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                style={inputStyle}
              />
              <p style={helpText}>A name for this listing.</p>
            </div>

            <div>
              <label htmlFor="lodging-url" style={labelStyle}>
                listing url <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <input
                id="lodging-url"
                type="url"
                placeholder="https://airbnb.com/rooms/..."
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: urlError ? 'var(--c-danger)' : 'var(--c-ink)',
                }}
              />
              {urlError && (
                <p
                  style={{
                    ...helpText,
                    fontStyle: 'normal',
                    color: 'var(--c-danger)',
                  }}
                >
                  {urlError}
                </p>
              )}
            </div>

            <MarginNote rotate={-2} size={18} style={{ alignSelf: 'flex-start' }}>
              paste from anywhere — airbnb, vrbo, hotels…
            </MarginNote>

            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
                marginTop: 6,
              }}
            >
              <button
                type="button"
                onClick={handleClose}
                style={{
                  appearance: 'none',
                  cursor: 'pointer',
                  padding: '10px 16px',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 11,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  background: 'transparent',
                  color: 'var(--c-ink-muted)',
                  border: '1px dashed var(--c-line)',
                  borderRadius: 'var(--c-r-sm)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={disabled}
                style={{
                  appearance: 'none',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  padding: '10px 18px',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 11,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  background: 'var(--c-ink)',
                  color: 'var(--c-creme)',
                  border: 0,
                  borderRadius: 'var(--c-r-sm)',
                  opacity: disabled ? 0.5 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: 'var(--c-shadow-sm)',
                }}
              >
                {addMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Add link
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
