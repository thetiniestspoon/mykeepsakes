import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2 } from 'lucide-react';
import { useAddAccommodation } from '@/hooks/use-accommodations';
import { toast } from 'sonner';

export function AccommodationAddForm() {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  
  const addMutation = useAddAccommodation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error('Please enter a title');
      return;
    }

    // Auto-add https if URL provided without protocol
    let finalUrl = url.trim();
    if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }

    addMutation.mutate(
      { title: trimmedTitle, url: finalUrl || undefined },
      {
        onSuccess: () => {
          toast.success('Accommodation added');
          setTitle('');
          setUrl('');
        },
        onError: () => {
          toast.error('Failed to add accommodation');
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="Title *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1"
      />
      <Input
        placeholder="URL (optional)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" size="icon" disabled={addMutation.isPending}>
        {addMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </Button>
    </form>
  );
}
