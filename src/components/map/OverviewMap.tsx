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

// Custom colored marker icons
const createColoredIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
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
  className?: string;
  center?: [number, number];
  zoom?: number;
}

export function OverviewMap({ 
  locations, 
  onMarkerClick,
  className = '',
  center,
  zoom = 13
}: OverviewMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

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

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Map initialized once on mount
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    // Add new markers
    locations.forEach(location => {
      const color = categoryColors[location.category] || categoryColors.activity;
      const icon = createColoredIcon(color);
      
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

    // Fit bounds if we have locations
    if (bounds && locations.length > 1) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30] });
    } else if (locations.length === 1) {
      mapInstanceRef.current.setView([locations[0].lat, locations[0].lng], 15);
    }

    // Invalidate size to handle container changes
    mapInstanceRef.current.invalidateSize();
  }, [locations, bounds, onMarkerClick]);

  return (
    <div 
      ref={mapRef} 
      className={`w-full ${className}`}
      style={{ minHeight: '300px' }}
    />
  );
}
