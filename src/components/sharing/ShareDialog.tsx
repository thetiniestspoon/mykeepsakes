import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Share2, Copy, Trash2, Link, Calendar, Check, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useTripShareLinks, useCreateShareLink, useDeleteShareLink, getShareUrl } from '@/hooks/use-sharing';
import { useActiveTrip } from '@/hooks/use-trip';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ open, onOpenChange }: ShareDialogProps) {
  const [useExpiry, setUseExpiry] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const { data: trip } = useActiveTrip();
  const { data: shareLinks = [], isLoading } = useTripShareLinks(trip?.id);
  const createLink = useCreateShareLink();
  const deleteLink = useDeleteShareLink();
  
  const handleCreateLink = async () => {
    if (!trip) return;
    
    const expiresAt = useExpiry 
      ? addDays(new Date(), expiryDays).toISOString() 
      : undefined;
    
    createLink.mutate({ tripId: trip.id, expiresAt });
  };
  
  const handleCopyLink = async (token: string, linkId: string) => {
    const url = getShareUrl(token);
    await navigator.clipboard.writeText(url);
    setCopiedId(linkId);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  const handleDeleteLink = (linkId: string) => {
    deleteLink.mutate(linkId);
  };
  
  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Trip
          </DialogTitle>
          <DialogDescription>
            Create read-only links to share your trip itinerary with others.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Create new link section */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <Label htmlFor="expiry-toggle" className="text-sm font-medium">
                Set expiration date
              </Label>
              <Switch
                id="expiry-toggle"
                checked={useExpiry}
                onCheckedChange={setUseExpiry}
              />
            </div>
            
            {useExpiry && (
              <div className="space-y-2">
                <Label htmlFor="expiry-days" className="text-xs text-muted-foreground">
                  Expires in
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="expiry-days"
                    type="number"
                    min={1}
                    max={365}
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(parseInt(e.target.value) || 7)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleCreateLink} 
              disabled={createLink.isPending || !trip}
              className="w-full"
            >
              {createLink.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Link className="w-4 h-4 mr-2" />
              )}
              Create Share Link
            </Button>
          </div>
          
          {/* Existing links */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Active Links</Label>
            
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : shareLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No share links yet. Create one above!
              </p>
            ) : (
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-2">
                  {shareLinks.map((link) => {
                    const expired = isExpired(link.expires_at);
                    return (
                      <div 
                        key={link.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          expired ? "bg-muted/50 opacity-60" : "bg-background"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs font-mono truncate">
                              ...{link.token.slice(-8)}
                            </span>
                            {expired ? (
                              <Badge variant="destructive" className="text-xs">
                                Expired
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Read-only
                              </Badge>
                            )}
                          </div>
                          {link.expires_at && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {expired ? 'Expired' : 'Expires'} {format(new Date(link.expires_at), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          {!expired && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleCopyLink(link.token, link.id)}
                              >
                                {copiedId === link.id ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => window.open(getShareUrl(link.token), '_blank')}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteLink(link.id)}
                            disabled={deleteLink.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
