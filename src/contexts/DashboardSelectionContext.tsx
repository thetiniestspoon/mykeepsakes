import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { TripMode, ItineraryItem, Location, Memory } from '@/types/trip';
import type { MapLocation } from '@/types/map';

// Selection types for different entities
export type SelectionType = 'activity' | 'location' | 'guide' | 'photo' | 'accommodation' | 'album' | 'stay' | 'packing' | 'people';

export interface SelectedItem {
  type: SelectionType;
  id: string;
  data: ItineraryItem | Location | Memory | MapLocation | { section: string } | null;
}

interface PanTarget {
  lat: number;
  lng: number;
}

/** Focus object containing location ID and optional category/day for specific filtering */
export interface FocusedLocation {
  id: string;
  /** e.g., "dining", "beach", "activity" */
  category?: string;
  /** e.g., "day-uuid-123" */
  dayId?: string;
}

interface DashboardSelectionState {
  /** Currently selected item in the dashboard */
  selectedItem: SelectedItem | null;
  /** Location IDs to highlight on the map (array for multi-pin support) */
  highlightedMapPins: string[];
  /** Label for highlighted pins group (e.g., "Friday - Beach Day") */
  highlightLabel: string | null;
  /** Target coordinates for map panning */
  panToLocation: PanTarget | null;
  /** Current trip mode (pre/active/post) - drives default focus */
  tripMode: TripMode;
  /** Location to focus on (triggers specific filter set in MapFilterHeader) */
  focusedLocation: FocusedLocation | null;
}

interface DashboardSelectionActions {
  /** Select an item - syncs across all columns */
  selectItem: (type: SelectionType, id: string, data?: SelectedItem['data']) => void;
  /** Clear current selection */
  clearSelection: () => void;
  /** Highlight a specific pin on the map (backward compatible - wraps single ID in array) */
  highlightPin: (locationId: string | null) => void;
  /** Highlight multiple pins on the map with a group label */
  highlightPins: (locationIds: string[], label: string) => void;
  /** Clear all highlighted pins */
  clearHighlightedPins: () => void;
  /** Pan the map to specific coordinates */
  panMap: (lat: number, lng: number) => void;
  /** Clear the pan target (after map has panned) */
  clearPanTarget: () => void;
  /** Set the trip mode */
  setTripMode: (mode: TripMode) => void;
  /** Scroll a specific item into view in the left column */
  scrollToItem: (itemId: string) => void;
  /** Register a scroll handler for the left column */
  registerScrollHandler: (handler: (itemId: string) => void) => () => void;
  /** Navigate to a specific panel (0=Itinerary, 1=Details, 2=Map) */
  navigateToPanel: (index: 0 | 1 | 2) => void;
  /** Register panel navigator (used by SwipeableDashboard) */
  registerPanelNavigator: (handler: (index: number) => void) => () => void;
  /** Focus on a specific location (sets map filters to show its category/day) */
  focusLocation: (focus: FocusedLocation) => void;
  /** Clear the focused location after filters have been reset */
  clearLocationFocus: () => void;
}

interface DashboardSelectionContextValue extends DashboardSelectionState, DashboardSelectionActions {
  /** Default focus based on trip mode */
  defaultFocus: 'guide' | 'current-activity' | 'album';
}

const DashboardSelectionContext = createContext<DashboardSelectionContextValue | null>(null);

interface DashboardSelectionProviderProps {
  children: React.ReactNode;
  initialTripMode?: TripMode;
}

