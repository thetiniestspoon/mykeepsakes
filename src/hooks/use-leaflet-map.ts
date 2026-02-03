import { useRef, useState, useEffect, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Configure default icon (only needs to happen once)
delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export interface UseLeafletMapOptions {
  center: [number, number];
  zoom: number;
  enabled: boolean;
  markerPopup?: string;
  onReady?: () => void;
  debug?: boolean;
}

export interface UseLeafletMapResult {
  map: L.Map | null;
  marker: L.Marker | null;
  isReady: boolean;
  error: string | null;
  updateView: (lat: number, lng: number, zoom?: number) => void;
  updateMarker: (lat: number, lng: number, popupContent?: string) => void;
}

export function useLeafletMap(
  containerRef: React.RefObject<HTMLDivElement>,
  options: UseLeafletMapOptions
): UseLeafletMapResult {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store options in ref to avoid stale closures
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const logDebug = useCallback((message: string, data?: unknown) => {
    if (import.meta.env.DEV && optionsRef.current.debug) {
      console.log(`[LeafletMap] ${message}`, data ?? '');
    }
  }, []);

  const initializeMap = useCallback(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const { center, zoom, markerPopup, onReady } = optionsRef.current;
    
    logDebug('Initializing map at', center);

    try {
      const map = L.map(container, {
        center,
        zoom,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      // Add marker if popup content provided
      if (markerPopup) {
        const marker = L.marker(center).addTo(map);
        marker.bindPopup(markerPopup).openPopup();
        markerRef.current = marker;
      }

      mapRef.current = map;
      setIsReady(true);
      setError(null);

      // Final size invalidation after paint
      requestAnimationFrame(() => {
        map.invalidateSize();
      });

      onReady?.();
      logDebug('Map ready');

    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      setError(errorMsg);
      logDebug('Map initialization failed', e);
    }
  }, [containerRef, logDebug]);

  const cleanupMap = useCallback(() => {
    if (mapRef.current) {
      logDebug('Cleanup triggered');
      try {
        mapRef.current.remove();
      } catch (e) {
        logDebug('Cleanup error (non-fatal)', e);
      }
      mapRef.current = null;
      markerRef.current = null;
      setIsReady(false);
    }
  }, [logDebug]);

  // ResizeObserver to detect when container has valid dimensions
  // AND continue monitoring for size changes after initialization
  useEffect(() => {
    if (!options.enabled) {
      logDebug('Map disabled, skipping observation');
      return;
    }
    
    if (!containerRef.current) {
      logDebug('containerRef.current is null - Dialog may not have mounted yet');
      return;
    }

    logDebug('Starting container observation', {
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight
    });

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      logDebug('Container dimensions', { width, height });

      if (width > 0 && height > 0) {
        if (!mapRef.current) {
          // Initialize map when container has valid dimensions
          requestAnimationFrame(() => {
            initializeMap();
          });
        } else {
          // Map already exists - invalidate size on container resize
          // This handles dialog animations completing after map init
          requestAnimationFrame(() => {
            mapRef.current?.invalidateSize();
            logDebug('invalidateSize called after resize');
          });
        }
      }
    });

    observer.observe(containerRef.current);

    return () => {
      logDebug('Stopping container observation');
      observer.disconnect();
    };
  }, [options.enabled, containerRef, initializeMap, logDebug]);

  // Fallback timer for slow animations - ensures invalidateSize runs
  // after typical dialog animation duration (300ms)
  useEffect(() => {
    if (!options.enabled || !mapRef.current) {
      return;
    }

    logDebug('Setting fallback invalidateSize timer');
    
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
        logDebug('Fallback invalidateSize executed');
      }
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [options.enabled, logDebug]);

  // Cleanup when disabled
  useEffect(() => {
    if (!options.enabled && mapRef.current) {
      logDebug('Disabling map');
      cleanupMap();
    }
  }, [options.enabled, cleanupMap, logDebug]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMap();
    };
  }, [cleanupMap]);

  const updateView = useCallback((lat: number, lng: number, zoom?: number) => {
    if (mapRef.current) {
      logDebug('Updating view', { lat, lng, zoom });
      mapRef.current.setView([lat, lng], zoom ?? mapRef.current.getZoom());
    }
  }, [logDebug]);

  const updateMarker = useCallback((lat: number, lng: number, popupContent?: string) => {
    if (markerRef.current) {
      logDebug('Updating marker', { lat, lng });
      markerRef.current.setLatLng([lat, lng]);
      if (popupContent) {
        markerRef.current.setPopupContent(popupContent);
      }
    }
  }, [logDebug]);

  return {
    map: mapRef.current,
    marker: markerRef.current,
    isReady,
    error,
    updateView,
    updateMarker,
  };
}
