import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCreateItem } from '@/hooks/use-itinerary';
import { useActiveTrip } from '@/hooks/use-trip';
import '@/preview/collage/collage.css';

interface QuickAddRowProps {
  dayId: string;
}

/**
 * QuickAddRow — migrated to Collage direction (Phase 4 #2 support).
 * Collapsed: outline Stamp-styled "+ ADD" chip on dashed hairline border.
 * Expanded: hairline-bordered IBM Plex Serif input + Rubik Mono save/cancel.
 * Logic unchanged (createItem mutation, Escape-to-collapse). Respects
 * prefers-reduced-motion via CSS (no animated entry).
 */
export function QuickAddRow({ dayId }: QuickAddRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const { data: trip } = useActiveTrip();
  const createItem = useCreateItem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !trip) return;

    await createItem.mutateAsync({
      trip_id: trip.id,
      day_id: dayId,
      title: title.trim(),
      description: null,
      start_time: null,
      end_time: null,
      category: 'activity',
      item_type: 'activity',
      location_id: null,
      source: 'manual',
      external_ref: null,
      sort_index: 999, // Will be placed at end
      status: 'planned',
      completed_at: null,
      link: null,
      link_label: null,
      phone: null,
      notes: null,
    });

    setTitle('');
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsExpanded(false);
      setTitle('');
    }
  };

  if (!isExpanded) {
    return (
      <div className="collage-root" style={{ display: 'block' }}>
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="mk-quickadd-collapsed"
          style={{
            appearance: 'none',
            width: '100%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px 14px',
            background: 'var(--c-creme)',
            color: 'var(--c-ink-muted)',
            border: '1.5px dashed var(--c-line)',
            borderRadius: 'var(--c-r-sm)',
            cursor: 'pointer',
            fontFamily: 'var(--c-font-display)',
            fontSize: 10,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            transition:
              'border-color var(--c-t-fast) var(--c-ease-out), color var(--c-t-fast) var(--c-ease-out)',
          }}
        >
          <Plus style={{ width: 14, height: 14 }} aria-hidden />
          <span>+ add activity</span>
        </button>
        <style>{`
          .mk-quickadd-collapsed:hover {
            border-color: var(--c-pen);
            color: var(--c-pen);
          }
          .mk-quickadd-collapsed:focus-visible {
            outline: 2px solid var(--c-pen);
            outline-offset: 2px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="collage-root"
      style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}
    >
      <label htmlFor="quickadd-title" style={{ position: 'absolute', left: -9999, top: 'auto' }}>
        New activity
      </label>
      <input
        id="quickadd-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What's the activity?"
        autoFocus
        className="mk-quickadd-input"
        style={{
          flex: 1,
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
        }}
      />
      <button
        type="submit"
        disabled={!title.trim() || createItem.isPending}
        className="mk-quickadd-save"
        style={{
          appearance: 'none',
          cursor: !title.trim() || createItem.isPending ? 'not-allowed' : 'pointer',
          padding: '8px 14px',
          background: !title.trim() || createItem.isPending ? 'var(--c-ink-muted)' : 'var(--c-ink)',
          color: 'var(--c-creme)',
          border: 0,
          borderRadius: 'var(--c-r-sm)',
          fontFamily: 'var(--c-font-display)',
          fontSize: 10,
          letterSpacing: '.22em',
          textTransform: 'uppercase',
          opacity: !title.trim() || createItem.isPending ? 0.6 : 1,
          boxShadow: 'var(--c-shadow-sm)',
        }}
      >
        {createItem.isPending ? '…' : 'add'}
      </button>
      <button
        type="button"
        onClick={() => {
          setIsExpanded(false);
          setTitle('');
        }}
        style={{
          appearance: 'none',
          cursor: 'pointer',
          padding: '8px 14px',
          background: 'transparent',
          color: 'var(--c-ink-muted)',
          border: '1.5px solid var(--c-line)',
          borderRadius: 'var(--c-r-sm)',
          fontFamily: 'var(--c-font-display)',
          fontSize: 10,
          letterSpacing: '.22em',
          textTransform: 'uppercase',
        }}
      >
        cancel
      </button>
      <style>{`
        .mk-quickadd-input:focus {
          border-bottom-color: var(--c-pen);
        }
      `}</style>
    </form>
  );
}
