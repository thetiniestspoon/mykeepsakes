import { ExternalLink, MapPin } from 'lucide-react';
import type { Accommodation } from '@/types/accommodation';
import '@/preview/collage/collage.css';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { Tape } from '@/preview/collage/ui/Tape';
import { MarginNote } from '@/preview/collage/ui/MarginNote';

/**
 * StayCard — Collage direction.
 * Migrated 2026-04-23 (Phase 4 #8). Presentation only; accommodation prop and
 * onOpenMap contract unchanged. Single paper card with tape top-right, Stamp
 * "the room" header, Caveat address MarginNote, pen-blue external-link +
 * map affordances per the Curator's Folio vocabulary.
 */

interface SelectedLocation {
  lat: number;
  lng: number;
  name: string;
  address?: string;
}

interface StayCardProps {
  accommodation: Accommodation;
  onOpenMap?: (location: SelectedLocation) => void;
}

export function StayCard({ accommodation, onOpenMap }: StayCardProps) {
  return (
    <article
      className="collage-root"
      style={{
        position: 'relative',
        background: 'var(--c-paper)',
        boxShadow: 'var(--c-shadow)',
        padding: '22px 22px 20px',
        marginTop: 14, // room for tape overhang
      }}
    >
      <Tape position="top-right" rotate={4} width={82} />

      {/* Stay-type stamp */}
      <div style={{ marginBottom: 10 }}>
        <Stamp variant="ink" size="sm" rotate={-2}>the room</Stamp>
      </div>

      {/* Title */}
      <h4
        style={{
          fontFamily: 'var(--c-font-body)',
          fontSize: 19,
          fontWeight: 500,
          color: 'var(--c-ink)',
          margin: 0,
          lineHeight: 1.25,
        }}
      >
        {accommodation.title}
      </h4>

      {/* Notes as supporting body copy */}
      {accommodation.notes && (
        <p
          style={{
            fontFamily: 'var(--c-font-body)',
            fontSize: 14,
            color: 'var(--c-ink-muted)',
            margin: '8px 0 0',
            lineHeight: 1.5,
          }}
        >
          {accommodation.notes}
        </p>
      )}

      {/* Address — a plain line for a11y + a Caveat margin note echo */}
      {accommodation.address && (
        <div style={{ position: 'relative', marginTop: 12 }}>
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 14,
              color: 'var(--c-ink)',
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            {accommodation.address}
          </p>
          <MarginNote
            rotate={-3}
            size={18}
            style={{ display: 'block', marginTop: 4 }}
          >
            the address
          </MarginNote>
        </div>
      )}

      {/* Hairline between body and affordances */}
      {(accommodation.url || (accommodation.location_lat && accommodation.location_lng && onOpenMap)) && (
        <div
          aria-hidden
          style={{
            borderTop: '1px dashed var(--c-line)',
            marginTop: 14,
            marginBottom: 12,
          }}
        />
      )}

      {/* Pen-blue affordances */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
        {accommodation.url && (
          <a
            href={accommodation.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--c-pen)',
              textDecoration: 'none',
              fontFamily: 'var(--c-font-body)',
              fontSize: 13,
              borderBottom: '1px dashed var(--c-pen)',
              paddingBottom: 1,
            }}
          >
            <ExternalLink style={{ width: 13, height: 13 }} aria-hidden />
            View Listing
          </a>
        )}
        {accommodation.location_lat && accommodation.location_lng && onOpenMap && (
          <button
            onClick={() => onOpenMap({
              lat: accommodation.location_lat!,
              lng: accommodation.location_lng!,
              name: accommodation.title,
              address: accommodation.address || undefined,
            })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--c-pen)',
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'var(--c-font-body)',
              fontSize: 13,
              borderBottom: '1px dashed var(--c-pen)',
              paddingBottom: 1,
            }}
          >
            <MapPin style={{ width: 13, height: 13 }} aria-hidden />
            Map
          </button>
        )}
      </div>
    </article>
  );
}
