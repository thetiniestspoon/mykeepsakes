import type { Connection } from '@/types/conference';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import '@/preview/collage/collage.css';

interface ConnectionCardProps {
  connection: Connection;
}

type CategoryKey = 'speaker' | 'chaplain' | 'organizer' | 'transport' | 'other';

function categoryOf(c: Connection): CategoryKey {
  const cat = (c.category ?? '').toLowerCase();
  if (cat.includes('speaker') || cat.includes('presenter') || cat.includes('facilitator')) return 'speaker';
  if (cat.includes('chaplain')) return 'chaplain';
  if (cat.includes('organizer') || cat.includes('organiser') || cat.includes('host')) return 'organizer';
  if (cat.includes('transport') || cat.includes('driver')) return 'transport';
  return 'other';
}

function isPresenter(c: Connection): boolean {
  if (categoryOf(c) === 'speaker') return true;
  const ctx = (c.met_context ?? '').toLowerCase();
  return /session|workshop|plenary|keynote|panel|presented|taught|led/.test(ctx);
}

const CATEGORY_LABEL: Record<CategoryKey, string> = {
  speaker: 'Speaker',
  chaplain: 'Chaplain',
  organizer: 'Organizer',
  transport: 'Transport',
  other: 'Guest',
};

function initialOf(name: string): string {
  return (name.trim()[0] ?? '?').toUpperCase();
}

/**
 * Index-card row for a single connection — Phase 4 #7 Collage migration.
 * Matches PeopleV2 "Who's Who Index" language at row scale: round initial
 * stamp, IBM Plex Serif name, Caveat/italic met-context, pen-blue email
 * and phone. No logic changes; this is presentation only.
 */
export function ConnectionCard({ connection }: ConnectionCardProps) {
  const key = categoryOf(connection);
  const presenter = isPresenter(connection);
  const initial = initialOf(connection.name);

  return (
    <article
      className="collage-root"
      style={{
        position: 'relative',
        display: 'flex',
        gap: 14,
        padding: '14px 14px',
        background: 'var(--c-paper)',
        border: '1px solid var(--c-line)',
        boxShadow: 'var(--c-shadow-sm)',
        fontFamily: 'var(--c-font-body)',
        color: 'var(--c-ink)',
      }}
    >
      {/* Initial stamp */}
      <div
        aria-hidden
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1.5px solid var(--c-ink)',
          background: presenter ? 'var(--c-tape)' : 'var(--c-creme)',
          color: 'var(--c-ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--c-font-display)',
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {initial}
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h4
            style={{
              margin: 0,
              fontFamily: 'var(--c-font-body)',
              fontSize: 16,
              fontWeight: 500,
              color: 'var(--c-ink)',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={connection.name}
          >
            {connection.name}
          </h4>
          <StickerPill
            variant={presenter ? 'ink' : 'pen'}
            style={{ fontSize: 9, padding: '4px 8px' }}
          >
            {presenter ? 'Presenter' : CATEGORY_LABEL[key]}
          </StickerPill>
        </div>

        {connection.organization && (
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--c-font-body)',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--c-ink-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={connection.organization}
          >
            {connection.organization}
          </p>
        )}

        {connection.met_context && (
          <p
            style={{
              margin: '2px 0 0',
              fontFamily: 'var(--c-font-script)',
              fontSize: 17,
              lineHeight: 1.2,
              color: 'var(--c-ink)',
            }}
          >
            {connection.met_context}
          </p>
        )}

        {(connection.email || connection.phone) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
            {connection.email && (
              <a
                href={`mailto:${connection.email}`}
                style={{
                  fontSize: 12,
                  color: 'var(--c-pen)',
                  textDecoration: 'underline',
                  textDecorationStyle: 'dotted',
                  textUnderlineOffset: 3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {connection.email}
              </a>
            )}
            {connection.phone && (
              <a
                href={`tel:${connection.phone}`}
                style={{
                  fontSize: 12,
                  color: 'var(--c-pen)',
                  textDecoration: 'underline',
                  textDecorationStyle: 'dotted',
                  textUnderlineOffset: 3,
                  whiteSpace: 'nowrap',
                }}
              >
                {connection.phone}
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
