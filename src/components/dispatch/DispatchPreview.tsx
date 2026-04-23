import { getMemoryMediaUrl } from '@/hooks/use-memories';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { StickerPill } from '@/preview/collage/ui/StickerPill';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import type { Memory } from '@/types/trip';

interface DispatchPreviewContentProps {
  dayTitle: string;
  selectedPhotos: Memory[];
  selectedReflections: Memory[];
  closingNote: string;
  /** Optional trip label, shown as the sub-heading under the day title. */
  tripTitle?: string;
}

/**
 * Pure preview renderer — no Dialog wrapper.
 *
 * Phase 4 #3 (Collage — Split Workspace):
 * Visually echoes the public-facing `SharedDispatch` page so the composer
 * sees the same paper/ink/pen vocabulary the recipient will receive.
 * Stamp section markers (scene / insights / closing), Plex Serif body,
 * dashed hairlines between reflections, pen-blue left-border closing block.
 *
 * When nothing is selected/written yet, shows an expectant placeholder
 * rather than an empty void.
 */
export function DispatchPreviewContent({
  dayTitle,
  selectedPhotos,
  selectedReflections,
  closingNote,
  tripTitle,
}: DispatchPreviewContentProps) {
  const isEmpty =
    selectedPhotos.length === 0 &&
    selectedReflections.length === 0 &&
    !closingNote;

  return (
    <div
      className="dispatch-preview-body"
      style={{ fontFamily: 'var(--c-font-body)' }}
    >
      {/* Header — echoes SharedDispatch article header */}
      <header style={{ marginBottom: 28 }}>
        <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 14 }}>
          dispatch
        </Stamp>
        <h2
          style={{
            fontFamily: 'var(--c-font-display)',
            fontSize: 'clamp(22px, 3vw, 30px)',
            lineHeight: 1.05,
            letterSpacing: '-.01em',
            margin: 0,
            color: 'var(--c-ink)',
          }}
        >
          {dayTitle}
        </h2>
        {tripTitle && (
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontStyle: 'italic',
              fontSize: 14,
              color: 'var(--c-ink-muted)',
              margin: '8px 0 0',
              lineHeight: 1.5,
            }}
          >
            {tripTitle}
          </p>
        )}
      </header>

      {/* Scene: photo gallery */}
      {selectedPhotos.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <Stamp variant="ink" size="sm" rotate={-1} style={{ marginBottom: 14 }}>
            scene
          </Stamp>
          <div
            className="dispatch-preview-photos"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 10,
            }}
          >
            {selectedPhotos.map((photo) => {
              const firstMedia = photo.media?.[0];
              if (!firstMedia) return null;
              const url = getMemoryMediaUrl(firstMedia.storage_path);
              return (
                <div
                  key={photo.id}
                  style={{
                    aspectRatio: '1 / 1',
                    background: 'var(--c-paper)',
                    padding: 6,
                    boxShadow: 'var(--c-shadow-sm)',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={url}
                    alt={photo.title ?? 'Photo'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Insights — reflections */}
      {selectedReflections.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <Stamp variant="outline" size="sm" rotate={-1} style={{ marginBottom: 14 }}>
            insights
          </Stamp>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              borderTop: '1px dashed var(--c-line)',
            }}
          >
            {selectedReflections.map((reflection) => (
              <li
                key={reflection.id}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px dashed var(--c-line)',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontSize: 15,
                    lineHeight: 1.6,
                    color: 'var(--c-ink)',
                    margin: 0,
                  }}
                >
                  {reflection.note}
                </p>
                {reflection.speaker && (
                  <p
                    style={{
                      fontFamily: 'var(--c-font-display)',
                      fontSize: 10,
                      letterSpacing: '.22em',
                      textTransform: 'uppercase',
                      color: 'var(--c-ink-muted)',
                      margin: '6px 0 0',
                    }}
                  >
                    {'—'} {reflection.speaker}
                    {reflection.session_title ? ` · ${reflection.session_title}` : ''}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Closing — pen-blue left-border block */}
      {closingNote && (
        <section
          style={{
            padding: '20px 20px 18px',
            borderLeft: '3px solid var(--c-pen)',
            background: 'rgba(31, 60, 198, 0.04)',
            position: 'relative',
            marginBottom: 12,
          }}
        >
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: -10,
              left: 16,
              fontFamily: 'var(--c-font-display)',
              fontSize: 10,
              letterSpacing: '.24em',
              textTransform: 'uppercase',
              padding: '4px 10px',
              background: 'var(--c-paper)',
              color: 'var(--c-pen)',
            }}
          >
            closing
          </span>
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontStyle: 'italic',
              fontSize: 16,
              lineHeight: 1.65,
              color: 'var(--c-ink)',
              margin: 0,
              maxWidth: '52ch',
              whiteSpace: 'pre-wrap',
            }}
          >
            {closingNote}
          </p>
        </section>
      )}

      {/* Sign-off — only when there's actual content */}
      {!isEmpty && (
        <section
          style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop: '1px solid var(--c-line)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <MarginNote rotate={-1} size={22}>
            {'—'} a dispatch from the road
          </MarginNote>
          <StickerPill variant="tape" rotate={-1}>
            ready to send
          </StickerPill>
        </section>
      )}

      {/* Empty-state placeholder */}
      {isEmpty && (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            border: '1px dashed var(--c-line)',
            borderRadius: 'var(--c-r-sm)',
            background: 'rgba(31, 60, 198, 0.02)',
          }}
        >
          <MarginNote rotate={-2} size={22} style={{ display: 'block', marginBottom: 8 }}>
            the letter starts here
          </MarginNote>
          <p
            style={{
              fontFamily: 'var(--c-font-body)',
              fontStyle: 'italic',
              fontSize: 14,
              color: 'var(--c-ink-muted)',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Pick photos or insights on the left — the preview will fill in as you go.
          </p>
        </div>
      )}
    </div>
  );
}
