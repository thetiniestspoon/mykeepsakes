import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const domain = accommodation.url ? getDomainFromUrl(accommodation.url) : null;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-3 transition-colors',
        isDeprioritized && 'opacity-50 bg-muted',
        isDragging && 'shadow-lg ring-2 ring-primary'
      )}
    >
      {!isDeprioritized && (
        <button
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}
      
      <div 
        className={cn(
          "flex-1 min-w-0",
          accommodation.url && "cursor-pointer hover:bg-accent/50 rounded-md -my-1 py-1 -mx-1 px-1 transition-colors"
        )}
        onClick={(e) => {
          if (accommodation.url) {
            e.stopPropagation();
            window.open(accommodation.url, '_blank');
          }
        }}
      >
        <p className={cn('font-medium truncate', isDeprioritized && 'text-muted-foreground')}>
          {accommodation.title}
        </p>
        {domain && (
          <p className="text-xs text-muted-foreground truncate">{domain}</p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Card>
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
    <Card className="flex items-center gap-2 p-3 opacity-50 bg-muted">
      <div className="w-6" /> {/* Spacer for alignment */}
      
      <div 
        className={cn(
          "flex-1 min-w-0",
          accommodation.url && "cursor-pointer hover:bg-accent/50 rounded-md -my-1 py-1 -mx-1 px-1 transition-colors"
        )}
        onClick={(e) => {
          if (accommodation.url) {
            e.stopPropagation();
            window.open(accommodation.url, '_blank');
          }
        }}
      >
        <p className="font-medium truncate text-muted-foreground">
          {accommodation.title}
        </p>
        {domain && (
          <p className="text-xs text-muted-foreground truncate">{domain}</p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Card>
  );
}
