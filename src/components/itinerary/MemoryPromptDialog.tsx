import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Camera, CheckCircle2 } from 'lucide-react';
import { Stamp } from '@/preview/collage/ui/Stamp';
import '@/preview/collage/collage.css';

interface MemoryPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityTitle: string;
  activityId: string;
  dayId: string;
  onAddPhoto: () => void;
}

const SESSION_STORAGE_KEY = 'memory-prompt-dismissed';

/**
 * MemoryPromptDialog — migrated to Collage direction (Phase 4 #2 support).
 * Dialog content wrapped in `collage-root` paper surface. "Did anything
 * memorable happen?" as a Caveat script prompt (decorative) + IBM Plex Serif
 * accessible-copy. Outline Stamp "add photo" CTA. Session-storage dismiss
 * logic unchanged.
 */
export function MemoryPromptDialog({
  open,
  onOpenChange,
  activityTitle,
  activityId: _activityId,
  dayId: _dayId,
  onAddPhoto,
}: MemoryPromptDialogProps) {
  void _activityId;
  void _dayId;

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
      <DialogContent className="sm:max-w-md p-0 border-0 bg-transparent shadow-none">
        <div
          className="collage-root"
          style={{
            background: 'var(--c-paper)',
            position: 'relative',
            padding: '32px 28px 28px',
            boxShadow: 'var(--c-shadow)',
            border: '1px solid var(--c-line)',
          }}
        >
          <DialogHeader className="text-left space-y-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--c-r-sm)',
                  background: 'rgba(60, 122, 78, 0.12)',
                  color: 'var(--c-success)',
                }}
                aria-hidden
              >
                <CheckCircle2 style={{ width: 18, height: 18 }} />
              </span>
              <Stamp variant="pen" size="sm" rotate={-2}>
                kept
              </Stamp>
            </div>

            <DialogTitle asChild>
              <h2
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 22,
                  fontWeight: 500,
                  letterSpacing: '-.005em',
                  margin: '6px 0 0',
                  color: 'var(--c-ink)',
                  lineHeight: 1.2,
                }}
              >
                {activityTitle}
              </h2>
            </DialogTitle>

            {/* Accessible description (IBM Plex Serif) */}
            <DialogDescription asChild>
              <p
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: 'var(--c-ink-muted)',
                  margin: 0,
                }}
              >
                Capture a memory from this activity before moving on?
              </p>
            </DialogDescription>

            {/* Caveat script accent (decorative, aria-hidden) */}
            <p
              aria-hidden
              style={{
                fontFamily: 'var(--c-font-script)',
                fontWeight: 600,
                fontSize: 22,
                color: 'var(--c-pen)',
                margin: '8px 0 0',
                transform: 'rotate(-1deg)',
                transformOrigin: 'left center',
                display: 'inline-block',
              }}
            >
              did anything memorable happen?
            </p>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              onClick={handleAddPhoto}
              className="mk-mem-cta"
              style={{
                appearance: 'none',
                width: '100%',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '14px 18px',
                background: 'transparent',
                color: 'var(--c-pen)',
                border: '1.5px dashed var(--c-pen)',
                borderRadius: 'var(--c-r-sm)',
                fontFamily: 'var(--c-font-display)',
                fontSize: 11,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                transition: 'transform var(--c-t-fast) var(--c-ease-out), background var(--c-t-fast) var(--c-ease-out)',
              }}
            >
              <Camera style={{ width: 16, height: 16 }} aria-hidden />
              <span>add photo</span>
            </button>

            <button
              type="button"
              onClick={handleSkip}
              style={{
                appearance: 'none',
                width: '100%',
                cursor: 'pointer',
                padding: '12px 18px',
                background: 'transparent',
                color: 'var(--c-ink-muted)',
                border: '1px dashed var(--c-line)',
                borderRadius: 'var(--c-r-sm)',
                fontFamily: 'var(--c-font-display)',
                fontSize: 10,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
              }}
            >
              skip for now
            </button>

            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: 'center',
                cursor: 'pointer',
                marginTop: 4,
                fontFamily: 'var(--c-font-body)',
                fontSize: 13,
                color: 'var(--c-ink-muted)',
                fontStyle: 'italic',
              }}
            >
              <Checkbox
                checked={dontAskAgain}
                onCheckedChange={(checked) => setDontAskAgain(checked === true)}
              />
              <span>Don't ask again today</span>
            </label>
          </div>

          <style>{`
            .mk-mem-cta:hover {
              background: rgba(31, 60, 198, 0.06);
              transform: translate(-1px, -1px);
            }
            .mk-mem-cta:focus-visible {
              outline: 2px solid var(--c-pen);
              outline-offset: 3px;
            }
            @media (prefers-reduced-motion: reduce) {
              .mk-mem-cta:hover { transform: none; }
            }
          `}</style>
        </div>
      </DialogContent>
    </Dialog>
  );
}
