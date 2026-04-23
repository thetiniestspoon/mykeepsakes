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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateItem } from '@/hooks/use-itinerary';
import { useLocations } from '@/hooks/use-locations';
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

const NO_LOCATION_VALUE = '__none__';

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
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<ItemCategory>('event');
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>(NO_LOCATION_VALUE);
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const titleRef = useRef<HTMLInputElement>(null);
  const createItem = useCreateItem();
  const { data: locations = [] } = useLocations(tripId);

  useEffect(() => {
    if (open) {
      setSelectedDayId(currentDayId || days[0]?.id || '');
      setTimeout(() => titleRef.current?.focus(), 100);
    } else {
      setTitle('');
      setTime('');
      setCategory('event');
      setSelectedLocationId(NO_LOCATION_VALUE);
      setDescription('');
      setLink('');
      setLinkLabel('');
      setPhone('');
      setNotes('');
    }
  }, [open, currentDayId, days]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedDayId) return;

    // Match DatabaseActivityEditor: time input "HH:MM" → DB TIME "HH:MM:SS"
    const startTime = time ? `${time}:00` : null;

    await createItem.mutateAsync({
      trip_id: tripId,
      day_id: selectedDayId,
      title: title.trim(),
      description: description.trim() || null,
      start_time: startTime,
      end_time: null,
      category,
      item_type: 'activity',
      location_id: selectedLocationId === NO_LOCATION_VALUE ? null : selectedLocationId,
      source: 'manual',
      external_ref: null,
      sort_index: 999,
      status: 'planned',
      completed_at: null,
      link: link.trim() || null,
      link_label: linkLabel.trim() || null,
      phone: phone.trim() || null,
      notes: notes.trim() || null,
    });

    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Event</SheetTitle>
          <SheetDescription>
            Add an event to your itinerary
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="event-title">Title *</Label>
              <Input
                ref={titleRef}
                id="event-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Evening plenary"
                required
              />
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="event-time">Time</Label>
              <Input
                id="event-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
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

          <div className="space-y-2">
            <Label htmlFor="event-location">Location</Label>
            <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
              <SelectTrigger id="event-location">
                <SelectValue placeholder="No location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_LOCATION_VALUE}>No location</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                    {loc.address ? ` — ${loc.address}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description">Description</Label>
            <Textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's planned?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-link">Website URL</Label>
              <Input
                id="event-link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-link-label">Link Label</Label>
              <Input
                id="event-link-label"
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="e.g., Register"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-phone">Phone Number</Label>
            <Input
              id="event-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., 312-555-1234"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-notes">Notes</Label>
            <Textarea
              id="event-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything helpful to remember..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4 pb-2">
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
              {createItem.isPending ? 'Adding...' : 'Add Event'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
