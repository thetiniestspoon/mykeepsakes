import { useState, useMemo } from 'react';
import { SettingsDialog } from '@/components/SettingsDialog';
import { HouseAuthGate } from '@/components/auth/HouseAuthGate';
import { supabase } from '@/integrations/supabase/client';
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
import { ItineraryEventCaptureSheet } from '@/components/itinerary/ItineraryEventCaptureSheet';
import { useActiveTrip, getTripMode, useTripDays, getCurrentDayIndex } from '@/hooks/use-trip';
import { CollageRoot } from '@/preview/collage/CollageRoot';

const Index = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [connectionOpen, setConnectionOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);

  const { data: trip } = useActiveTrip();
  const { data: days = [] } = useTripDays(trip?.id);
  const { isWideLayout } = useDashboardMode();

  // Get trip mode for dashboard context
  const tripMode = trip ? getTripMode(trip) : 'pre';

  // Determine current day for reflections/connections
  const currentDayId = useMemo(() => {
    if (!trip || days.length === 0) return undefined;
    const idx = getCurrentDayIndex(trip, days, tripMode);
    return days[idx]?.id;
  }, [trip, days, tripMode]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Wide layout: 3-column grid (landscape/desktop)
  // Narrow layout: Swipeable 3-panel accordion (portrait/mobile)
  return (
    <HouseAuthGate>
      <CollageRoot>
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
            onLogout={handleLogout}
          />

          {/* Conference companion: FAB + capture sheets */}
          {trip && (
            <>
              <ReflectionFAB
                onReflection={() => setReflectionOpen(true)}
                onConnection={() => setConnectionOpen(true)}
                onEvent={() => setEventOpen(true)}
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
              <ItineraryEventCaptureSheet
                open={eventOpen}
                onOpenChange={setEventOpen}
                tripId={trip.id}
                days={days}
                currentDayId={currentDayId}
              />
            </>
          )}
        </DashboardSelectionProvider>
      </CollageRoot>
    </HouseAuthGate>
  );
};

export default Index;
