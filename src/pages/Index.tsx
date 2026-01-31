import { useState, useEffect } from 'react';
import { PinEntry } from '@/components/PinEntry';
import { TripHeader } from '@/components/TripHeader';
import { BottomNav, TabId } from '@/components/BottomNav';
import { SettingsDialog } from '@/components/SettingsDialog';
import { ItineraryTab } from '@/components/ItineraryTab';
import { MapTab } from '@/components/MapTab';
import { GuideTab } from '@/components/GuideTab';
import { FavoritesTab } from '@/components/FavoritesTab';
import { ContactsTab } from '@/components/ContactsTab';
import { usePin } from '@/hooks/use-trip-data';
import { ITINERARY } from '@/lib/itinerary-data';
import { Loader2 } from 'lucide-react';

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
        {activeTab === 'map' && <MapTab />}
        {activeTab === 'guide' && <GuideTab />}
        {activeTab === 'favorites' && <FavoritesTab />}
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
