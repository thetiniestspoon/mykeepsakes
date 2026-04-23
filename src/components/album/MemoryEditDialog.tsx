import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateMemory } from '@/hooks/use-memories';
import { useTripDays } from '@/hooks/use-trip';
import { useLocations } from '@/hooks/use-locations';
import { useItineraryItems } from '@/hooks/use-itinerary';
import type { Memory } from '@/types/trip';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import { Tape } from '@/preview/collage/ui/Tape';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import '@/preview/collage/collage.css';

interface MemoryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memory: Memory | null;
}

const NONE = '__none__';

/**
 * Memory edit dialog — migrated to Collage direction (Phase 4 #4).
 * Scrapbook Spread vocabulary: stamps label the retroactive tagging sections,
 * Caveat margin note keeps the tone warm, tape accent at the top-right.
 * Update mutation + day/location/event inference logic unchanged.
 */
export function MemoryEditDialog({ open, onOpenChange, memory }: MemoryEditDialogProps) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [dayId, setDayId] = useState<string>(NONE);
  const [locationId, setLocationId] = useState<string>(NONE);
  const [itineraryItemId, setItineraryItemId] = useState<string>(NONE);

  const updateMemory = useUpdateMemory();
  const { data: days = [] } = useTripDays(memory?.trip_id);
  const { data: locations = [] } = useLocations(memory?.trip_id);
  const { data: items = [] } = useItineraryItems(memory?.trip_id);

  useEffect(() => {
    if (memory) {
      setTitle(memory.title || '');
      setNote(memory.note || '');
      setDayId(memory.day_id || NONE);
      setLocationId(memory.location_id || NONE);
      setItineraryItemId(memory.itinerary_item_id || NONE);
    }
  }, [memory, open]);

  // Filter events by selected day so the picker isn't a wall of items.
  // If no day is selected, show all trip items.
  const itemsForDay =
    dayId === NONE ? items : items.filter((it) => it.day_id === dayId);

  const handleSave = async () => {
    if (!memory) return;

    await updateMemory.mutateAsync({
      id: memory.id,
      title: title || null,
      note: note || null,
      day_id: dayId === NONE ? null : dayId,
      location_id: locationId === NONE ? null : locationId,
      itinerary_item_id: itineraryItemId === NONE ? null : itineraryItemId,
    });

    onOpenChange(false);
  };

  const sectionLabel = (text: string) => (
    <Stamp variant="plain" size="sm" style={{ color: 'var(--c-ink-muted)', padding: 0 }}>
      {text}
    </Stamp>
  );

  const hairline = (
    <div
      aria-hidden
      style={{
        height: 1,
        background: 'var(--c-line)',
        margin: '2px 0',
      }}
    />
  );

  const inputStyle: React.CSSProperties = {
    fontFamily: 'var(--c-font-body)',
    fontSize: 15,
    background: 'var(--c-creme)',
    border: '1px solid var(--c-line)',
    borderRadius: 'var(--c-r-sm)',
    color: 'var(--c-ink)',
    padding: '10px 12px',
    lineHeight: 1.5,
  };

  const selectTriggerStyle: React.CSSProperties = {
    fontFamily: 'var(--c-font-body)',
    background: 'var(--c-creme)',
    border: '1px solid var(--c-line)',
    borderRadius: 'var(--c-r-sm)',
    color: 'var(--c-ink)',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none">
        <div
          className="collage-root"
          style={{
            background: 'var(--c-paper)',
            position: 'relative',
            padding: '28px 24px 24px',
            boxShadow: 'var(--c-shadow)',
            border: '1px solid var(--c-line)',
          }}
        >
          <Tape position="top-right" rotate={5} width={68} />

          <DialogHeader className="text-left space-y-2">
            <Stamp variant="ink" size="sm" rotate={-2}>
              retag this keepsake
            </Stamp>
            <DialogTitle asChild>
              <h2
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 24,
                  fontWeight: 500,
                  letterSpacing: '-.005em',
                  margin: '10px 0 2px',
                  color: 'var(--c-ink)',
                }}
              >
                Edit memory
              </h2>
            </DialogTitle>
            <p
              style={{
                fontFamily: 'var(--c-font-body)',
                fontStyle: 'italic',
                color: 'var(--c-ink-muted)',
                margin: 0,
                fontSize: 14,
              }}
            >
              Update the title, note, and tags (day, location, event).
              Tags make this memory show up in the right places.
            </p>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
            {/* Title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sectionLabel('title')}
              <Input
                id="memory-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give this memory a title…"
                style={inputStyle}
              />
            </div>

            {/* Note */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
              {sectionLabel('note')}
              <Textarea
                id="memory-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note about this memory…"
                rows={3}
                style={inputStyle}
              />
              <MarginNote
                rotate={-3}
                size={18}
                style={{
                  alignSelf: 'flex-end',
                  marginTop: -4,
                }}
              >
                in your own words
              </MarginNote>
            </div>

            {hairline}

            {/* Day + Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sectionLabel('day')}
                <Select
                  value={dayId}
                  onValueChange={(v) => {
                    setDayId(v);
                    // If day changed and current event doesn't belong to it, clear it.
                    if (
                      v !== NONE &&
                      itineraryItemId !== NONE &&
                      !items.find((it) => it.id === itineraryItemId && it.day_id === v)
                    ) {
                      setItineraryItemId(NONE);
                    }
                  }}
                >
                  <SelectTrigger id="memory-day" style={selectTriggerStyle}>
                    <SelectValue placeholder="No day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>No day</SelectItem>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sectionLabel('where')}
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger id="memory-location" style={selectTriggerStyle}>
                    <SelectValue placeholder="No location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>No location</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Event */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sectionLabel('event')}
              <Select value={itineraryItemId} onValueChange={setItineraryItemId}>
                <SelectTrigger id="memory-item" style={selectTriggerStyle}>
                  <SelectValue placeholder="No event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No event</SelectItem>
                  {itemsForDay.map((it) => (
                    <SelectItem key={it.id} value={it.id}>
                      {it.title}
                      {it.start_time ? ` · ${it.start_time.slice(0, 5)}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {dayId !== NONE && itemsForDay.length === 0 && (
                <p
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontStyle: 'italic',
                    fontSize: 12,
                    color: 'var(--c-ink-muted)',
                    margin: 0,
                  }}
                >
                  No events on this day yet.
                </p>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'var(--c-creme)',
                  color: 'var(--c-ink)',
                  border: '1.5px solid var(--c-ink)',
                  borderRadius: 'var(--c-r-sm)',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 11,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'transform var(--c-t-fast) var(--c-ease-out)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={updateMemory.isPending}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'var(--c-ink)',
                  color: 'var(--c-creme)',
                  border: 0,
                  borderRadius: 'var(--c-r-sm)',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 11,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  cursor: updateMemory.isPending ? 'not-allowed' : 'pointer',
                  opacity: updateMemory.isPending ? 0.45 : 1,
                  boxShadow: 'var(--c-shadow-sm)',
                  transition: 'transform var(--c-t-fast) var(--c-ease-out)',
                }}
              >
                {updateMemory.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>

            <div style={{ marginTop: 2, textAlign: 'center' }}>
              <StickerPill variant="pen" style={{ opacity: 0.75 }}>
                mk · edit
              </StickerPill>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
