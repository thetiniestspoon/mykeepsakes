import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useAddCustomActivity, useUpdateCustomActivity } from '@/hooks/use-activity-order';
import { useUpsertActivityOverride, useDeleteActivityOverride } from '@/hooks/use-activity-overrides';
import type { Activity } from '@/lib/itinerary-data';
import { RotateCcw, Loader2 } from 'lucide-react';
import { Stamp } from '@/preview/collage/ui/Stamp';
import '@/preview/collage/collage.css';

interface ActivityEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayId: string;
  activity?: Activity | null;
  customActivityId?: string | null; // If editing a custom activity
  isBaseActivity?: boolean; // If editing a base activity (not custom)
  baseActivityId?: string | null; // The ID of the base activity being edited
  nextOrderIndex: number;
}

const CATEGORIES = [
  { value: 'activity', label: 'Activity' },
  { value: 'dining', label: 'Dining' },
  { value: 'beach', label: 'Beach' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'transport', label: 'Transport' },
  { value: 'event', label: 'Event' },
];

/**
 * ActivityEditor (legacy path) — migrated to Collage direction (Phase 4 #2).
 * Sheet primitive preserved; content slot wrapped with collage-root. IBM
 * Plex Serif inputs with hairline underline + pen-blue focus. Rubik Mono
 * uppercase Save/Cancel. Stamp "edit/new activity" overline. All form
 * state, mutation wiring, and reset-to-default semantics unchanged.
 */
export function ActivityEditor({
  open,
  onOpenChange,
  dayId,
  activity,
  customActivityId,
  isBaseActivity,
  baseActivityId,
  nextOrderIndex,
}: ActivityEditorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('activity');
  const [locationName, setLocationName] = useState('');
  const [link, setLink] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const addActivity = useAddCustomActivity();
  const updateActivity = useUpdateCustomActivity();
  const upsertOverride = useUpsertActivityOverride();
  const deleteOverride = useDeleteActivityOverride();

  useEffect(() => {
    if (activity) {
      setTitle(activity.title);
      setDescription(activity.description || '');
      setTime(activity.time || '');
      setCategory(activity.category);
      setLocationName(activity.location?.name || '');
      setLink(activity.link || '');
      setLinkLabel(activity.linkLabel || '');
      setPhone(activity.phone || '');
      setNotes(activity.notes || '');
    } else {
      setTitle('');
      setDescription('');
      setTime('');
      setCategory('activity');
      setLocationName('');
      setLink('');
      setLinkLabel('');
      setPhone('');
      setNotes('');
    }
  }, [activity, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isBaseActivity && baseActivityId) {
      await upsertOverride.mutateAsync({
        activity_id: baseActivityId,
        title: title || null,
        description: description || null,
        time: time || null,
        category: category || null,
        location_name: locationName || null,
        location_lat: null,
        location_lng: null,
        link: link || null,
        link_label: linkLabel || null,
        phone: phone || null,
        notes: notes || null,
      });
    } else if (customActivityId) {
      const activityData = {
        day_id: dayId,
        title,
        description: description || null,
        time: time || null,
        category,
        location_name: locationName || null,
        location_lat: null,
        location_lng: null,
        link: link || null,
        link_label: linkLabel || null,
        phone: phone || null,
        map_link: null,
        notes: notes || null,
        order_index: nextOrderIndex,
      };
      await updateActivity.mutateAsync({ id: customActivityId, ...activityData });
    } else {
      const activityData = {
        day_id: dayId,
        title,
        description: description || null,
        time: time || null,
        category,
        location_name: locationName || null,
        location_lat: null,
        location_lng: null,
        link: link || null,
        link_label: linkLabel || null,
        phone: phone || null,
        map_link: null,
        notes: notes || null,
        order_index: nextOrderIndex,
      };
      await addActivity.mutateAsync(activityData);
    }

    onOpenChange(false);
  };

  const handleResetToDefault = async () => {
    if (baseActivityId) {
      await deleteOverride.mutateAsync(baseActivityId);
      onOpenChange(false);
    }
  };

  const isSubmitting = addActivity.isPending || updateActivity.isPending || upsertOverride.isPending;
  const isResetting = deleteOverride.isPending;
  const isEditingCustom = !!customActivityId;
  const isEditingBase = isBaseActivity && !!baseActivityId;

  // Styling helpers — Plex Serif inputs with hairline underline + pen-blue focus.
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
              {isEditingCustom || isEditingBase ? 'edit activity' : 'new activity'}
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
                {isEditingCustom || isEditingBase ? 'Edit Activity' : 'Add Activity'}
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
                {isEditingBase
                  ? 'Customize this activity. Changes are saved separately from the original.'
                  : isEditingCustom
                  ? 'Update this activity'
                  : 'Add a new activity to your itinerary'}
              </p>
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 22 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label htmlFor="title" style={{ gridColumn: 'span 2', display: 'block' }}>
                <span style={labelStyle}>Title *</span>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Beach Day"
                  required
                  style={inputStyle}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </label>

              <label htmlFor="time" style={{ gridColumn: 'span 2', display: 'block' }}>
                <span style={labelStyle}>Time</span>
                <input
                  id="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="e.g., 10:00 AM"
                  style={inputStyle}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </label>
            </div>

            <div>
              <label htmlFor="category" style={labelStyle}>
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger
                  id="category"
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

            <label htmlFor="description" style={{ display: 'block' }}>
              <span style={labelStyle}>Description</span>
              <textarea
                id="description"
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

            <label htmlFor="locationName" style={{ display: 'block' }}>
              <span style={labelStyle}>Location Name</span>
              <input
                id="locationName"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., Chicago Marriott Oak Brook"
                style={inputStyle}
                onFocus={focusOn}
                onBlur={focusOff}
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label htmlFor="link" style={{ display: 'block' }}>
                <span style={labelStyle}>Website URL</span>
                <input
                  id="link"
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://…"
                  style={inputStyle}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </label>

              <label htmlFor="linkLabel" style={{ display: 'block' }}>
                <span style={labelStyle}>Link Label</span>
                <input
                  id="linkLabel"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="e.g., Book Tickets"
                  style={inputStyle}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </label>
            </div>

            <label htmlFor="phone" style={{ display: 'block' }}>
              <span style={labelStyle}>Phone Number</span>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., 508-555-1234"
                style={inputStyle}
                onFocus={focusOn}
                onBlur={focusOff}
              />
            </label>

            <label htmlFor="notes" style={{ display: 'block' }}>
              <span style={labelStyle}>Notes / Tips</span>
              <textarea
                id="notes"
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
                ) : isEditingCustom || isEditingBase ? (
                  'Update'
                ) : (
                  'Add Activity'
                )}
              </button>
            </div>

            {/* Reset to Default button for base activities */}
            {isEditingBase && (
              <button
                type="button"
                onClick={handleResetToDefault}
                disabled={isResetting}
                style={{
                  appearance: 'none',
                  cursor: isResetting ? 'not-allowed' : 'pointer',
                  width: '100%',
                  padding: '10px 12px',
                  background: 'transparent',
                  color: 'var(--c-ink-muted)',
                  border: '1px dashed var(--c-line)',
                  borderRadius: 'var(--c-r-sm)',
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 10,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: isResetting ? 0.5 : 1,
                }}
              >
                <RotateCcw style={{ width: 12, height: 12 }} aria-hidden />
                {isResetting ? 'Resetting…' : 'Reset to Default'}
              </button>
            )}
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
