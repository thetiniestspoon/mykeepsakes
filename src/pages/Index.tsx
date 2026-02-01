import { useState, useEffect } from 'react';
import { PinEntry } from '@/components/PinEntry';
import { PinSetup } from '@/components/PinSetup';
import { SettingsDialog } from '@/components/SettingsDialog';
import { usePin } from '@/hooks/use-trip-data';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useDashboardMode } from '@/hooks/use-dashboard-mode';
import { DashboardSelectionProvider } from '@/contexts/DashboardSelectionContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SwipeableDashboard } from '@/components/dashboard/SwipeableDashboard';
import { LeftColumn } from '@/components/dashboard/LeftColumn';
import { CenterColumn } from '@/components/dashboard/CenterColumn';
import { RightColumn } from '@/components/dashboard/RightColumn';
import { CompactHeader } from '@/components/dashboard/CompactHeader';
import { useActiveTrip, getTripMode } from '@/hooks/use-trip';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const { data: pin, isLoading: pinLoading } = usePin();
  const { data: trip } = useActiveTrip();
  const { isWideLayout } = useDashboardMode();
  const queryClient = useQueryClient();
  
  // Get trip mode for dashboard context
  const tripMode = trip ? getTripMode(trip) : 'pre';
  
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
  
  // Wide layout: 3-column grid (landscape/desktop)
  // Narrow layout: Swipeable 3-panel accordion (portrait/mobile)
  return (
    <DashboardSelectionProvider initialTripMode={tripMode}>
      {isWideLayout ? (
        <DashboardLayout
          header={<CompactHeader onOpenSettings={() => setSettingsOpen(true)} />}
          leftColumn={<LeftColumn />}
          centerColumn={<CenterColumn />}
          rightColumn={<RightColumn />}
        />
      ) : (
        <SwipeableDashboard
          header={<CompactHeader onOpenSettings={() => setSettingsOpen(true)} />}
          leftColumn={<LeftColumn />}
          centerColumn={<CenterColumn />}
          rightColumn={<RightColumn />}
        />
      )}
      
      <SettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen}
        currentPin={pin}
        onLogout={handleLogout}
      />
    </DashboardSelectionProvider>
  );
};

export default Index;
