import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActiveTrip, useTripDays, getTripMode } from '@/hooks/use-trip';
import { useCreateItem } from '@/hooks/use-itinerary';
import type { ItemCategory } from '@/types/trip';

const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: 'activity', label: 'Activity' },
  { value: 'dining', label: 'Dining' },
  { value: 'beach', label: 'Beach' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'transport', label: 'Transport' },
  { value: 'event', label: 'Event' },
];

export function QuickAddButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory>('activity');
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  
  const { data: trip } = useActiveTrip();
  const { data: days = [] } = useTripDays(trip?.id);
  const createItem = useCreateItem();
  
  const mode = trip ? getTripMode(trip) : 'pre';
  
  // Get today's date for default selection during active trips
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDay = days.find(d => d.date === todayStr);
  
  const handleOpen = () => {
    // Default to today's day if in active mode
    if (mode === 'active' && todayDay) {
      setSelectedDayId(todayDay.id);
    } else if (days.length > 0) {
      setSelectedDayId(days[0].id);
    }
    setIsOpen(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !selectedDayId || !trip) return;
    
    // Find max sort_index for the day
    const dayItems = days.find(d => d.id === selectedDayId);
    
    await createItem.mutateAsync({
      trip_id: trip.id,
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
      sort_index: 999, // Will be placed at end
      status: 'planned',
      completed_at: null,
      link: null,
      link_label: null,
      phone: null,
      notes: null
    });
    
    setTitle('');
    setCategory('activity');
    setIsOpen(false);
  };
  
  if (!trip || days.length === 0) {
    return null;
  }
  
  return (
    <>
      {/* Floating Action Button with breathing animation */}
      <Button
        onClick={handleOpen}
        size="lg"
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow animate-breathing"
      >
        <Plus className="w-6 h-6" />
        <span className="sr-only">Add activity</span>
      </Button>
      
      {/* Quick Add Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[70vh]">
          <SheetHeader>
            <SheetTitle>Quick Add Activity</SheetTitle>
            <SheetDescription>
              Add a new activity to your itinerary
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="quick-title">What are you doing?</Label>
              <Input
                id="quick-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Lunch at Antico Posto"
                autoFocus
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quick-day">Day</Label>
                <Select value={selectedDayId} onValueChange={setSelectedDayId}>
                  <SelectTrigger id="quick-day">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day, index) => (
                      <SelectItem key={day.id} value={day.id}>
                        Day {index + 1}: {day.title || new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quick-category">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ItemCategory)}>
                  <SelectTrigger id="quick-category">
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
                onClick={() => setIsOpen(false)}
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
    </>
  );
}
