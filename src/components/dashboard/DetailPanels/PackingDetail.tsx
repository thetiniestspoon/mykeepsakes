import { useMemo } from 'react';
import { Backpack, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { PACKING_LIST, type PackingItem } from '@/lib/itinerary-data';
import { useChecklistItems, useToggleChecklistItem } from '@/hooks/use-trip-data';
import '@/preview/collage/collage.css';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import { Tape } from '@/preview/collage/ui/Tape';

/**
 * Full-page packing list view when Packing tab is selected.
 * Migrated to Collage direction — presentation only; hooks/state/handlers unchanged.
 */
export function PackingDetail() {
  const { data: checklistItems = {}, isLoading } = useChecklistItems();
  const toggleChecklist = useToggleChecklistItem();

  // Group packing items by category
  const packingByCategory = useMemo(() => {
    return PACKING_LIST.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, PackingItem[]>);
  }, []);

  // Calculate progress
  const packedCount = PACKING_LIST.filter(item => checklistItems[item.id]).length;
  const totalItems = PACKING_LIST.length;
  const progressPercent = totalItems > 0 ? (packedCount / totalItems) * 100 : 0;

  // Calculate per-category progress
  const categoryProgress = useMemo(() => {
    const progress: Record<string, { packed: number; total: number }> = {};
    for (const [category, items] of Object.entries(packingByCategory)) {
      const packed = items.filter(item => checklistItems[item.id]).length;
      progress[category] = { packed, total: items.length };
    }
    return progress;
  }, [packingByCategory, checklistItems]);

  if (isLoading) {
    return (
      <div className="collage-root h-full flex items-center justify-center">
        <div className="animate-pulse" style={{ color: 'var(--c-ink-muted)', fontFamily: 'var(--c-font-body)' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="collage-root h-full">
      <div className="p-4" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: 'var(--c-tape)',
              display: 'grid',
              placeItems: 'center',
              borderRadius: 'var(--c-r-sm)',
              boxShadow: 'var(--c-shadow-sm)',
              transform: 'rotate(-3deg)',
              flexShrink: 0,
            }}
          >
            <Backpack className="w-6 h-6" style={{ color: 'var(--c-ink)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontFamily: 'var(--c-font-display)',
                fontSize: 18,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: 'var(--c-ink)',
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              Packing List
            </h2>
            <p
              style={{
                fontFamily: 'var(--c-font-body)',
                fontSize: 13,
                color: 'var(--c-ink-muted)',
                margin: '4px 0 0',
              }}
            >
              {packedCount} of {totalItems} items packed
            </p>
          </div>
        </div>

        {/* Card wrapper for progress + list */}
        <div
          style={{
            position: 'relative',
            background: 'var(--c-paper)',
            border: '1px solid var(--c-line)',
            boxShadow: 'var(--c-shadow)',
            borderRadius: 'var(--c-r-sm)',
            padding: '20px 16px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <Tape position="top-left" rotate={-2} />

          {/* Progress Bar — flat */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: 'var(--c-font-body)',
                fontSize: 13,
              }}
            >
              <span style={{ color: 'var(--c-ink-muted)' }}>Progress</span>
              <span style={{ color: 'var(--c-ink)', fontWeight: 600 }}>{Math.round(progressPercent)}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={Math.round(progressPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Packing progress"
              style={{
                width: '100%',
                height: 4,
                background: 'var(--c-line)',
                borderRadius: 0,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: 'var(--c-pen)',
                  transition: 'width var(--c-t-med) var(--c-ease-out)',
                }}
              />
            </div>
          </div>

          {/* Categories */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {Object.entries(packingByCategory).map(([category, items]) => {
              const progress = categoryProgress[category];
              const isComplete = progress.packed === progress.total;

              return (
                <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Category Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <Stamp variant="ink" size="sm">
                      {category}
                    </Stamp>
                    {isComplete ? (
                      <StickerPill variant="pen">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Check className="w-3 h-3" />
                          Complete
                        </span>
                      </StickerPill>
                    ) : (
                      <StickerPill variant="pen">
                        {progress.packed} of {progress.total}
                      </StickerPill>
                    )}
                  </div>

                  {/* Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {items.map((item) => {
                      const isCompleted = checklistItems[item.id] ?? false;

                      return (
                        <label
                          key={item.id}
                          className={cn(
                            'packing-row',
                            'flex items-center gap-3 cursor-pointer'
                          )}
                          style={{
                            padding: '8px 10px',
                            background: 'var(--c-paper)',
                            border: '1px solid transparent',
                            borderRadius: 'var(--c-r-sm)',
                            transition:
                              'background var(--c-t-fast) var(--c-ease-out), border-color var(--c-t-fast) var(--c-ease-out)',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = 'var(--c-ink)';
                            e.currentTarget.style.background = 'var(--c-creme)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = 'transparent';
                            e.currentTarget.style.background = 'var(--c-paper)';
                          }}
                        >
                          <Checkbox
                            checked={isCompleted}
                            onCheckedChange={(checked) =>
                              toggleChecklist.mutate({ itemId: item.id, isCompleted: !!checked })
                            }
                            aria-label={item.item}
                          />
                          <span
                            style={{
                              fontFamily: 'var(--c-font-body)',
                              fontSize: 14,
                              color: isCompleted ? 'var(--c-ink-muted)' : 'var(--c-ink)',
                              textDecoration: isCompleted ? 'line-through' : 'none',
                            }}
                          >
                            {item.item}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
