import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MoreHorizontal, 
  Archive, 
  ArchiveRestore,
  Trash2, 
  ExternalLink,
  Home,
  StickyNote
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { LodgingOption, useVoteLodging, useArchiveLodging, useDeleteLodging } from '@/hooks/use-lodging';
import { LodgingIframeModal } from './LodgingIframeModal';

interface LodgingLinkTileProps {
  lodging: LodgingOption;
}

function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'Unknown site';
  }
}

export function LodgingLinkTile({ lodging }: LodgingLinkTileProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const voteMutation = useVoteLodging();
  const archiveMutation = useArchiveLodging();
  const deleteMutation = useDeleteLodging();

  const domain = lodging.url ? getDomainFromUrl(lodging.url) : 'No URL';
  const voteScore = (lodging.votes_up || 0) - (lodging.votes_down || 0);
  const displayLabel = lodging.name || domain;

  const handleVote = (e: React.MouseEvent, voteType: 'up' | 'down') => {
    e.stopPropagation();
    voteMutation.mutate({ id: lodging.id, voteType });
  };

  const handleArchive = () => {
    archiveMutation.mutate({ id: lodging.id, isArchived: !lodging.is_archived });
  };

  const handleDelete = () => {
    deleteMutation.mutate(lodging.id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Card 
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setModalOpen(true)}
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
              {lodging.notes && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <StickyNote className="w-3 h-3" />
                  <span className="truncate">{lodging.notes}</span>
                </div>
              )}
            </div>

            {/* Voting */}
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => handleVote(e, 'up')}
                disabled={voteMutation.isPending}
              >
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <span className={`text-sm font-medium ${voteScore > 0 ? 'text-green-600' : voteScore < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                {voteScore > 0 ? `+${voteScore}` : voteScore}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => handleVote(e, 'down')}
                disabled={voteMutation.isPending}
              >
                <ThumbsDown className="w-4 h-4" />
              </Button>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {lodging.url && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    window.open(lodging.url!, '_blank');
                  }}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  handleArchive();
                }}>
                  {lodging.is_archived ? (
                    <>
                      <ArchiveRestore className="w-4 h-4 mr-2" />
                      Restore
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </>
                  )}
                </DropdownMenuItem>
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
      <LodgingIframeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        url={lodging.url || ''}
        label={displayLabel}
      />

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
