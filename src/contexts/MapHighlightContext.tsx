import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { TabId } from '@/components/BottomNav';

export interface HighlightedLocation {
  id: string;
  lat: number;
  lng: number;
  name: string;
  address?: string;
  category?: string;
}

interface MapHighlightContextValue {
  highlightedLocation: HighlightedLocation | null;
  setHighlightedLocation: (location: HighlightedLocation | null) => void;
  showOnMap: (location: HighlightedLocation) => void;
  clearHighlight: () => void;
  setActiveTab: (tab: TabId) => void;
}

const MapHighlightContext = createContext<MapHighlightContextValue | null>(null);

interface MapHighlightProviderProps {
  children: ReactNode;
  onTabChange: (tab: TabId) => void;
}

export function MapHighlightProvider({ children, onTabChange }: MapHighlightProviderProps) {
  const [highlightedLocation, setHighlightedLocation] = useState<HighlightedLocation | null>(null);

  const showOnMap = useCallback((location: HighlightedLocation) => {
    setHighlightedLocation(location);
    onTabChange('map');
  }, [onTabChange]);

  const clearHighlight = useCallback(() => {
    setHighlightedLocation(null);
  }, []);

  return (
    <MapHighlightContext.Provider
      value={{
        highlightedLocation,
        setHighlightedLocation,
        showOnMap,
        clearHighlight,
        setActiveTab: onTabChange,
      }}
    >
      {children}
    </MapHighlightContext.Provider>
  );
}

export function useMapHighlight() {
  const context = useContext(MapHighlightContext);
  if (!context) {
    throw new Error('useMapHighlight must be used within a MapHighlightProvider');
  }
  return context;
}

// Optional hook that returns null if not in provider (for components that may be used outside the context)
export function useMapHighlightOptional() {
  return useContext(MapHighlightContext);
}
