import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Accommodation, AccommodationSelectDetails } from '@/types/accommodation';
import '@/preview/collage/collage.css';
import { Stamp } from '@/preview/collage/ui/Stamp';

/**
 * SelectionDetailsDialog — migrated to Collage direction (Phase 4d, StayDetail inner).
 * Shadcn Dialog keeps its overlay/positioning; DialogContent is neutralized
 * (p-0 border-0 bg-transparent shadow-none) and we wrap the content slot in
 * `<div className="collage-root">` so tokens apply. Same pattern as
 * SettingsDialog.tsx. Form state + onConfirm handler unchanged.
 */

interface SelectionDetailsDialogProps {
  accommodation: Accommodation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (details: AccommodationSelectDetails) => void;
  isPending?: boolean;
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--c-font-display)',
  fontSize: 10,
  letterSpacing: '.22em',
  textTransform: 'uppercase',
  color: 'var(--c-ink-muted)',
  display: 'block',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontFamily: 'var(--c-font-body)',
  fontSize: 14,
  color: 'var(--c-ink)',
  background: 'var(--c-paper)',
  border: '1px solid var(--c-line)',
  borderRadius: 'var(--c-r-sm)',
  padding: '8px 10px',
  outline: 'none',
  transition: 'border-color var(--c-t-fast) var(--c-ease-out)',
};

const dateBtnStyle: React.CSSProperties = {
  appearance: 'none',
  width: '100%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: 8,
  padding: '8px 10px',
  fontFamily: 'var(--c-font-body)',
  fontSize: 14,
  color: 'var(--c-ink)',
  background: 'var(--c-paper)',
  border: '1px solid var(--c-line)',
  borderRadius: 'var(--c-r-sm)',
  cursor: 'pointer',
  textAlign: 'left',
};

const ctaBaseStyle: React.CSSProperties = {
  appearance: 'none',
  padding: '10px 16px',
  fontFamily: 'var(--c-font-display)',
  fontSize: 11,
  letterSpacing: '.22em',
  textTransform: 'uppercase',
  borderRadius: 'var(--c-r-sm)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  transition: 'transform var(--c-t-fast) var(--c-ease-out)',
};

export function SelectionDetailsDialog({
  accommodation,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: SelectionDetailsDialogProps) {
  const [address, setAddress] = useState('');
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [notes, setNotes] = useState('');

  // Reset form when dialog opens with new accommodation
  useEffect(() => {
    if (accommodation && open) {
      setAddress(accommodation.address || '');
      setCheckIn(accommodation.check_in ? new Date(accommodation.check_in) : undefined);
      setCheckOut(accommodation.check_out ? new Date(accommodation.check_out) : undefined);
      setNotes(accommodation.notes || '');
    }
  }, [accommodation, open]);

  const handleConfirm = () => {
    onConfirm({
      address: address.trim(),
      check_in: checkIn?.toISOString(),
      check_out: checkOut?.toISOString(),
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 border-0 bg-transparent shadow-none">
        <div
          className="collage-root"
          style={{
            background: 'var(--c-paper)',
            position: 'relative',
            padding: '24px 24px 24px',
            boxShadow: 'var(--c-shadow)',
            border: '1px solid var(--c-line)',
          }}
        >
          <DialogHeader className="text-left space-y-2">
            <Stamp variant="ink" size="sm" rotate={-2}>
              {accommodation?.is_selected ? 'edit stay' : 'select stay'}
            </Stamp>
            <DialogTitle asChild>
              <h2
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 22,
                  fontWeight: 500,
                  letterSpacing: '-.005em',
                  margin: '8px 0 0',
                  color: 'var(--c-ink)',
                }}
              >
                {accommodation?.is_selected ? 'Edit Accommodation' : 'Select Accommodation'}
              </h2>
            </DialogTitle>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            <div>
              <label htmlFor="title" style={labelStyle}>Accommodation</label>
              <input
                id="title"
                type="text"
                value={accommodation?.title || ''}
                disabled
                style={{
                  ...inputStyle,
                  background: 'rgba(29,29,27,.04)',
                  color: 'var(--c-ink-muted)',
                  cursor: 'not-allowed',
                }}
              />
            </div>

            <div>
              <label htmlFor="address" style={labelStyle}>Address</label>
              <input
                id="address"
                type="text"
                placeholder="Enter the address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--c-pen)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--c-line)')}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <span style={labelStyle}>Check-in</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      style={{
                        ...dateBtnStyle,
                        color: checkIn ? 'var(--c-ink)' : 'var(--c-ink-muted)',
                      }}
                    >
                      <CalendarIcon className="h-4 w-4" />
                      {checkIn ? format(checkIn, 'MMM d') : 'Pick date'}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={checkIn}
                      onSelect={setCheckIn}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <span style={labelStyle}>Check-out</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      style={{
                        ...dateBtnStyle,
                        color: checkOut ? 'var(--c-ink)' : 'var(--c-ink-muted)',
                      }}
                    >
                      <CalendarIcon className="h-4 w-4" />
                      {checkOut ? format(checkOut, 'MMM d') : 'Pick date'}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={checkOut}
                      onSelect={setCheckOut}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <label htmlFor="notes" style={labelStyle}>Notes (optional)</label>
              <textarea
                id="notes"
                placeholder="Any notes about this accommodation..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  minHeight: 72,
                  fontFamily: 'var(--c-font-body)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--c-pen)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--c-line)')}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              marginTop: 20,
              paddingTop: 14,
              borderTop: '1px solid var(--c-line)',
            }}
          >
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              style={{
                ...ctaBaseStyle,
                background: 'var(--c-creme)',
                color: 'var(--c-ink)',
                border: '1.5px solid var(--c-ink)',
              }}
            >
              Cancel
            </button>
            <Button
              onClick={handleConfirm}
              disabled={isPending}
              asChild={false}
              style={{
                ...ctaBaseStyle,
                background: 'var(--c-ink)',
                color: 'var(--c-creme)',
                border: 0,
                boxShadow: 'var(--c-shadow-sm)',
                opacity: isPending ? 0.6 : 1,
                cursor: isPending ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
