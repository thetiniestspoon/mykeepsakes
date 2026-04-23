import { useState } from 'react';
import { Plus, Archive, Loader2, CheckCircle2, Home } from 'lucide-react';
import { useAccommodations, useSelectedAccommodation } from '@/hooks/use-accommodations';
import { LodgingLinkTile } from '@/components/lodging/LodgingLinkTile';
import { AddLodgingLinkDialog } from '@/components/lodging/AddLodgingLinkDialog';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import { Tape } from '@/preview/collage/ui/Tape';
import '@/preview/collage/collage.css';

type TabKey = 'active' | 'archived';

/**
 * Lodging tab migrated to Collage (Phase 4 #9) — "Concierge Card" vocabulary.
 * The chosen-stay banner gets a special paper-card honor (mirroring LodgingV1);
 * active/archived link tiles render as small paper tiles with tape + ±1.5°
 * rotation cycle. Active hooks/mutations/state unchanged — presentation only.
 * DetailPanels/stay/* is H3 scope and stays untouched here.
 */
export function LodgingTab() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('active');

  const { data: accommodations, isLoading, error } = useAccommodations();
  const { data: selectedAccommodation } = useSelectedAccommodation();

  const activeOptions =
    accommodations?.filter((a) => !a.is_deprioritized && !a.is_selected) || [];
  const archivedOptions = accommodations?.filter((a) => a.is_deprioritized) || [];

  if (isLoading) {
    return (
      <div
        className="collage-root"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 0',
          background: 'transparent',
          minHeight: 0,
        }}
      >
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: 'var(--c-pen)' }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="collage-root"
        style={{
          padding: '24px 16px',
          background: 'transparent',
          minHeight: 0,
        }}
      >
        <div
          style={{
            background: 'var(--c-paper)',
            border: '1px solid var(--c-danger)',
            boxShadow: 'var(--c-shadow-sm)',
            padding: '18px 20px',
            textAlign: 'center',
            fontFamily: 'var(--c-font-body)',
            color: 'var(--c-danger)',
          }}
        >
          Failed to load lodging options. Please try again.
        </div>
      </div>
    );
  }

  const currentList = activeTab === 'active' ? activeOptions : archivedOptions;
  const currentEmpty = currentList.length === 0;

  const tabButton = (key: TabKey, label: string, count: number, Icon: typeof Home) => {
    const selected = activeTab === key;
    return (
      <button
        type="button"
        role="tab"
        aria-selected={selected}
        onClick={() => setActiveTab(key)}
        style={{
          flex: 1,
          appearance: 'none',
          cursor: 'pointer',
          padding: '10px 12px',
          fontFamily: 'var(--c-font-display)',
          fontSize: 10,
          letterSpacing: '.22em',
          textTransform: 'uppercase',
          background: selected ? 'var(--c-ink)' : 'transparent',
          color: selected ? 'var(--c-creme)' : 'var(--c-ink-muted)',
          border: '1.5px solid var(--c-ink)',
          borderRadius: 'var(--c-r-sm)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          lineHeight: 1,
          transition: 'background var(--c-t-fast) var(--c-ease-out)',
        }}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 20,
            height: 18,
            padding: '0 6px',
            background: selected ? 'var(--c-creme)' : 'var(--c-ink)',
            color: selected ? 'var(--c-ink)' : 'var(--c-creme)',
            fontFamily: 'var(--c-font-body)',
            fontSize: 11,
            letterSpacing: 0,
            borderRadius: 'var(--c-r-sm)',
          }}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <div
      className="collage-root"
      style={{
        background: 'transparent',
        minHeight: 0,
        paddingBottom: 80,
      }}
    >
      {/* HEADER — stamped title + Caveat subtitle */}
      <header
        style={{
          textAlign: 'center',
          padding: '20px 16px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Stamp variant="ink" size="md" rotate={-2}>
          lodging
        </Stamp>
        <h2
          style={{
            fontFamily: 'var(--c-font-body)',
            fontSize: 24,
            fontWeight: 500,
            color: 'var(--c-ink)',
            margin: '4px 0 0',
            letterSpacing: '-.005em',
          }}
        >
          Rooms to come back to
        </h2>
        <MarginNote rotate={-3} size={20}>
          save &amp; compare rental listings
        </MarginNote>
      </header>

      {/* SELECTED — concierge card for the chosen stay (if any) */}
      {selectedAccommodation && (
        <section
          style={{
            position: 'relative',
            margin: '4px 16px 8px',
            padding: '16px 18px',
            background: 'var(--c-paper)',
            border: '1px solid var(--c-line)',
            boxShadow: 'var(--c-shadow)',
          }}
        >
          <Tape position="top-left" rotate={-6} width={96} />
          <Tape position="top-right" rotate={5} width={84} />

          <div
            style={{
              fontFamily: 'var(--c-font-display)',
              fontSize: 11,
              letterSpacing: '.26em',
              textTransform: 'uppercase',
              color: 'var(--c-pen)',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--c-pen)' }} />
            your stay
          </div>
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 20,
              fontWeight: 500,
              color: 'var(--c-ink)',
              margin: 0,
              lineHeight: 1.15,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selectedAccommodation.title}
          </p>
          <MarginNote rotate={-2} size={20} color="ink" style={{ marginTop: 6 }}>
            booked · the one to come back to
          </MarginNote>
        </section>
      )}

      {/* ADD BUTTON — ink Stamp-style */}
      <div style={{ padding: '8px 16px 4px' }}>
        <button
          type="button"
          onClick={() => setAddDialogOpen(true)}
          style={{
            width: '100%',
            appearance: 'none',
            cursor: 'pointer',
            padding: '12px 16px',
            fontFamily: 'var(--c-font-display)',
            fontSize: 11,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            background: 'var(--c-ink)',
            color: 'var(--c-creme)',
            border: 0,
            borderRadius: 'var(--c-r-sm)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: 'var(--c-shadow-sm)',
            transition: 'transform var(--c-t-fast) var(--c-ease-out)',
          }}
        >
          <Plus className="w-4 h-4" />
          Add a link
        </button>
      </div>

      {/* TABS */}
      <div role="tablist" style={{ padding: '12px 16px 4px', display: 'flex', gap: 10 }}>
        {tabButton('active', 'active', activeOptions.length, Home)}
        {tabButton('archived', 'archived', archivedOptions.length, Archive)}
      </div>

      {/* LIST */}
      <div
        role="tabpanel"
        style={{
          padding: '12px 16px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {currentEmpty ? (
          <div
            style={{
              position: 'relative',
              background: 'var(--c-paper)',
              border: '1px dashed var(--c-ink)',
              padding: '28px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Tape position="top" rotate={-3} width={90} />
            {activeTab === 'active' ? (
              <Home
                className="w-8 h-8"
                style={{ color: 'var(--c-ink-muted)', opacity: 0.65 }}
              />
            ) : (
              <Archive
                className="w-8 h-8"
                style={{ color: 'var(--c-ink-muted)', opacity: 0.65 }}
              />
            )}
            <MarginNote rotate={-2} size={22}>
              no rooms pinned yet
            </MarginNote>
            {activeTab === 'active' ? (
              <>
                <p
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 14,
                    fontStyle: 'italic',
                    color: 'var(--c-ink-muted)',
                    margin: '0 0 6px',
                    maxWidth: '36ch',
                  }}
                >
                  Add links to listings so you can compare the places you&rsquo;re
                  choosing between.
                </p>
                <button
                  type="button"
                  onClick={() => setAddDialogOpen(true)}
                  style={{
                    appearance: 'none',
                    cursor: 'pointer',
                    padding: '10px 16px',
                    fontFamily: 'var(--c-font-display)',
                    fontSize: 11,
                    letterSpacing: '.22em',
                    textTransform: 'uppercase',
                    background: 'transparent',
                    color: 'var(--c-pen)',
                    border: '1.5px dashed currentColor',
                    borderRadius: 'var(--c-r-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add a link
                </button>
              </>
            ) : (
              <p
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontSize: 14,
                  fontStyle: 'italic',
                  color: 'var(--c-ink-muted)',
                  margin: 0,
                  maxWidth: '36ch',
                }}
              >
                Archived listings land here. Set any active link aside and it will
                show up in this stack.
              </p>
            )}
          </div>
        ) : (
          currentList.map((accommodation, i) => (
            <LodgingLinkTile
              key={accommodation.id}
              accommodation={accommodation}
              index={i}
            />
          ))
        )}
      </div>

      {/* TIP */}
      <div
        style={{
          margin: '22px 16px 0',
          padding: '14px 16px',
          background: 'var(--c-paper)',
          border: '1px dashed var(--c-line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <StickerPill variant="tape" rotate={-2}>
          tip
        </StickerPill>
        <p
          style={{
            fontFamily: 'var(--c-font-body)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--c-ink-muted)',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Drag an option onto the Stay tab to make it your chosen stay.
        </p>
      </div>

      {/* Add Dialog */}
      <AddLodgingLinkDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}
