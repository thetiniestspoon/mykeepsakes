import { useState, useEffect, useMemo } from 'react';
import { PinEntry } from '@/components/PinEntry';
import { PinSetup } from '@/components/PinSetup';
import { SettingsDialog } from '@/components/SettingsDialog';
import { usePin } from '@/hooks/use-trip-data';
import { isHashedPin } from '@/lib/emoji-pin';
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
import { ReflectionFAB } from '@/components/reflection/ReflectionFAB';
import { ReflectionCaptureSheet } from '@/components/reflection/ReflectionCaptureSheet';
import { ConnectionCaptureSheet } from '@/components/connections/ConnectionCaptureSheet';
import { useActiveTrip, getTripMode, useTripDays, getCurrentDayIndex } from '@/hooks/use-trip';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [connectionOpen, setConnectionOpen] = useState(false);

  const { data: pin, isLoading: pinLoading } = usePin();
  const { data: trip } = useActiveTrip();
  const { data: days = [] } = useTripDays(trip?.id);
  const { isWideLayout } = useDashboardMode();
  const queryClient = useQueryClient();

  // Get trip mode for dashboard context
  const tripMode = trip ? getTripMode(trip) : 'pre';

  // Determine current day for reflections/connections
  const currentDayId = useMemo(() => {
    if (!trip || days.length === 0) return undefined;
    const idx = getCurrentDayIndex(trip, days, tripMode);
    return days[idx]?.id;
  }, [trip, days, tripMode]);
  
  // Check for existing session
  useEffect(() => {
    const authenticated = sessionStorage.getItem('mk-authenticated') === 'true';
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
  
  // First-time setup OR migration from old plaintext PIN
  // Old plaintext PINs (e.g. '1475963') are not 64-char hex hashes
  const needsSetup = !pin || !isHashedPin(pin);

  if (needsSetup) {
    return (
      <PinSetup
        onComplete={() => queryClient.invalidateQueries({ queryKey: ['pin'] })}
      />
    );
  }

  // PIN entry — pin is guaranteed to be a valid hash here
  if (!isAuthenticated) {
    return (
      <PinEntry
        storedHash={pin}
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

      {/* Conference companion: FAB + capture sheets */}
      {trip && (
        <>
          <ReflectionFAB
            onReflection={() => setReflectionOpen(true)}
            onConnection={() => setConnectionOpen(true)}
          />
          <ReflectionCaptureSheet
            open={reflectionOpen}
            onOpenChange={setReflectionOpen}
            tripId={trip.id}
            days={days}
            currentDayId={currentDayId}
          />
          <ConnectionCaptureSheet
            open={connectionOpen}
            onOpenChange={setConnectionOpen}
            tripId={trip.id}
            currentDayId={currentDayId}
          />
        </>
      )}
    </DashboardSelectionProvider>
  );
};

export default Index;
