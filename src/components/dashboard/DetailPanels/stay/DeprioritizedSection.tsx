import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, EyeOff } from 'lucide-react';
import { StaticAccommodationCard } from './AccommodationCard';
import type { Accommodation } from '@/types/accommodation';
import '@/preview/collage/collage.css';

/**
 * DeprioritizedSection — migrated to Collage direction (Phase 4d, StayDetail inner).
 * Parent wraps in `.collage-root`; tokens cascade. Collapsible state + render
 * unchanged. Trigger button restyled with Collage tokens (uppercase Rubik Mono
 * One label, hairline divider).
 */

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
        <button
          type="button"
          style={{
            appearance: 'none',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 8px',
            background: 'transparent',
            border: 0,
            borderTop: '1px solid var(--c-line)',
            borderBottom: '1px solid var(--c-line)',
            cursor: 'pointer',
            color: 'var(--c-ink-muted)',
            fontFamily: 'var(--c-font-display)',
            fontSize: 10,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            transition: 'color var(--c-t-fast) var(--c-ease-out)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <EyeOff className="w-4 h-4" />
            Hidden ({items.length})
          </span>
          <ChevronDown
            className="w-4 h-4"
            style={{
              transition: 'transform var(--c-t-med) var(--c-ease-out)',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 10 }}>
          {items.map((accommodation) => (
            <StaticAccommodationCard
              key={accommodation.id}
              accommodation={accommodation}
              onUnhide={() => onUnhide(accommodation.id)}
              onDelete={() => onDelete(accommodation.id)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
