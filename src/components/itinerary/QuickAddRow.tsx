import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateItem } from '@/hooks/use-itinerary';
import { useActiveTrip } from '@/hooks/use-trip';

interface QuickAddRowProps {
  dayId: string;
}

export function QuickAddRow({ dayId }: QuickAddRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const { data: trip } = useActiveTrip();
  const createItem = useCreateItem();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !trip) return;
    
    await createItem.mutateAsync({
      trip_id: trip.id,
      day_id: dayId,
      title: title.trim(),
      description: null,
      start_time: null,
      end_time: null,
      category: 'activity',
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
    setIsExpanded(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsExpanded(false);
      setTitle('');
    }
  };
  
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full flex items-center gap-2 p-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors border border-dashed border-muted-foreground/30"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm">Add activity...</span>
      </button>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What's the activity?"
        autoFocus
        className="flex-1"
      />
      <Button 
        type="submit" 
        size="sm"
        disabled={!title.trim() || createItem.isPending}
      >
        {createItem.isPending ? '...' : 'Add'}
      </Button>
      <Button 
        type="button" 
        size="sm" 
        variant="ghost"
        onClick={() => {
          setIsExpanded(false);
          setTitle('');
        }}
      >
        Cancel
      </Button>
    </form>
  );
}
