import { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { useConnections } from '@/hooks/use-connections';
import { ConnectionCard } from '@/components/connections/ConnectionCard';
import { ConnectionCaptureSheet } from '@/components/connections/ConnectionCaptureSheet';
import '@/preview/collage/collage.css';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { Tape } from '@/preview/collage/ui/Tape';
import { MarginNote } from '@/preview/collage/ui/MarginNote';

interface PeopleTabProps {
  tripId: string;
}

/**
 * Connections surface — migrated to Collage (Phase 4 #7).
 * Who's-Who-Index vocabulary (PeopleV2): index-card rows, Stamp tab
 * labels, pen-blue hairlines between entries. `useConnections` hook +
 * ConnectionCaptureSheet are left alone (#10 touches the sheet).
 */
export function PeopleTab({ tripId }: PeopleTabProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: connections, isLoading } = useConnections(tripId);

  const count = connections?.length ?? 0;

  return (
    <div
      className="collage-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: '18px 18px 28px',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <Stamp variant="ink" size="md" rotate={-1.5}>
            WHO'S COMING
          </Stamp>
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontStyle: 'italic',
              color: 'var(--c-ink-muted)',
              margin: 0,
              fontSize: 13,
            }}
          >
            {count === 0
              ? 'Program back matter'
              : `${count} name${count === 1 ? '' : 's'} in the index`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          style={{
            appearance: 'none',
            cursor: 'pointer',
            padding: '10px 16px',
            fontFamily: 'var(--c-font-display)',
            fontSize: 11,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            borderRadius: 'var(--c-r-sm)',
            background: 'var(--c-ink)',
            color: 'var(--c-creme)',
            border: 0,
            boxShadow: 'var(--c-shadow-sm)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Plus className="w-3.5 h-3.5" aria-hidden />
          Add
        </button>
      </header>

      <div
        aria-hidden
        style={{
          height: 1,
          background: 'var(--c-line)',
          marginTop: -4,
        }}
      />

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 72,
                background: 'var(--c-paper)',
                border: '1px solid var(--c-line)',
                boxShadow: 'var(--c-shadow-sm)',
                opacity: 0.6,
                animation: 'pulse 1.4s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      ) : connections && connections.length > 0 ? (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {connections.map((connection) => (
            <li key={connection.id}>
              <ConnectionCard connection={connection} />
            </li>
          ))}
        </ul>
      ) : (
        <div
          style={{
            position: 'relative',
            background: 'var(--c-paper)',
            boxShadow: 'var(--c-shadow)',
            padding: '28px 22px',
            border: '1px solid var(--c-line)',
            textAlign: 'center',
            fontFamily: 'var(--c-font-body)',
            color: 'var(--c-ink-muted)',
          }}
        >
          <Tape position="top" rotate={-3} width={72} />
          <Users className="h-8 w-8 mx-auto" style={{ opacity: 0.4 }} aria-hidden />
          <p style={{ margin: '12px 0 0', fontSize: 14 }}>
            No connections yet. Tap &ldquo;Add&rdquo; to capture someone you meet.
          </p>
          <MarginNote rotate={-3} size={20} style={{ display: 'block', marginTop: 12 }}>
            — first roster lands with intake
          </MarginNote>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.9; }
        }
        @media (prefers-reduced-motion: reduce) {
          .collage-root [style*="animation"] { animation: none !important; }
        }
      `}</style>

      <ConnectionCaptureSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        tripId={tripId}
      />
    </div>
  );
}
