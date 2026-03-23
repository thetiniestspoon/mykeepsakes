import { useState } from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConnections } from '@/hooks/use-connections';
import { ConnectionCard } from '@/components/connections/ConnectionCard';
import { ConnectionCaptureSheet } from '@/components/connections/ConnectionCaptureSheet';

interface PeopleTabProps {
  tripId: string;
}

export function PeopleTab({ tripId }: PeopleTabProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: connections, isLoading } = useConnections(tripId);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">People</h2>
        <Button size="sm" onClick={() => setSheetOpen(true)}>
          + Add
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : connections && connections.length > 0 ? (
        <div className="flex flex-col gap-3">
          {connections.map((connection) => (
            <ConnectionCard key={connection.id} connection={connection} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Users className="h-10 w-10 opacity-40" />
          <p className="text-sm text-center">
            No connections yet. Tap &ldquo;+ Add&rdquo; to capture someone you meet.
          </p>
        </div>
      )}

      <ConnectionCaptureSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        tripId={tripId}
      />
    </div>
  );
}
