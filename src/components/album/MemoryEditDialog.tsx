import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateMemory } from '@/hooks/use-memories';
import { useTripDays } from '@/hooks/use-trip';
import { useLocations } from '@/hooks/use-locations';
import { useItineraryItems } from '@/hooks/use-itinerary';
import type { Memory } from '@/types/trip';

interface MemoryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memory: Memory | null;
}

const NONE = '__none__';

export function MemoryEditDialog({ open, onOpenChange, memory }: MemoryEditDialogProps) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [dayId, setDayId] = useState<string>(NONE);
  const [locationId, setLocationId] = useState<string>(NONE);
  const [itineraryItemId, setItineraryItemId] = useState<string>(NONE);

  const updateMemory = useUpdateMemory();
  const { data: days = [] } = useTripDays(memory?.trip_id);
  const { data: locations = [] } = useLocations(memory?.trip_id);
  const { data: items = [] } = useItineraryItems(memory?.trip_id);

  useEffect(() => {
    if (memory) {
      setTitle(memory.title || '');
      setNote(memory.note || '');
      setDayId(memory.day_id || NONE);
      setLocationId(memory.location_id || NONE);
      setItineraryItemId(memory.itinerary_item_id || NONE);
    }
  }, [memory, open]);

  // Filter events by selected day so the picker isn't a wall of items.
  // If no day is selected, show all trip items.
  const itemsForDay =
    dayId === NONE ? items : items.filter((it) => it.day_id === dayId);

  const handleSave = async () => {
    if (!memory) return;

    await updateMemory.mutateAsync({
      id: memory.id,
      title: title || null,
      note: note || null,
      day_id: dayId === NONE ? null : dayId,
      location_id: locationId === NONE ? null : locationId,
      itinerary_item_id: itineraryItemId === NONE ? null : itineraryItemId,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Memory</DialogTitle>
          <DialogDescription>
            Update the title, note, and tags (day, location, event). Tags make this memory show up in the right places.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="memory-title">Title</Label>
            <Input
              id="memory-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give this memory a title..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="memory-note">Note</Label>
            <Textarea
              id="memory-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this memory..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="memory-day">Day</Label>
              <Select
                value={dayId}
                onValueChange={(v) => {
                  setDayId(v);
                  // If day changed and current event doesn't belong to it, clear it.
                  if (
                    v !== NONE &&
                    itineraryItemId !== NONE &&
                    !items.find((it) => it.id === itineraryItemId && it.day_id === v)
                  ) {
                    setItineraryItemId(NONE);
                  }
                }}
              >
                <SelectTrigger id="memory-day">
                  <SelectValue placeholder="No day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No day</SelectItem>
                  {days.map((day, index) => (
                    <SelectItem key={day.id} value={day.id}>
                      Day {index + 1}:{' '}
                      {day.title ||
                        new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memory-location">Location</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger id="memory-location">
                  <SelectValue placeholder="No location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No location</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="memory-item">Event</Label>
            <Select value={itineraryItemId} onValueChange={setItineraryItemId}>
              <SelectTrigger id="memory-item">
                <SelectValue placeholder="No event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No event</SelectItem>
                {itemsForDay.map((it) => (
                  <SelectItem key={it.id} value={it.id}>
                    {it.title}
                    {it.start_time ? ` · ${it.start_time.slice(0, 5)}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {dayId !== NONE && itemsForDay.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No events on this day yet.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMemory.isPending}>
            {updateMemory.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
