import { lazy, Suspense } from 'react';
import { AlbumSkeleton } from '@/components/LoadingSkeletons';

// Lazy load the album component
const AlbumTab = lazy(() => import('@/components/album/AlbumTab').then(m => ({ default: m.AlbumTab })));

/**
 * Full album experience for the center column
 * Shows all memories in grid/gallery format
 */
export function AlbumExperience() {
  return (
    <div className="h-full overflow-y-auto">
      <Suspense fallback={<AlbumSkeleton />}>
        <AlbumTab />
      </Suspense>
    </div>
  );
}
