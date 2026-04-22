import { Calendar, MapPin, StickyNote } from 'lucide-react';
import type { Memory, MemoryMedia } from '@/types/trip';
import { supabase } from '@/integrations/supabase/client';
import { PolaroidCard, resolveMood } from '@/preview/collage/ui/PolaroidCard';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import '@/preview/collage/collage.css';

interface PhotoDetailProps {
  memory: Memory | null;
}

/**
 * Photo/memory detail viewer for the center column.
 * Migrated to Collage direction: the primary photo is a PolaroidCard (physical print feel),
 * multi-photo galleries become slightly rotated polaroid prints, and the note sits on
 * paper-flat chrome with a MarginNote warmth accent. Logic, data fetching, and a11y
 * are unchanged — presentation swap only.
 */
export function PhotoDetail({ memory }: PhotoDetailProps) {
  if (!memory) {
    return (
      <div
        className="collage-root"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--c-ink-muted)',
          fontFamily: 'var(--c-font-body)',
        }}
      >
        <p>Select a photo to see details</p>
      </div>
    );
  }

  // Get public URLs for media
  const getMediaUrl = (media: MemoryMedia) => {
    const { data } = supabase.storage.from('memories').getPublicUrl(media.storage_path);
    return data?.publicUrl;
  };

  const mood = resolveMood(
    memory.itinerary_item?.category ?? null,
    memory.itinerary_item?.start_time ?? null,
  );

  // Stable rotation for each polaroid in a grid — keeps ordering consistent
  const gridRotations = [-2, 1.5, -1.25, 2, -2.5, 1];

  const media = memory.media ?? [];
  const [primary, ...rest] = media;
  const altText = memory.title || 'Memory photo';

  return (
    <div className="collage-root" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Primary photo — feels like a physical print */}
      {primary && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '12px 8px 8px',
          }}
        >
          <PolaroidCard
            mood={mood}
            rotate={-2}
            size="lg"
            tape
            caption={memory.title ?? memory.location?.name ?? undefined}
            overline={memory.itinerary_item?.category ?? memory.memory_type ?? undefined}
          >
            <img
              src={getMediaUrl(primary)}
              alt={altText}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </PolaroidCard>
        </div>
      )}

      {/* Additional photos — smaller polaroids at slight rotations */}
      {rest.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 18,
            justifyContent: 'center',
            padding: '8px 4px',
          }}
        >
          {rest.map((m, idx) => (
            <PolaroidCard
              key={m.id}
              mood={mood}
              rotate={gridRotations[idx % gridRotations.length]}
              size="sm"
            >
              <img
                src={getMediaUrl(m)}
                alt={altText}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </PolaroidCard>
          ))}
        </div>
      )}

      {/* Title — surfaces even if it wasn't used as a caption (e.g. no media) */}
      {memory.title && !primary && (
        <h2
          style={{
            fontFamily: 'var(--c-font-body)',
            fontSize: 22,
            fontWeight: 500,
            color: 'var(--c-ink)',
            margin: 0,
            lineHeight: 1.25,
            letterSpacing: '-.01em',
          }}
        >
          {memory.title}
        </h2>
      )}

      {/* Metadata row — day + location, kept accessible */}
      {(memory.day || memory.location) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            fontFamily: 'var(--c-font-body)',
            fontSize: 13,
            color: 'var(--c-ink-muted)',
          }}
        >
          {memory.day && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar className="w-4 h-4" aria-hidden />
              <span>{memory.day.title || memory.day.date}</span>
            </div>
          )}
          {memory.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin className="w-4 h-4" aria-hidden />
              <span>{memory.location.name}</span>
            </div>
          )}
        </div>
      )}

      {/* Note — paper-flat card, sharp corners, with a "kept" marginalia accent */}
      {memory.note && (
        <div
          style={{
            position: 'relative',
            background: 'var(--c-paper)',
            border: '1px solid var(--c-line)',
            borderRadius: 'var(--c-r-sm)',
            boxShadow: 'var(--c-shadow)',
            padding: '18px 20px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Stamp variant="outline" size="sm" rotate={-2}>
              note
            </Stamp>
            <StickyNote
              className="w-4 h-4"
              aria-hidden
              style={{ color: 'var(--c-ink-muted)' }}
            />
          </div>
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontSize: 14,
              lineHeight: 1.65,
              color: 'var(--c-ink)',
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {memory.note}
          </p>
          <MarginNote
            rotate={-4}
            size={20}
            style={{
              position: 'absolute',
              right: 12,
              bottom: -10,
              background: 'var(--c-paper)',
              padding: '0 6px',
            }}
          >
            kept
          </MarginNote>
        </div>
      )}
    </div>
  );
}
