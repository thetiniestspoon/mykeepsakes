import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, EyeOff } from 'lucide-react';
import { StaticAccommodationCard } from './AccommodationCard';
import type { Accommodation } from '@/types/accommodation';
import { cn } from '@/lib/utils';

interface DeprioritizedSectionProps {
  items: Accommodation[];
  onUnhide: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DeprioritizedSection({ items, onUnhide, onDelete }: DeprioritizedSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (items.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between px-2 h-10 text-muted-foreground">
          <span className="flex items-center gap-2">
            <EyeOff className="w-4 h-4" />
            Hidden ({items.length})
          </span>
          <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        {items.map((accommodation) => (
          <StaticAccommodationCard
            key={accommodation.id}
            accommodation={accommodation}
            onUnhide={() => onUnhide(accommodation.id)}
            onDelete={() => onDelete(accommodation.id)}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
