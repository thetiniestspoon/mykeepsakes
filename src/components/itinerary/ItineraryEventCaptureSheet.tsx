import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateItem } from '@/hooks/use-itinerary';
import { useLocations } from '@/hooks/use-locations';
import type { ItemCategory } from '@/types/trip';
import type { ItineraryDay } from '@/types/trip';
import { Loader2 } from 'lucide-react';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import '@/preview/collage/collage.css';

const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: 'activity', label: 'Activity' },
  { value: 'dining', label: 'Dining' },
  { value: 'beach', label: 'Beach' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'transport', label: 'Transport' },
  { value: 'event', label: 'Event' },
];

const NO_LOCATION_VALUE = '__none__';

interface ItineraryEventCaptureSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  days: ItineraryDay[];
  currentDayId?: string;
}

/**
 * ItineraryEventCaptureSheet — migrated to Collage direction (Phase 4 #2 support).
 * Sheet primitive preserved; content slot wrapped with collage-root. "Capture
 * an event" vocabulary (outline Stamp + tape StickerPill). Plex Serif inputs
 * with hairline underline + pen-blue focus. createItem mutation, auto-focus,
 * day selection default, and form-reset-on-close all unchanged.
 */
export function ItineraryEventCaptureSheet({
  open,
  onOpenChange,
  tripId,
  days,
  currentDayId,
}: ItineraryEventCaptureSheetProps) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<ItemCategory>('event');
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>(NO_LOCATION_VALUE);
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const titleRef = useRef<HTMLInputElement>(null);
  const createItem = useCreateItem();
  const { data: locations = [] } = useLocations(tripId);

  useEffect(() => {
    if (open) {
      setSelectedDayId(currentDayId || days[0]?.id || '');
      setTimeout(() => titleRef.current?.focus(), 100);
    } else {
      setTitle('');
      setTime('');
      setCategory('event');
      setSelectedLocationId(NO_LOCATION_VALUE);
      setDescription('');
      setLink('');
      setLinkLabel('');
      setPhone('');
      setNotes('');
    }
  }, [open, currentDayId, days]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedDayId) return;

    // Match DatabaseActivityEditor: time input "HH:MM" → DB TIME "HH:MM:SS"
    const startTime = time ? `${time}:00` : null;

    await createItem.mutateAsync({
      trip_id: tripId,
      day_id: selectedDayId,
      title: title.trim(),
      description: description.trim() || null,
      start_time: startTime,
      end_time: null,
      category,
      item_type: 'activity',
      location_id: selectedLocationId === NO_LOCATION_VALUE ? null : selectedLocationId,
      source: 'manual',
      external_ref: null,
      sort_index: 999,
      status: 'planned',
      completed_at: null,
      link: link.trim() || null,
      link_label: linkLabel.trim() || null,
      phone: phone.trim() || null,
      notes: notes.trim() || null,
    });

    onOpenChange(false);
  };

  // Styling helpers
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--c-font-display)',
    fontSize: 10,
    letterSpacing: '.22em',
    textTransform: 'uppercase',
    color: 'var(--c-ink-muted)',
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    fontFamily: 'var(--c-font-body)',
    fontSize: 15,
    color: 'var(--c-ink)',
    background: 'var(--c-paper)',
    border: 0,
    borderBottom: '1.5px solid var(--c-ink)',
    borderRadius: 0,
    padding: '8px 2px',
    outline: 'none',
    transition: 'border-color var(--c-t-fast) var(--c-ease-out)',
    boxSizing: 'border-box',
  };

  const selectTriggerStyle: React.CSSProperties = {
    background: 'var(--c-paper)',
    border: 0,
    borderBottom: '1.5px solid var(--c-ink)',
    borderRadius: 0,
    fontFamily: 'var(--c-font-body)',
    fontSize: 15,
    color: 'var(--c-ink)',
    padding: '8px 2px',
    height: 'auto',
  };

  const focusOn = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderBottomColor = 'var(--c-pen)';
  };
  const focusOff = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderBottomColor = 'var(--c-ink)';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none"
      >
        <div
          className="collage-root"
          style={{
            position: 'relative',
            background: 'var(--c-paper)',
            padding: '24px 20px 28px',
            borderTop: '1px solid var(--c-line)',
            boxShadow: 'var(--c-shadow)',
            minHeight: '100%',
          }}
        >
          <SheetHeader className="text-left space-y-2">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Stamp variant="outline" size="sm" rotate={-3}>
                capture an event
              </Stamp>
              <StickerPill variant="tape" rotate={-2}>
                itinerary
              </StickerPill>
            </div>
            <SheetTitle asChild>
              <h2
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 22,
                  fontWeight: 500,
                  letterSpacing: '-.005em',
                  margin: '10px 0 0',
                  color: 'var(--c-ink)',
                }}
              >
                Add Event
              </h2>
            </SheetTitle>
            <SheetDescription asChild>
              <p
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: 'var(--c-ink-muted)',
                  margin: '2px 0 0',
                }}
              >
                Add an event to your itinerary
              </p>
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 22 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label htmlFor="event-title" style={{ gridColumn: 'span 2', display: 'block' }}>
                <span style={labelStyle}>Title *</span>
                <input
                  ref={titleRef}
                  id="event-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Evening plenary"
                  required
                  style={inputStyle}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </label>

              <label htmlFor="event-time" style={{ gridColumn: 'span 2', display: 'block' }}>
                <span style={labelStyle}>Time</span>
                <input
                  id="event-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  style={inputStyle}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label htmlFor="event-day" style={labelStyle}>
                  Day
                </label>
                <Select value={selectedDayId} onValueChange={setSelectedDayId}>
                  <SelectTrigger id="event-day" style={selectTriggerStyle}>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
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

              <div>
                <label htmlFor="event-category" style={labelStyle}>
                  Category
                </label>
                <Select value={category} onValueChange={(v) => setCategory(v as ItemCategory)}>
                  <SelectTrigger id="event-category" style={selectTriggerStyle}>
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

            <div>
              <label htmlFor="event-location" style={labelStyle}>
                Location
              </label>
              <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                <SelectTrigger id="event-location" style={selectTriggerStyle}>
                  <SelectValue placeholder="No location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_LOCATION_VALUE}>No location</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                      {loc.address ? ` — ${loc.address}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label htmlFor="event-description" style={{ display: 'block' }}>
              <span style={labelStyle}>Description</span>
              <textarea
                id="event-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's planned?"
                rows={3}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  borderBottom: 0,
                  border: '1.5px solid var(--c-ink)',
                  borderRadius: 'var(--c-r-sm)',
                  padding: '10px 12px',
                  minHeight: 76,
                  lineHeight: '22px',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--c-pen)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--c-ink)';
                }}
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label htmlFor="event-link" style={{ display: 'block' }}>
                <span style={labelStyle}>Website URL</span>
                <input
                  id="event-link"
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://…"
                  style={inputStyle}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </label>

              <label htmlFor="event-link-label" style={{ display: 'block' }}>
                <span style={labelStyle}>Link Label</span>
                <input
                  id="event-link-label"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="e.g., Register"
                  style={inputStyle}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </label>
            </div>

            <label htmlFor="event-phone" style={{ display: 'block' }}>
              <span style={labelStyle}>Phone Number</span>
              <input
                id="event-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., 312-555-1234"
                style={inputStyle}
                onFocus={focusOn}
                onBlur={focusOff}
              />
            </label>

            <label htmlFor="event-notes" style={{ display: 'block' }}>
              <span style={labelStyle}>Notes</span>
              <textarea
                id="event-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything helpful to remember…"
                rows={2}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  borderBottom: 0,
                  border: '1.5px solid var(--c-ink)',
                  borderRadius: 'var(--c-r-sm)',
                  padding: '10px 12px',
                  minHeight: 56,
                  lineHeight: '22px',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--c-pen)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--c-ink)';
                }}
              />
            </label>

            <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                style={{
                  flex: 1,
                  appearance: 'none',
                  cursor: 'pointer',
                  padding: '12px 16px',
                  background: 'transparent',
                  color: 'var(--c-ink)',
                  border: '1.5px solid var(--c-ink)',
                  borderRadius: 'var(--c-r-sm)',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 11,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !selectedDayId || createItem.isPending}
                style={{
                  flex: 1,
                  appearance: 'none',
                  cursor:
                    !title.trim() || !selectedDayId || createItem.isPending ? 'not-allowed' : 'pointer',
                  padding: '12px 16px',
                  background:
                    !title.trim() || !selectedDayId || createItem.isPending
                      ? 'var(--c-ink-muted)'
                      : 'var(--c-ink)',
                  color: 'var(--c-creme)',
                  border: 0,
                  borderRadius: 'var(--c-r-sm)',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 11,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  boxShadow:
                    !title.trim() || !selectedDayId || createItem.isPending
                      ? 'none'
                      : 'var(--c-shadow-sm)',
                  opacity:
                    !title.trim() || !selectedDayId || createItem.isPending ? 0.6 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {createItem.isPending ? (
                  <>
                    <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" aria-hidden />
                    Adding…
                  </>
                ) : (
                  'Add Event'
                )}
              </button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
