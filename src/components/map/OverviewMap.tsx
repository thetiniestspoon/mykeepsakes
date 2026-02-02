import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapLocation } from '@/types/map';

// Fix for default marker icons in Leaflet with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Delete internal method to fix icon paths with bundlers
delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export type { MapLocation };

// Custom colored marker icons with state indicators and animations
const createColoredIcon = (color: string, pinState?: string, index?: number) => {
  // Determine ring/badge based on state
  let ringStyle = '';
  let badgeHtml = '';
  let glowClass = '';
  
  if (pinState === 'highlighted') {
    ringStyle = 'border: 4px solid #3B82F6;'; // blue ring for highlighted
    glowClass = 'marker-glow-highlight';
  } else if (pinState === 'has-memories') {
    ringStyle = 'border: 3px solid #EC4899;'; // pink ring for memories
    badgeHtml = `<div style="position: absolute; top: -4px; right: -4px; width: 12px; height: 12px; background: #EC4899; border-radius: 50%; border: 2px solid white;"></div>`;
    glowClass = 'marker-glow-memory';
  } else if (pinState === 'favorited') {
    ringStyle = 'border: 3px solid #F59E0B;'; // gold ring for favorites
    badgeHtml = `<div style="position: absolute; top: -4px; right: -4px; width: 12px; height: 12px; background: #F59E0B; border-radius: 50%; border: 2px solid white;"></div>`;
  } else if (pinState === 'visited') {
    ringStyle = 'border: 3px solid #10B981;'; // green ring for visited
    badgeHtml = `<div style="position: absolute; top: -4px; right: -4px; width: 12px; height: 12px; background: #10B981; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center;">
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
    </div>`;
  } else {
    ringStyle = 'border: 3px solid white;';
  }

  // Add animation delay based on index for staggered drop-in
  const animationDelay = index !== undefined ? `animation-delay: ${index * 50}ms;` : '';

  return L.divIcon({
    className: `custom-marker ${glowClass}`,
    html: `
      <div style="position: relative;" class="marker-container">
        <div class="marker-pin" style="
          background-color: ${color};
          width: 28px;
          height: 28px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          ${ringStyle}
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: markerDropIn 0.5s ease-out forwards;
          opacity: 0;
          ${animationDelay}
        ">
          <div style="
            width: 10px;
            height: 10px;
            background: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
        ${badgeHtml}
      </div>
      <style>
        @keyframes markerDropIn {
          0% { transform: translateY(-40px) rotate(-45deg); opacity: 0; }
          60% { transform: translateY(5px) rotate(-45deg); opacity: 1; }
          80% { transform: translateY(-3px) rotate(-45deg); }
          100% { transform: translateY(0) rotate(-45deg); opacity: 1; }
        }
        .marker-container:hover .marker-pin {
          transform: translateY(-4px) rotate(-45deg);
          box-shadow: 0 6px 12px rgba(0,0,0,0.3);
          transition: all 0.15s ease-out;
        }
        .marker-glow-memory .marker-pin {
          animation: markerDropIn 0.5s ease-out forwards, glowPulse 2s ease-in-out infinite 0.5s;
        }
        .marker-glow-highlight .marker-pin {
          animation: markerDropIn 0.3s ease-out forwards, highlightPulse 1s ease-in-out infinite 0.3s;
          transform: scale(1.15) rotate(-45deg) !important;
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 5px 2px rgba(236, 72, 153, 0.3), 0 2px 6px rgba(0,0,0,0.3); }
          50% { box-shadow: 0 0 15px 5px rgba(236, 72, 153, 0.5), 0 2px 6px rgba(0,0,0,0.3); }
        }
        @keyframes highlightPulse {
          0%, 100% { box-shadow: 0 0 8px 3px rgba(59, 130, 246, 0.4), 0 2px 6px rgba(0,0,0,0.3); }
          50% { box-shadow: 0 0 20px 8px rgba(59, 130, 246, 0.6), 0 2px 6px rgba(0,0,0,0.3); }
        }
      </style>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

// Category colors
const categoryColors: Record<string, string> = {
  beach: '#47D3CB',     // seafoam
  dining: '#FF8366',    // coral
  restaurant: '#FF8366', // coral
  activity: '#3B82F6',  // blue
  accommodation: '#A855F7', // purple
  transport: '#6B7280', // gray
  event: '#F59E0B',     // gold
  lodging: '#EC4899',   // pink
};

// MapLocation interface is now imported from @/types/map

interface OverviewMapProps {
  locations: MapLocation[];
  onMarkerClick?: (location: MapLocation) => void;
  /** Array of location IDs to highlight (supports multi-pin highlighting) */
  highlightedPinIds?: string[];
  className?: string;
  center?: [number, number];
  zoom?: number;
  /** Callback when map instance is ready */
  onMapReady?: (map: L.Map) => void;
  /** Skip automatic bounds fitting (e.g., when manually panning) */
  skipBoundsFit?: boolean;
}

export function OverviewMap({ 
  locations, 
  onMarkerClick,
  highlightedPinIds = [],
  className = '',
  center,
  zoom = 13,
  onMapReady,
  skipBoundsFit = false,
}: OverviewMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const prevLocationIdsRef = useRef<string>('');
  const prevHighlightedPinsRef = useRef<string>('');

  // Calculate bounds from locations
  const bounds = useMemo(() => {
    if (locations.length === 0) return null;
    const lats = locations.map(l => l.lat);
    const lngs = locations.map(l => l.lng);
    return L.latLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );
  }, [locations]);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const defaultCenter: [number, number] = center || [42.0584, -70.1836]; // Provincetown
    const map = L.map(mapRef.current).setView(defaultCenter, zoom);
    mapInstanceRef.current = map;

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);

    // Notify parent when map is ready
    onMapReady?.(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Map initialized once on mount
  }, []);

  // Update markers when locations change - with diffing to prevent unnecessary re-renders
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    // Check if locations actually changed by comparing IDs
    const newIds = locations.map(l => l.id).sort().join(',');
    const idsChanged = newIds !== prevLocationIdsRef.current;
    const newHighlightIds = highlightedPinIds.sort().join(',');
    const highlightChanged = newHighlightIds !== prevHighlightedPinsRef.current;
    
    // Skip if nothing actually changed
    if (!idsChanged && !highlightChanged) {
      return;
    }
    
    prevLocationIdsRef.current = newIds;
    prevHighlightedPinsRef.current = newHighlightIds;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    // Add new markers with staggered animation
    locations.forEach((location, index) => {
      const isHighlighted = highlightedPinIds.includes(location.id);
      const color = categoryColors[location.category] || categoryColors.activity;
      const pinState = isHighlighted ? 'highlighted' : location.pinState;
      const icon = createColoredIcon(color, pinState, index);
      
      const marker = L.marker([location.lat, location.lng], { icon })
        .bindPopup(`
          <div style="min-width: 150px;">
            <strong>${location.name}</strong>
            ${location.dayLabel ? `<br/><span style="color: #666; font-size: 0.85em;">${location.dayLabel}</span>` : ''}
            ${location.address ? `<br/><span style="color: #888; font-size: 0.85em;">${location.address}</span>` : ''}
          </div>
        `);

      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(location));
      }

      markersLayerRef.current!.addLayer(marker);
    });

    // Fit bounds if we have locations (unless skipped for manual panning)
    if (!skipBoundsFit) {
      if (bounds && locations.length > 1) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30] });
      } else if (locations.length === 1) {
        mapInstanceRef.current.setView([locations[0].lat, locations[0].lng], 15);
      }
    }

    // Invalidate size to handle container changes
    mapInstanceRef.current.invalidateSize();
  }, [locations, bounds, onMarkerClick, highlightedPinIds, skipBoundsFit]);

  return (
    <div 
      ref={mapRef} 
      className={`w-full ${className}`}
      style={{ minHeight: '300px' }}
    />
  );
}
