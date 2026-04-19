import { lazy, Suspense } from 'react';
import { Calendar, Book, Camera } from 'lucide-react';
import { GenericSkeleton, AlbumSkeleton } from '@/components/LoadingSkeletons';

// Lazy load components
const GuideTab = lazy(() => import('@/components/GuideTab'));
const AlbumTab = lazy(() => import('@/components/album/AlbumTab').then(m => ({ default: m.AlbumTab })));

interface DefaultCenterContentProps {
  focus: 'guide' | 'current-activity' | 'album';
}

/**
 * Default center column content based on trip mode
 * - Pre-trip: Guide overview
 * - Active trip: Current/next activity highlight
 * - Post-trip: Album experience
 */
export function DefaultCenterContent({ focus }: DefaultCenterContentProps) {
  switch (focus) {
    case 'guide':
      return (
        <div className="h-full">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[var(--c-line)]">
            <Book className="w-5 h-5 text-[var(--c-pen)]" />
            <h2 className="text-lg font-semibold text-[var(--c-ink)]">Destination Guide</h2>
          </div>
          <Suspense fallback={<GenericSkeleton />}>
            <GuideTab />
          </Suspense>
        </div>
      );

    case 'current-activity':
      return (
        <div className="h-full flex flex-col items-center justify-center text-center p-6">
          <div className="w-16 h-16 bg-[var(--c-pen)]/10 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-[var(--c-pen)]" />
          </div>
          <h2 className="text-lg font-semibold mb-2 text-[var(--c-ink)]">Today's Activities</h2>
          <p className="text-sm text-[var(--c-ink-muted)] max-w-sm">
            Select an activity from the itinerary to see its details, or tap a location on the map.
          </p>
        </div>
      );

    case 'album':
      return (
        <div className="h-full">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[var(--c-line)]">
            <Camera className="w-5 h-5 text-[var(--c-pen)]" />
            <h2 className="text-lg font-semibold text-[var(--c-ink)]">Trip Memories</h2>
          </div>
          <Suspense fallback={<AlbumSkeleton />}>
            <AlbumTab />
          </Suspense>
        </div>
      );

    default:
      return null;
  }
}
