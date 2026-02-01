import { useState, useEffect, lazy, Suspense } from 'react';
import { PinEntry } from '@/components/PinEntry';
import { PinSetup } from '@/components/PinSetup';
import { TripHeader } from '@/components/TripHeader';
import { BottomNav, TabId } from '@/components/BottomNav';
import { SettingsDialog } from '@/components/SettingsDialog';
import { LodgingTab } from '@/components/LodgingTab';
import { FavoritesTab } from '@/components/FavoritesTab';
import { ContactsTab } from '@/components/ContactsTab';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AnimatedTabContent } from '@/components/ui/animated-tabs';
import { ItinerarySkeleton, MapSkeleton, AlbumSkeleton, GenericSkeleton } from '@/components/LoadingSkeletons';
import { usePin } from '@/hooks/use-trip-data';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

// Lazy load heavy components
const DatabaseMapTab = lazy(() => import('@/components/DatabaseMapTab'));
const GuideTab = lazy(() => import('@/components/GuideTab'));
const DatabaseItineraryTab = lazy(() => import('@/components/DatabaseItineraryTab'));
const AlbumTab = lazy(() => import('@/components/album/AlbumTab').then(m => ({ default: m.AlbumTab })));

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('itinerary');
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const { data: pin, isLoading: pinLoading } = usePin();
  const queryClient = useQueryClient();
  
  // Check for existing session
  useEffect(() => {
    const authenticated = sessionStorage.getItem('ptown-authenticated') === 'true';
    setIsAuthenticated(authenticated);
  }, []);
  
  const handleLogout = () => {
    setIsAuthenticated(false);
  };
  
  // Loading state
  if (pinLoading) {
    return (
      <div className="min-h-screen bg-beach-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your trip planner...</p>
        </div>
      </div>
    );
  }
  
  // First-time setup - no PIN exists
  if (!pin) {
    return (
      <PinSetup 
        onComplete={() => queryClient.invalidateQueries({ queryKey: ['pin'] })} 
      />
    );
  }
  
  // PIN entry
  if (!isAuthenticated) {
    return (
      <PinEntry 
        correctPin={pin} 
        onSuccess={() => setIsAuthenticated(true)} 
      />
    );
  }
  
  // Main app
  return (
    <div className="min-h-screen bg-background">
      <TripHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <main className="container px-4 py-4">
        <ErrorBoundary>
          <AnimatedTabContent activeTab={activeTab}>
            {activeTab === 'itinerary' && (
              <Suspense fallback={<ItinerarySkeleton />}>
                <DatabaseItineraryTab />
              </Suspense>
            )}
            {activeTab === 'lodging' && <LodgingTab />}
            {activeTab === 'map' && (
              <Suspense fallback={<MapSkeleton />}>
                <DatabaseMapTab />
              </Suspense>
            )}
            {activeTab === 'guide' && (
              <Suspense fallback={<GenericSkeleton />}>
                <GuideTab />
              </Suspense>
            )}
            {activeTab === 'album' && (
              <Suspense fallback={<AlbumSkeleton />}>
                <AlbumTab />
              </Suspense>
            )}
            {activeTab === 'favorites' && <FavoritesTab />}
            {activeTab === 'contacts' && <ContactsTab />}
          </AnimatedTabContent>
        </ErrorBoundary>
      </main>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      <SettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen}
        currentPin={pin}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default Index;
