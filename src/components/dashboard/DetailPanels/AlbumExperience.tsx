import { lazy, Suspense } from 'react';
import { AlbumSkeleton } from '@/components/LoadingSkeletons';
import '@/preview/collage/collage.css';

// Lazy load the album component
const AlbumTab = lazy(() => import('@/components/album/AlbumTab').then(m => ({ default: m.AlbumTab })));

/**
 * Full album experience for the center column.
 * Lazy-loads the already-Collage-migrated AlbumTab (scrapbook pages by day).
 * This wrapper scopes tokens explicitly via className="collage-root" so the
 * Suspense fallback resolves Collage CSS variables even before the inner
 * chunk loads. Presentation only — state/hooks/handlers unchanged.
 */
export function AlbumExperience() {
  return (
    <div
      className="collage-root h-full overflow-y-auto"
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={<AlbumSkeleton />}>
        <AlbumTab />
      </Suspense>
    </div>
  );
}
