import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal, 
  EyeOff, 
  Eye,
  Trash2, 
  ExternalLink,
  Home,
  StickyNote
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
import { useDeprioritizeAccommodation, useUnhideAccommodation, useDeleteAccommodation } from '@/hooks/use-accommodations';
import { LodgingIframeModal } from './LodgingIframeModal';
import type { Accommodation } from '@/types/accommodation';
import { toast } from 'sonner';

interface LodgingLinkTileProps {
  accommodation: Accommodation;
}

function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'Unknown site';
  }
}

export function LodgingLinkTile({ accommodation }: LodgingLinkTileProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const deprioritizeMutation = useDeprioritizeAccommodation();
  const unhideMutation = useUnhideAccommodation();
  const deleteMutation = useDeleteAccommodation();

  const domain = accommodation.url ? getDomainFromUrl(accommodation.url) : 'No URL';
  const displayLabel = accommodation.title || domain;

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

  return (
    <>
      <Card 
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => accommodation.url && setModalOpen(true)}
      >
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Home className="w-5 h-5 text-primary" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{displayLabel}</p>
              <p className="text-sm text-muted-foreground truncate">{domain}</p>
              {accommodation.notes && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <StickyNote className="w-3 h-3" />
                  <span className="truncate">{accommodation.notes}</span>
                </div>
              )}
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {accommodation.url && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    window.open(accommodation.url!, '_blank');
                  }}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  handleToggleDeprioritize();
                }}>
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
        </CardContent>
      </Card>

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
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{displayLabel}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
