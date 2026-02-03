import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useUpdateMemory } from '@/hooks/use-memories';
import type { Memory } from '@/types/trip';

interface MemoryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memory: Memory | null;
}

export function MemoryEditDialog({ open, onOpenChange, memory }: MemoryEditDialogProps) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  
  const updateMemory = useUpdateMemory();

  useEffect(() => {
    if (memory) {
      setTitle(memory.title || '');
      setNote(memory.note || '');
    }
  }, [memory, open]);

  const handleSave = async () => {
    if (!memory) return;
    
    await updateMemory.mutateAsync({
      id: memory.id,
      title: title || null,
      note: note || null,
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Edit Memory</DialogTitle>
          <DialogDescription>
            Update the title and note for this memory.
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
              rows={4}
            />
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
