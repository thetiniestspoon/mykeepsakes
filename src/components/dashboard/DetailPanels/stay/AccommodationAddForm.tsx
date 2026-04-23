import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useAddAccommodation } from '@/hooks/use-accommodations';
import { toast } from 'sonner';
import '@/preview/collage/collage.css';

/**
 * AccommodationAddForm — migrated to Collage direction (Phase 4d, StayDetail inner).
 * Parent (StayDetail) already wraps in `.collage-root`, so tokens cascade.
 * Presentation only; state + mutation handler unchanged.
 */
export function AccommodationAddForm() {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const addMutation = useAddAccommodation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error('Please enter a title');
      return;
    }

    // Auto-add https if URL provided without protocol
    let finalUrl = url.trim();
    if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }

    addMutation.mutate(
      { title: trimmedTitle, url: finalUrl || undefined },
      {
        onSuccess: () => {
          toast.success('Accommodation added');
          setTitle('');
          setUrl('');
        },
        onError: () => {
          toast.error('Failed to add accommodation');
        },
      }
    );
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    fontFamily: 'var(--c-font-body)',
    fontSize: 14,
    color: 'var(--c-ink)',
    background: 'var(--c-paper)',
    border: '1px solid var(--c-line)',
    borderRadius: 'var(--c-r-sm)',
    padding: '8px 10px',
    outline: 'none',
    transition: 'border-color var(--c-t-fast) var(--c-ease-out)',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
      <input
        type="text"
        placeholder="Title *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={inputStyle}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--c-pen)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--c-line)')}
      />
      <input
        type="text"
        placeholder="URL (optional)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={inputStyle}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--c-pen)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--c-line)')}
      />
      <button
        type="submit"
        disabled={addMutation.isPending}
        aria-label="Add accommodation"
        style={{
          appearance: 'none',
          width: 40,
          height: 40,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--c-ink)',
          color: 'var(--c-creme)',
          border: 0,
          borderRadius: 'var(--c-r-sm)',
          cursor: addMutation.isPending ? 'not-allowed' : 'pointer',
          opacity: addMutation.isPending ? 0.6 : 1,
          boxShadow: 'var(--c-shadow-sm)',
          transition: 'transform var(--c-t-fast) var(--c-ease-out)',
          flexShrink: 0,
        }}
      >
        {addMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </button>
    </form>
  );
}
