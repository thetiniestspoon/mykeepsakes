import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useUpdateItem, useCreateItem } from '@/hooks/use-itinerary';
import type { ItemCategory } from '@/types/trip';
import type { LegacyActivity } from '@/hooks/use-database-itinerary';
import { Loader2 } from 'lucide-react';
import { Stamp } from '@/preview/collage/ui/Stamp';
import '@/preview/collage/collage.css';

interface DatabaseActivityEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayId: string;
  tripId: string;
  activity?: LegacyActivity | null;
}

const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: 'activity', label: 'Activity' },
  { value: 'dining', label: 'Dining' },
  { value: 'beach', label: 'Beach' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'transport', label: 'Transport' },
  { value: 'event', label: 'Event' },
];

/**
 * DatabaseActivityEditor (DB path) — migrated to Collage direction (Phase 4 #2).
 * Sheet primitive preserved; content slot wrapped with collage-root. Plex
 * Serif inputs, hairline underline with pen-blue focus, Rubik Mono
 * uppercase Save/Cancel. Time picker (native HH:MM → HH:MM:SS conversion
 * at submit) unchanged. updateItem / createItem mutations unchanged.
 */
export function DatabaseActivityEditor({
  open,
  onOpenChange,
  dayId,
  tripId,
  activity,
}: DatabaseActivityEditorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<ItemCategory>('activity');
  const [link, setLink] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const updateItem = useUpdateItem();
  const createItem = useCreateItem();

  const isEditing = !!activity;

  useEffect(() => {
    if (activity) {
      setTitle(activity.title);
      setDescription(activity.description || '');
      // Convert from display time (e.g., "6:30 PM") to 24h format for input
      setTime(activity.rawStartTime?.slice(0, 5) || ''); // "18:30:00" -> "18:30"
      setCategory(activity.category);
      setLink(activity.link || '');
      setLinkLabel(activity.linkLabel || '');
      setPhone(activity.phone || '');
      setNotes(activity.notes || '');
    } else {
      setTitle('');
      setDescription('');
      setTime('');
      setCategory('activity');
      setLink('');
      setLinkLabel('');
      setPhone('');
      setNotes('');
    }
  }, [activity, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert time input to TIME format (HH:MM:SS)
    const startTime = time ? `${time}:00` : null;

    if (isEditing && activity) {
      await updateItem.mutateAsync({
        id: activity.id,
        title,
        description: description || null,
        start_time: startTime,
        category,
        link: link || null,
        link_label: linkLabel || null,
        phone: phone || null,
        notes: notes || null,
      });
    } else {
      await createItem.mutateAsync({
        trip_id: tripId,
        day_id: dayId,
        title,
        description: description || null,
        start_time: startTime,
        end_time: null,
        category,
        item_type: 'activity',
        location_id: null,
        source: 'manual',
        external_ref: null,
        sort_index: 999, // Will be at end
        status: 'planned',
        completed_at: null,
        link: link || null,
        link_label: linkLabel || null,
        phone: phone || null,
        notes: notes || null,
      });
    }

    onOpenChange(false);
  };

  const isSubmitting = updateItem.isPending || createItem.isPending;

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
            <Stamp variant="ink" size="sm" rotate={-2}>
              {isEditing ? 'edit activity' : 'new activity'}
            </Stamp>
            <SheetTitle asChild>
              <h2
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 22,
                  fontWeight: 500,
                  letterSpacing: '-.005em',
                  margin: '8px 0 0',
                  color: 'var(--c-ink)',
                }}
              >
                {isEditing ? 'Edit Activity' : 'Add Activity'}
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
                {isEditing ? 'Update this activity' : 'Add a new activity to your itinerary'}
              </p>
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 22 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label htmlFor="db-title" style={{ gridColumn: 'span 2', display: 'block' }}>
                <span style={labelStyle}>Title *</span>
                <input
                  id="db-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Beach Day"
                  required
                  style={inputStyle}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </label>

              <label htmlFor="db-time" style={{ gridColumn: 'span 2', display: 'block' }}>
                <span style={labelStyle}>Time</span>
                <input
                  id="db-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="e.g., 10:00"
                  style={inputStyle}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </label>
            </div>

            <div>
              <label htmlFor="db-category" style={labelStyle}>
                Category
              </label>
              <Select value={category} onValueChange={(val) => setCategory(val as ItemCategory)}>
                <SelectTrigger
                  id="db-category"
                  style={{
                    background: 'var(--c-paper)',
                    border: 0,
                    borderBottom: '1.5px solid var(--c-ink)',
                    borderRadius: 0,
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 15,
                    color: 'var(--c-ink)',
                    padding: '8px 2px',
                    height: 'auto',
                  }}
                >
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

            <label htmlFor="db-description" style={{ display: 'block' }}>
              <span style={labelStyle}>Description</span>
              <textarea
                id="db-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's planned for this activity?"
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
              <label htmlFor="db-link" style={{ display: 'block' }}>
                <span style={labelStyle}>Website URL</span>
                <input
                  id="db-link"
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://…"
                  style={inputStyle}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </label>

              <label htmlFor="db-link-label" style={{ display: 'block' }}>
                <span style={labelStyle}>Link Label</span>
                <input
                  id="db-link-label"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="e.g., Book Tickets"
                  style={inputStyle}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </label>
            </div>

            <label htmlFor="db-phone" style={{ display: 'block' }}>
              <span style={labelStyle}>Phone Number</span>
              <input
                id="db-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., 508-555-1234"
                style={inputStyle}
                onFocus={focusOn}
                onBlur={focusOff}
              />
            </label>

            <label htmlFor="db-notes" style={{ display: 'block' }}>
              <span style={labelStyle}>Notes / Tips</span>
              <textarea
                id="db-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any helpful tips or reminders…"
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
                disabled={!title || isSubmitting}
                style={{
                  flex: 1,
                  appearance: 'none',
                  cursor: !title || isSubmitting ? 'not-allowed' : 'pointer',
                  padding: '12px 16px',
                  background: !title || isSubmitting ? 'var(--c-ink-muted)' : 'var(--c-ink)',
                  color: 'var(--c-creme)',
                  border: 0,
                  borderRadius: 'var(--c-r-sm)',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 11,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  boxShadow: !title || isSubmitting ? 'none' : 'var(--c-shadow-sm)',
                  opacity: !title || isSubmitting ? 0.6 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : isEditing ? (
                  'Update'
                ) : (
                  'Add Activity'
                )}
              </button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
