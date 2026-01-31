import { useState, useEffect, lazy, Suspense } from 'react';
import { PinEntry } from '@/components/PinEntry';
import { TripHeader } from '@/components/TripHeader';
import { BottomNav, TabId } from '@/components/BottomNav';
import { SettingsDialog } from '@/components/SettingsDialog';
import { ItineraryTab } from '@/components/ItineraryTab';
import { LodgingTab } from '@/components/LodgingTab';
import { FavoritesTab } from '@/components/FavoritesTab';
import { ContactsTab } from '@/components/ContactsTab';
import { usePin } from '@/hooks/use-trip-data';
import { ITINERARY } from '@/lib/itinerary-data';
import { Loader2 } from 'lucide-react';

// Lazy load heavy components
const MapTab = lazy(() => import('@/components/MapTab'));
const GuideTab = lazy(() => import('@/components/GuideTab'));

function TabLoadingFallback() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('itinerary');
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const { data: pin, isLoading: pinLoading, error: pinError } = usePin();
  
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
  
  // Error state - show default PIN if we can't fetch from database
  const effectivePin = pin || '1475963';
  
  // PIN entry
  if (!isAuthenticated) {
    return (
      <PinEntry 
        correctPin={effectivePin} 
        onSuccess={() => setIsAuthenticated(true)} 
      />
    );
  }
  
  // Main app
  return (
    <div className="min-h-screen bg-background">
      <TripHeader onOpenSettings={() => setSettingsOpen(true)} />
      
      <main className="container px-4 py-4">
        {activeTab === 'itinerary' && <ItineraryTab days={ITINERARY} />}
        {activeTab === 'lodging' && <LodgingTab />}
        {activeTab === 'map' && (
          <Suspense fallback={<TabLoadingFallback />}>
            <MapTab />
          </Suspense>
        )}
        {activeTab === 'guide' && (
          <Suspense fallback={<TabLoadingFallback />}>
            <GuideTab />
          </Suspense>
        )}
        {activeTab === 'favorites' && <FavoritesTab />}
        {activeTab === 'contacts' && <ContactsTab />}
        {activeTab === 'contacts' && <ContactsTab />}
      </main>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      <SettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen}
        currentPin={effectivePin}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default Index;
