import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useAddCustomActivity, useUpdateCustomActivity, CustomActivity } from '@/hooks/use-activity-order';
import type { Activity } from '@/lib/itinerary-data';

interface ActivityEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayId: string;
  activity?: Activity | null;
  customActivityId?: string | null; // If editing a custom activity
  nextOrderIndex: number;
}

const CATEGORIES = [
  { value: 'activity', label: 'Activity' },
  { value: 'dining', label: 'Dining' },
  { value: 'beach', label: 'Beach' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'transport', label: 'Transport' },
  { value: 'event', label: 'Event' },
];

export function ActivityEditor({ 
  open, 
  onOpenChange, 
  dayId, 
  activity, 
  customActivityId,
  nextOrderIndex 
}: ActivityEditorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('activity');
  const [locationName, setLocationName] = useState('');
  const [link, setLink] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const addActivity = useAddCustomActivity();
  const updateActivity = useUpdateCustomActivity();

  useEffect(() => {
    if (activity) {
      setTitle(activity.title);
      setDescription(activity.description || '');
      setTime(activity.time || '');
      setCategory(activity.category);
      setLocationName(activity.location?.name || '');
      setLink(activity.link || '');
      setLinkLabel(activity.linkLabel || '');
      setPhone(activity.phone || '');
      setNotes(activity.notes || '');
    } else {
      setTitle('');
      setDescription('');
      setTime('');
      setCategory('activity');
      setLocationName('');
      setLink('');
      setLinkLabel('');
      setPhone('');
      setNotes('');
    }
  }, [activity, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const activityData = {
      day_id: dayId,
      title,
      description: description || null,
      time: time || null,
      category,
      location_name: locationName || null,
      location_lat: null,
      location_lng: null,
      link: link || null,
      link_label: linkLabel || null,
      phone: phone || null,
      map_link: null,
      notes: notes || null,
      order_index: nextOrderIndex,
    };

    if (customActivityId) {
      await updateActivity.mutateAsync({ id: customActivityId, ...activityData });
    } else {
      await addActivity.mutateAsync(activityData);
    }

    onOpenChange(false);
  };

  const isSubmitting = addActivity.isPending || updateActivity.isPending;
  const isEditing = !!customActivityId;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Activity' : 'Add Activity'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Update this activity' : 'Add a new activity to your itinerary'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Beach Day"
                required
              />
            </div>

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g., 10:00 AM"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's planned for this activity?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationName">Location Name</Label>
            <Input
              id="locationName"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g., Herring Cove Beach"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="link">Website URL</Label>
              <Input
                id="link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkLabel">Link Label</Label>
              <Input
                id="linkLabel"
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="e.g., Book Tickets"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., 508-555-1234"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes/Tips</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any helpful tips or reminders..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title || isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Add Activity')}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
