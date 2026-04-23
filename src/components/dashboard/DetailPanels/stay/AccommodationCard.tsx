import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GripVertical, MoreVertical, ExternalLink, Pencil, EyeOff, Eye, Trash2 } from 'lucide-react';
import type { Accommodation } from '@/types/accommodation';
import '@/preview/collage/collage.css';

/**
 * AccommodationCard — migrated to Collage direction (Phase 4d, StayDetail inner).
 * Parent wraps in `.collage-root`; tokens cascade. Sortable hooks + dropdown
 * menu logic unchanged. Shadcn Card swapped for paper div with ink hairline
 * border + sharp corners; active/dragging state = pen-blue border; deprioritized
 * = muted opacity.
 */

interface AccommodationCardProps {
  accommodation: Accommodation;
  onEdit: () => void;
  onDeprioritize?: () => void;
  onUnhide?: () => void;
  onDelete: () => void;
  isDeprioritized?: boolean;
  isDragging?: boolean;
}

function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return '';
  }
}

const cardBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: 12,
  background: 'var(--c-paper)',
  border: '1px solid var(--c-line)',
  borderRadius: 'var(--c-r-sm)',
  boxShadow: 'var(--c-shadow-sm)',
  transition: 'border-color var(--c-t-fast) var(--c-ease-out), box-shadow var(--c-t-fast) var(--c-ease-out)',
};

const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--c-font-body)',
  fontWeight: 500,
  fontSize: 15,
  color: 'var(--c-ink)',
  margin: 0,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const domainStyle: React.CSSProperties = {
  fontFamily: 'var(--c-font-body)',
  fontSize: 12,
  color: 'var(--c-ink-muted)',
  margin: '2px 0 0',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

export function AccommodationCard({
  accommodation,
  onEdit,
  onDeprioritize,
  onUnhide,
  onDelete,
  isDeprioritized = false,
  isDragging = false,
}: AccommodationCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: accommodation.id, disabled: isDeprioritized });

  const sortStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const domain = accommodation.url ? getDomainFromUrl(accommodation.url) : null;

  const mergedStyle: React.CSSProperties = {
    ...cardBase,
    ...sortStyle,
    ...(isDeprioritized ? { opacity: 0.5, background: 'rgba(29,29,27,.04)' } : null),
    ...(isDragging
      ? {
          borderColor: 'var(--c-pen)',
          boxShadow: 'var(--c-shadow)',
        }
      : null),
  };

  return (
    <div ref={setNodeRef} style={mergedStyle}>
      {!isDeprioritized && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="touch-none"
          style={{
            cursor: 'grab',
            background: 'transparent',
            border: 0,
            padding: 4,
            marginLeft: -4,
            color: 'var(--c-ink-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}

      <div
        style={{
          flex: 1,
          minWidth: 0,
          cursor: accommodation.url ? 'pointer' : 'default',
          padding: accommodation.url ? '2px 4px' : 0,
          margin: accommodation.url ? '-2px -4px' : 0,
          borderRadius: 'var(--c-r-sm)',
          transition: 'background-color var(--c-t-fast) var(--c-ease-out)',
        }}
        onClick={(e) => {
          if (accommodation.url) {
            e.stopPropagation();
            window.open(accommodation.url, '_blank');
          }
        }}
      >
        <p
          style={{
            ...titleStyle,
            ...(isDeprioritized ? { color: 'var(--c-ink-muted)' } : null),
          }}
        >
          {accommodation.title}
        </p>
        {domain && <p style={domainStyle}>{domain}</p>}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            style={{ color: 'var(--c-ink-muted)' }}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {accommodation.url && (
            <DropdownMenuItem onClick={() => window.open(accommodation.url!, '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Link
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>

          {isDeprioritized ? (
            <DropdownMenuItem onClick={onUnhide}>
              <Eye className="w-4 h-4 mr-2" />
              Unhide
            </DropdownMenuItem>
          ) : onDeprioritize && (
            <DropdownMenuItem onClick={onDeprioritize}>
              <EyeOff className="w-4 h-4 mr-2" />
              Hide
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            style={{ color: 'var(--c-danger, #A83232)' }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Non-sortable version for deprioritized items
export function StaticAccommodationCard({
  accommodation,
  onUnhide,
  onDelete,
}: {
  accommodation: Accommodation;
  onUnhide: () => void;
  onDelete: () => void;
}) {
  const domain = accommodation.url ? getDomainFromUrl(accommodation.url) : null;

  return (
    <div
      style={{
        ...cardBase,
        opacity: 0.5,
        background: 'rgba(29,29,27,.04)',
      }}
    >
      <div style={{ width: 24 }} /> {/* Spacer for alignment */}

      <div
        style={{
          flex: 1,
          minWidth: 0,
          cursor: accommodation.url ? 'pointer' : 'default',
          padding: accommodation.url ? '2px 4px' : 0,
          margin: accommodation.url ? '-2px -4px' : 0,
          borderRadius: 'var(--c-r-sm)',
        }}
        onClick={(e) => {
          if (accommodation.url) {
            e.stopPropagation();
            window.open(accommodation.url, '_blank');
          }
        }}
      >
        <p style={{ ...titleStyle, color: 'var(--c-ink-muted)' }}>
          {accommodation.title}
        </p>
        {domain && <p style={domainStyle}>{domain}</p>}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            style={{ color: 'var(--c-ink-muted)' }}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {accommodation.url && (
            <DropdownMenuItem onClick={() => window.open(accommodation.url!, '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Link
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onUnhide}>
            <Eye className="w-4 h-4 mr-2" />
            Unhide
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            style={{ color: 'var(--c-danger, #A83232)' }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
