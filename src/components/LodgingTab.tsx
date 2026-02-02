import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Home, Archive, CheckCircle2, Loader2 } from 'lucide-react';
import { useAccommodations, useSelectedAccommodation } from '@/hooks/use-accommodations';
import { LodgingLinkTile } from '@/components/lodging/LodgingLinkTile';
import { AddLodgingLinkDialog } from '@/components/lodging/AddLodgingLinkDialog';

export function LodgingTab() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const { data: accommodations, isLoading, error } = useAccommodations();
  const { data: selectedAccommodation } = useSelectedAccommodation();

  const activeOptions = accommodations?.filter(a => !a.is_deprioritized && !a.is_selected) || [];
  const archivedOptions = accommodations?.filter(a => a.is_deprioritized) || [];

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
      {selectedAccommodation && (
        <Card className="mx-4 bg-primary/10 border-primary">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-primary font-medium">Booked Accommodation</p>
                <p className="font-semibold truncate">{selectedAccommodation.title}</p>
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
            activeOptions.map((accommodation) => (
              <LodgingLinkTile key={accommodation.id} accommodation={accommodation} />
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
            archivedOptions.map((accommodation) => (
              <LodgingLinkTile key={accommodation.id} accommodation={accommodation} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Tip Card */}
      <Card className="shadow-warm mx-4 bg-beach-sand/30">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground text-center">
            💡 <strong>Tip:</strong> Drag accommodations to the drop zone in the Stay tab to select them!
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
