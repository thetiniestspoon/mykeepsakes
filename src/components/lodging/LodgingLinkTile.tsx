import { useState } from 'react';
import {
  MoreHorizontal,
  EyeOff,
  Eye,
  Trash2,
  ExternalLink,
  StickyNote,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  useDeprioritizeAccommodation,
  useUnhideAccommodation,
  useDeleteAccommodation,
} from '@/hooks/use-accommodations';
import { LodgingIframeModal } from './LodgingIframeModal';
import { Tape } from '@/preview/collage/ui/Tape';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import type { Accommodation } from '@/types/accommodation';
import { toast } from 'sonner';
import '@/preview/collage/collage.css';

interface LodgingLinkTileProps {
  accommodation: Accommodation;
  /** Rotation index for the paper tile — wraps a ±1.5° cycle. */
  index?: number;
}

function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'Unknown site';
  }
}

// ±1.5° cycle modeled on the ActivityDetail photo-tape pattern.
// 5-step cycle keeps the "I was placed by hand" feel without looking
// mechanical. prefers-reduced-motion zeroes hover transforms via collage.css.
const ROTATION_CYCLE = [-1.5, 0.8, -0.6, 1.5, -1.1];

/**
 * Collage lodging link tile (Phase 4 #9).
 * Small paper card with a tape accent, pen-blue domain preview, and
 * Caveat nickname margin note. Click opens the iframe preview modal;
 * the kebab menu preserves hide/restore/delete/open mutations.
 * Presentation only — hooks/state unchanged.
 */
export function LodgingLinkTile({ accommodation, index = 0 }: LodgingLinkTileProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const deprioritizeMutation = useDeprioritizeAccommodation();
  const unhideMutation = useUnhideAccommodation();
  const deleteMutation = useDeleteAccommodation();

  const domain = accommodation.url ? getDomainFromUrl(accommodation.url) : null;
  const displayLabel = accommodation.title || domain || 'Untitled listing';

  const rot = ROTATION_CYCLE[index % ROTATION_CYCLE.length];

  const handleToggleDeprioritize = () => {
    if (accommodation.is_deprioritized) {
      unhideMutation.mutate(accommodation.id, {
        onSuccess: () => toast.success('Restored'),
        onError: () => toast.error('Failed to restore'),
      });
    } else {
      deprioritizeMutation.mutate(accommodation.id, {
        onSuccess: () => toast.success('Hidden'),
        onError: () => toast.error('Failed to hide'),
      });
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate(accommodation.id, {
      onSuccess: () => toast.success('Deleted'),
      onError: () => toast.error('Failed to delete'),
    });
    setDeleteDialogOpen(false);
  };

  const handleOpenTile = () => {
    if (accommodation.url) setModalOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!accommodation.url) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setModalOpen(true);
    }
  };

  return (
    <>
      <div
        role={accommodation.url ? 'button' : undefined}
        tabIndex={accommodation.url ? 0 : -1}
        aria-label={accommodation.url ? `Open preview of ${displayLabel}` : displayLabel}
        onClick={handleOpenTile}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        style={{
          position: 'relative',
          background: 'var(--c-paper)',
          boxShadow: hovered ? 'var(--c-shadow)' : 'var(--c-shadow-sm)',
          padding: '14px 14px 14px 16px',
          border: '1px solid var(--c-line)',
          borderRadius: 'var(--c-r-sm)',
          cursor: accommodation.url ? 'pointer' : 'default',
          transform: hovered
            ? 'translate(-2px, -2px) rotate(0deg)'
            : `rotate(${rot}deg)`,
          transition:
            'transform var(--c-t-fast) var(--c-ease-out), box-shadow var(--c-t-fast) var(--c-ease-out)',
          opacity: accommodation.is_deprioritized ? 0.62 : 1,
        }}
      >
        <Tape
          position="top-left"
          rotate={index % 2 === 0 ? -8 : 6}
          width={64}
          opacity={0.72}
          style={{ top: -8, left: 10 }}
        />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontWeight: 500,
                  fontSize: 16,
                  color: 'var(--c-ink)',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {displayLabel}
              </p>
              {accommodation.is_deprioritized && (
                <MarginNote rotate={-2} size={18} color="ink">
                  set aside
                </MarginNote>
              )}
            </div>

            {domain && (
              <p
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 13,
                  color: 'var(--c-pen)',
                  margin: '4px 0 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <ExternalLink
                  aria-hidden
                  className="w-3 h-3"
                  style={{ flexShrink: 0, strokeWidth: 2 }}
                />
                <span
                  style={{
                    textDecoration: 'underline',
                    textDecorationThickness: 1,
                    textUnderlineOffset: 3,
                  }}
                >
                  {domain}
                </span>
              </p>
            )}

            {accommodation.notes && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 6,
                  fontFamily: 'var(--c-font-body)',
                  fontStyle: 'italic',
                  fontSize: 12,
                  color: 'var(--c-ink-muted)',
                  overflow: 'hidden',
                }}
              >
                <StickyNote
                  aria-hidden
                  className="w-3 h-3"
                  style={{ flexShrink: 0 }}
                />
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {accommodation.notes}
                </span>
              </div>
            )}
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                aria-label="Listing actions"
                style={{
                  flexShrink: 0,
                  appearance: 'none',
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  color: 'var(--c-ink-muted)',
                  padding: 6,
                  borderRadius: 'var(--c-r-sm)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {accommodation.url && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(accommodation.url!, '_blank');
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in new tab
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleDeprioritize();
                }}
              >
                {accommodation.is_deprioritized ? (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Restore
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hide
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Iframe Modal */}
      {accommodation.url && (
        <LodgingIframeModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          url={accommodation.url}
          label={displayLabel}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
                  Delete listing?
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
                  Are you sure you want to delete &ldquo;{displayLabel}&rdquo;? This
                  action cannot be undone.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
