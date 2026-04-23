import { Images } from 'lucide-react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { getPhotoUrl } from '@/hooks/use-trip-data';
import '@/preview/collage/collage.css';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { Tape } from '@/preview/collage/ui/Tape';
import { PolaroidCard, resolveMood } from '@/preview/collage/ui/PolaroidCard';
import { MarginNote } from '@/preview/collage/ui/MarginNote';

/**
 * Photo Album folio section — Collage direction.
 * Migrated 2026-04-23 (Phase 4 #8). Presentation only; accordion value
 * ("photos") and onOpenPhoto contract preserved. First photo features as a
 * PolaroidCard hero with caption; the remainder fill a dense grid of taped
 * paper chips. Empty state shows a ghost polaroid prompt.
 */

interface Photo {
  id: string;
  storage_path: string;
  caption?: string | null;
}

interface PhotoAlbumSectionProps {
  photos: Photo[] | undefined;
  onOpenPhoto: (photos: Photo[], index: number) => void;
}

export function PhotoAlbumSection({ photos, onOpenPhoto }: PhotoAlbumSectionProps) {
  const hasPhotos = !!photos && photos.length > 0;
  const [hero, ...rest] = hasPhotos ? photos! : [];

  return (
    <AccordionItem
      value="photos"
      className="border-0"
      style={{
        position: 'relative',
        background: 'var(--c-paper)',
        boxShadow: 'var(--c-shadow)',
        marginTop: 18,
      }}
    >
      <Tape position="top-right" rotate={6} width={82} />

      <AccordionTrigger className="hover:no-underline" style={{ padding: '20px 22px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left' }}>
          <div
            aria-hidden
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              background: 'var(--c-creme)',
              border: '1.5px solid var(--c-ink)',
              color: 'var(--c-ink)',
              flexShrink: 0,
            }}
          >
            <Images style={{ width: 20, height: 20 }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: 4 }}>
              <Stamp variant="ink" size="sm" rotate={-1}>photo album</Stamp>
            </div>
            <div
              style={{
                fontFamily: 'var(--c-font-body)',
                fontSize: 17,
                fontWeight: 500,
                color: 'var(--c-ink)',
                lineHeight: 1.2,
              }}
            >
              Photo Album
            </div>
            <p
              style={{
                fontFamily: 'var(--c-font-body)',
                fontStyle: 'italic',
                fontSize: 13,
                color: 'var(--c-ink-muted)',
                margin: '4px 0 0',
                lineHeight: 1.4,
              }}
            >
              {photos?.length || 0} memories captured
            </p>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent style={{ padding: '0 22px 22px' }}>
        <div style={{ borderTop: '1px dashed var(--c-line)', paddingTop: 16, position: 'relative' }}>
          <MarginNote
            rotate={-3}
            size={19}
            style={{ position: 'absolute', top: -12, right: 4, background: 'var(--c-paper)', padding: '0 6px' }}
          >
            keepsakes, in frame
          </MarginNote>

          {hasPhotos ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Featured hero photo as PolaroidCard */}
              {hero && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    paddingTop: 12,
                    paddingBottom: 4,
                  }}
                >
                  <PolaroidCard
                    mood={resolveMood('photo', null)}
                    rotate={-3}
                    size="md"
                    entrance
                    tape
                    overline="the opener"
                    caption={hero.caption || 'keepsake'}
                    onClick={() => onOpenPhoto(photos!, 0)}
                  >
                    <img
                      src={getPhotoUrl(hero.storage_path)}
                      alt={hero.caption || 'Featured trip photo'}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </PolaroidCard>
                </div>
              )}

              {/* Dense paper-chip grid for the remainder */}
              {rest.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
                    gap: 10,
                  }}
                >
                  {rest.map((photo, idx) => {
                    const index = idx + 1; // true index into photos[]
                    const rot = (idx % 3) - 1; // -1, 0, 1 cycling
                    return (
                      <button
                        key={photo.id}
                        onClick={() => onOpenPhoto(photos!, index)}
                        aria-label={`Open photo ${index + 1}`}
                        style={{
                          position: 'relative',
                          background: 'var(--c-paper)',
                          padding: 4,
                          boxShadow: 'var(--c-shadow-sm)',
                          border: 'none',
                          cursor: 'pointer',
                          transform: `rotate(${rot * 2}deg)`,
                          transition: 'transform var(--c-t-fast) var(--c-ease-out), box-shadow var(--c-t-fast)',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'rotate(0deg) translateY(-2px)';
                          e.currentTarget.style.boxShadow = 'var(--c-shadow)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = `rotate(${rot * 2}deg)`;
                          e.currentTarget.style.boxShadow = 'var(--c-shadow-sm)';
                        }}
                      >
                        <img
                          src={getPhotoUrl(photo.storage_path)}
                          alt={photo.caption || 'Trip photo'}
                          style={{
                            display: 'block',
                            width: '100%',
                            aspectRatio: '1/1',
                            objectFit: 'cover',
                          }}
                          loading="lazy"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                paddingTop: 20,
                paddingBottom: 12,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <MarginNote rotate={-2} size={22}>
                no keepsakes yet
              </MarginNote>
              <p
                style={{
                  fontFamily: 'var(--c-font-body)',
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: 'var(--c-ink-muted)',
                  margin: 0,
                  maxWidth: '40ch',
                  lineHeight: 1.5,
                }}
              >
                Add photos to activities in your itinerary and they will collect here.
              </p>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
