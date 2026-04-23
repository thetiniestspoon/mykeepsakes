import { lazy, Suspense } from 'react';
import { GenericSkeleton } from '@/components/LoadingSkeletons';
import '@/preview/collage/collage.css';

// Lazy load the full guide component
const GuideTab = lazy(() => import('@/components/GuideTab'));

interface GuideDetailProps {
  section?: string;
}

/**
 * Guide section viewer for the center column.
 * Lazy-loads the already-Collage-migrated GuideTab. This wrapper scopes
 * tokens explicitly via className="collage-root" so the Suspense fallback
 * resolves Collage CSS variables even before the inner chunk loads.
 * Presentation only — state/hooks/handlers unchanged.
 */
export function GuideDetail({ section: _section }: GuideDetailProps) {
  // TODO: Add section filtering when GuideTab supports it
  // For now, show the full guide.

  return (
    <div
      className="collage-root h-full overflow-y-auto"
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={<GenericSkeleton />}>
        <GuideTab />
      </Suspense>
    </div>
  );
}
