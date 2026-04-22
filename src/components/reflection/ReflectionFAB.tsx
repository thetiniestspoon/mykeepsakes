import { useState } from 'react';
import { Plus, PenLine, UserPlus, CalendarPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReflectionFABProps {
  onReflection: () => void;
  onConnection: () => void;
  onEvent: () => void;
}

export function ReflectionFAB({ onReflection, onConnection, onEvent }: ReflectionFABProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col-reverse items-end gap-2">
      {expanded && (
        <>
          <Button
            size="lg"
            variant="secondary"
            className="rounded-full shadow-lg h-12 px-4 gap-2 animate-in fade-in slide-in-from-bottom-2"
            onClick={() => { onReflection(); setExpanded(false); }}
          >
            <PenLine className="h-5 w-5" />
            Reflection
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="rounded-full shadow-lg h-12 px-4 gap-2 animate-in fade-in slide-in-from-bottom-2"
            onClick={() => { onConnection(); setExpanded(false); }}
          >
            <UserPlus className="h-5 w-5" />
            Connection
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="rounded-full shadow-lg h-12 px-4 gap-2 animate-in fade-in slide-in-from-bottom-2"
            onClick={() => { onEvent(); setExpanded(false); }}
          >
            <CalendarPlus className="h-5 w-5" />
            Event
          </Button>
        </>
      )}
      <Button
        size="lg"
        className="rounded-full shadow-xl h-14 w-14 p-0"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  );
}
