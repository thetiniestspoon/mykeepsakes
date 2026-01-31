import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Home, Archive, CheckCircle2, Loader2 } from 'lucide-react';
import { useLodgingOptions, useSelectedLodging } from '@/hooks/use-lodging';
import { LodgingLinkTile } from '@/components/lodging/LodgingLinkTile';
import { AddLodgingLinkDialog } from '@/components/lodging/AddLodgingLinkDialog';

export function LodgingTab() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const { data: lodgingOptions, isLoading, error } = useLodgingOptions(showArchived);
  const { data: selectedLodging } = useSelectedLodging();

  const activeOptions = lodgingOptions?.filter(l => !l.is_archived) || [];
  const archivedOptions = lodgingOptions?.filter(l => l.is_archived) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-4 mt-4">
        <CardContent className="py-6 text-center text-destructive">
          Failed to load lodging options. Please try again.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="text-center py-4">
        <h2 className="font-display text-2xl text-foreground">Lodging Options</h2>
        <p className="text-muted-foreground">Save and compare rental listings</p>
      </div>

      {/* Selected Lodging Banner */}
      {selectedLodging && (
        <Card className="mx-4 bg-primary/10 border-primary">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-primary font-medium">Booked Accommodation</p>
                <p className="font-semibold truncate">{selectedLodging.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Button */}
      <div className="px-4">
        <Button onClick={() => setAddDialogOpen(true)} className="w-full gap-2">
          <Plus className="w-4 h-4" />
          Add Listing Link
        </Button>
      </div>

      {/* Tabs for Active/Archived */}
      <Tabs defaultValue="active" className="px-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="gap-2">
            <Home className="w-4 h-4" />
            Active
            <Badge variant="secondary" className="ml-1">{activeOptions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="archived" className="gap-2" onClick={() => setShowArchived(true)}>
            <Archive className="w-4 h-4" />
            Archived
            <Badge variant="secondary" className="ml-1">{archivedOptions.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-3">
          {activeOptions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Home className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-semibold mb-1">No Listings Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add links to rental listings to compare and vote on options.
                </p>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Listing
                </Button>
              </CardContent>
            </Card>
          ) : (
            activeOptions.map((lodging) => (
              <LodgingLinkTile key={lodging.id} lodging={lodging} />
            ))
          )}
        </TabsContent>

        <TabsContent value="archived" className="mt-4 space-y-3">
          {archivedOptions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Archive className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No archived listings. Archived listings will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            archivedOptions.map((lodging) => (
              <LodgingLinkTile key={lodging.id} lodging={lodging} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Tip Card */}
      <Card className="shadow-warm mx-4 bg-beach-sand/30">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground text-center">
            💡 <strong>Tip:</strong> Use thumbs up/down to vote on listings. Tap a tile to preview the listing!
          </p>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <AddLodgingLinkDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </div>
  );
}
