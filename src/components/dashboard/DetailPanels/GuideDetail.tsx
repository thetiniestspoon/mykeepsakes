import { lazy, Suspense } from 'react';
import { GenericSkeleton } from '@/components/LoadingSkeletons';

// Lazy load the full guide component
const GuideTab = lazy(() => import('@/components/GuideTab'));

interface GuideDetailProps {
  section?: string;
}

/**
 * Guide section viewer for the center column
 * Shows the full guide content or specific sections
 */
export function GuideDetail({ section }: GuideDetailProps) {
  // TODO: Add section filtering when GuideTab supports it
  // For now, show the full guide

  return (
    <div className="h-full overflow-y-auto">
      <Suspense fallback={<GenericSkeleton />}>
        <GuideTab />
      </Suspense>
    </div>
  );
}