export function DashboardSelectionProvider({ 
  children, 
  initialTripMode = 'pre' 
}: DashboardSelectionProviderProps) {
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [highlightedMapPins, setHighlightedMapPins] = useState<string[]>([]);
  const [highlightLabel, setHighlightLabel] = useState<string | null>(null);
  const [panToLocation, setPanToLocation] = useState<PanTarget | null>(null);
  const [tripMode, setTripMode] = useState<TripMode>(initialTripMode);
  const [focusedLocation, setFocusedLocation] = useState<FocusedLocation | null>(null);
  
  // Scroll handler for left column synchronization
  const scrollHandlerRef = useRef<((itemId: string) => void) | null>(null);
  // Panel navigator for swipeable dashboard
  const panelNavigatorRef = useRef<((index: number) => void) | null>(null);

  // Update trip mode when prop changes
  useEffect(() => {
    setTripMode(initialTripMode);
  }, [initialTripMode]);

  // Compute default focus based on trip mode
  const defaultFocus = useMemo(() => {
    switch (tripMode) {
      case 'pre':
        return 'guide' as const;
      case 'active':
        return 'current-activity' as const;
      case 'post':
        return 'album' as const;
      default:
        return 'guide' as const;
    }
  }, [tripMode]);

  const selectItem = useCallback((type: SelectionType, id: string, data?: SelectedItem['data']) => {
    setSelectedItem({ type, id, data: data ?? null });
    
    // Auto-highlight map pin for location-related selections
    if (type === 'location' || type === 'activity') {
      // Extract location ID based on selection type
      if (type === 'location') {
        setHighlightedMapPins([id]);
        setHighlightLabel(null);
      } else if (data && 'location_id' in data && data.location_id) {
        setHighlightedMapPins([data.location_id]);
        setHighlightLabel(null);
      } else if (data && 'location' in data && data.location) {
        setHighlightedMapPins([(data.location as Location).id]);
        setHighlightLabel(null);
      }
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItem(null);
    setHighlightedMapPins([]);
    setHighlightLabel(null);
  }, []);

  // Single pin (backward compatible - wraps into array)
  const highlightPin = useCallback((locationId: string | null) => {
    if (locationId) {
      setHighlightedMapPins([locationId]);
      setHighlightLabel(null);
    } else {
      setHighlightedMapPins([]);
      setHighlightLabel(null);
    }
  }, []);

  // Multiple pins with label
  const highlightPins = useCallback((locationIds: string[], label: string) => {
    setHighlightedMapPins(locationIds);
    setHighlightLabel(label);
  }, []);

  // Clear all highlighted pins
  const clearHighlightedPins = useCallback(() => {
    setHighlightedMapPins([]);
    setHighlightLabel(null);
  }, []);

  const panMap = useCallback((lat: number, lng: number) => {
    setPanToLocation({ lat, lng });
  }, []);

  const clearPanTarget = useCallback(() => {
    setPanToLocation(null);
  }, []);

  const scrollToItem = useCallback((itemId: string) => {
    if (scrollHandlerRef.current) {
      scrollHandlerRef.current(itemId);
    }
  }, []);

  const registerScrollHandler = useCallback((handler: (itemId: string) => void) => {
    scrollHandlerRef.current = handler;
    return () => {
      scrollHandlerRef.current = null;
    };
  }, []);

  const navigateToPanel = useCallback((index: 0 | 1 | 2) => {
    if (panelNavigatorRef.current) {
      panelNavigatorRef.current(index);
    }
  }, []);

  const registerPanelNavigator = useCallback((handler: (index: number) => void) => {
    panelNavigatorRef.current = handler;
    return () => {
      panelNavigatorRef.current = null;
    };
  }, []);

  const focusLocation = useCallback((focus: FocusedLocation) => {
    setFocusedLocation(focus);
  }, []);

  const clearLocationFocus = useCallback(() => {
    setFocusedLocation(null);
  }, []);

  const value = useMemo<DashboardSelectionContextValue>(() => ({
    // State
    selectedItem,
    highlightedMapPins,
    highlightLabel,
    panToLocation,
    tripMode,
    defaultFocus,
    focusedLocation,
    // Actions
    selectItem,
    clearSelection,
    highlightPin,
    highlightPins,
    clearHighlightedPins,
    panMap,
    clearPanTarget,
    setTripMode,
    scrollToItem,
    registerScrollHandler,
    navigateToPanel,
    registerPanelNavigator,
    focusLocation,
    clearLocationFocus,
  }), [
    selectedItem,
    highlightedMapPins,
    highlightLabel,
    panToLocation,
    tripMode,
    defaultFocus,
    focusedLocation,
    selectItem,
    clearSelection,
    highlightPin,
    highlightPins,
    clearHighlightedPins,
    panMap,
    clearPanTarget,
    scrollToItem,
    registerScrollHandler,
    navigateToPanel,
    registerPanelNavigator,
    focusLocation,
    clearLocationFocus,
  ]);

  return (
    <DashboardSelectionContext.Provider value={value}>
      {children}
    </DashboardSelectionContext.Provider>
  );
}

export function useDashboardSelection(): DashboardSelectionContextValue {
  const context = useContext(DashboardSelectionContext);
  if (!context) {
    throw new Error('useDashboardSelection must be used within DashboardSelectionProvider');
  }
  return context;
}

// Optional hook for components that may or may not be within the dashboard
export function useDashboardSelectionOptional(): DashboardSelectionContextValue | null {
  return useContext(DashboardSelectionContext);
}
