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
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
            <Book className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Destination Guide</h2>
          </div>
          <Suspense fallback={<GenericSkeleton />}>
            <GuideTab />
          </Suspense>
        </div>
      );

    case 'current-activity':
      return (
        <div className="h-full flex flex-col items-center justify-center text-center p-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Today's Activities</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Select an activity from the itinerary to see its details, or tap a location on the map.
          </p>
        </div>
      );

    case 'album':
      return (
        <div className="h-full">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
            <Camera className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Trip Memories</h2>
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
