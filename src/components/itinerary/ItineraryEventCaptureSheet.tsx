import { useState, useEffect, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateItem } from '@/hooks/use-itinerary';
import type { ItemCategory } from '@/types/trip';
import type { ItineraryDay } from '@/types/trip';

const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: 'activity', label: 'Activity' },
  { value: 'dining', label: 'Dining' },
  { value: 'beach', label: 'Beach' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'transport', label: 'Transport' },
  { value: 'event', label: 'Event' },
];

interface ItineraryEventCaptureSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  days: ItineraryDay[];
  currentDayId?: string;
}

export function ItineraryEventCaptureSheet({
  open,
  onOpenChange,
  tripId,
  days,
  currentDayId,
}: ItineraryEventCaptureSheetProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory>('event');
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const titleRef = useRef<HTMLInputElement>(null);
  const createItem = useCreateItem();

  useEffect(() => {
    if (open) {
      setSelectedDayId(currentDayId || days[0]?.id || '');
      setTimeout(() => titleRef.current?.focus(), 100);
    } else {
      setTitle('');
      setCategory('event');
    }
  }, [open, currentDayId, days]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedDayId) return;

    await createItem.mutateAsync({
      trip_id: tripId,
      day_id: selectedDayId,
      title: title.trim(),
      description: null,
      start_time: null,
      end_time: null,
      category,
      item_type: 'activity',
      location_id: null,
      source: 'manual',
      external_ref: null,
      sort_index: 999,
      status: 'planned',
      completed_at: null,
      link: null,
      link_label: null,
      phone: null,
      notes: null,
    });

    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[70vh]">
        <SheetHeader>
          <SheetTitle>Add Event</SheetTitle>
          <SheetDescription>
            Add an event to your itinerary
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="event-title">What's the event?</Label>
            <Input
              ref={titleRef}
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Evening plenary session"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-day">Day</Label>
              <Select value={selectedDayId} onValueChange={setSelectedDayId}>
                <SelectTrigger id="event-day">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
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
              <Label htmlFor="event-category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ItemCategory)}>
                <SelectTrigger id="event-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !selectedDayId || createItem.isPending}
              className="flex-1"
            >
              {createItem.isPending ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
