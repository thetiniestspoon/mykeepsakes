import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@/preview/collage/collage.css';
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

/**
 * Collage-migrated OverviewMap (Phase 4 #6).
 * Leaflet setup + bounds-fit + drag-to-move + long-press + click handlers are all preserved.
 * Only the presentation changed: CartoDB Voyager base tiles with a sepia/saturation wash,
 * and DivIcon-based Collage pins (ink body, pen-blue ring when highlighted, tape-yellow for
 * favorited, sage for visited, pink for has-memories). Pointer-stem at the pin anchor keeps
 * positional accuracy while the ink-bordered head reads as a hand-drawn marker.
 */

// Category colors — mapped to the Collage token palette so pins sit under the same palette
// as the rest of the app. These are the body-fill of the pin head.
const categoryColors: Record<string, string> = {
  beach: '#5b7fa8',        // sky
  dining: '#C27814',       // warn / ochre
  restaurant: '#C27814',   // ochre
  activity: '#1F3CC6',     // pen-blue
  accommodation: '#4A4843',// ink-muted
  transport: '#6B7280',    // neutral
  event: '#F6D55C',        // tape-yellow
  lodging: '#8ba66e',      // sage
};

// Category stamp labels (for the pin's small overline text)
const categoryLabels: Record<string, string> = {
  beach: 'beach',
  dining: 'dining',
  restaurant: 'dining',
  activity: 'stop',
  accommodation: 'stay',
  transport: 'transit',
  event: 'event',
  lodging: 'lodging',
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string)
  );
}

// Collage-styled DivIcon. Parameters:
//  - color: body fill (category color)
//  - pinState: affects the surrounding ring / badge
//  - index: deterministic rotation seed so each pin tilts a little differently
//  - name/categoryLabel: rendered as overline + handwritten script
const createCollageIcon = (
  color: string,
  pinState: string | undefined,
  index: number,
  name: string,
  catLabel: string,
) => {
  let ringColor = 'var(--c-ink)';
  let badgeHtml = '';
  let glowClass = '';

  if (pinState === 'highlighted') {
    ringColor = 'var(--c-pen)';
    glowClass = 'collage-pin-glow-pen';
  } else if (pinState === 'has-memories') {
    ringColor = '#A83232';
    badgeHtml = `<span class="collage-pin-badge" style="background:#A83232;" aria-hidden="true"></span>`;
    glowClass = 'collage-pin-glow-ink';
  } else if (pinState === 'favorited') {
    ringColor = 'var(--c-tape)';
    badgeHtml = `<span class="collage-pin-badge" style="background:var(--c-tape);" aria-hidden="true"></span>`;
  } else if (pinState === 'visited') {
    ringColor = '#3C7A4E';
    badgeHtml = `<span class="collage-pin-badge" style="background:#3C7A4E; display:flex; align-items:center; justify-content:center;">
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
    </span>`;
  }

  const rotateSeed = ((name.charCodeAt(0) || 0) + name.length) % 10;
  const rotate = (rotateSeed - 5) * 0.9; // -4.5..+4.5 degrees
  const label = name.length > 22 ? name.slice(0, 21).trim() + '…' : name;

  const html = `
    <div class="collage-pin ${glowClass}" style="transform: rotate(${rotate}deg); --pin-color:${color}; --pin-ring:${ringColor}; animation-delay:${index * 40}ms;">
      <div class="collage-pin-card">
        <div class="collage-pin-cat">${escapeHtml(catLabel)}</div>
        <div class="collage-pin-name">${escapeHtml(label)}</div>
      </div>
      <div class="collage-pin-stem" aria-hidden="true"></div>
      ${badgeHtml}
    </div>
  `;

  return L.divIcon({
    className: 'collage-pin-wrap',
    html,
    iconSize: [170, 74],
    iconAnchor: [85, 74],
    popupAnchor: [0, -74],
  });
};

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
  /** Callback when a location is dragged to a new position */
  onLocationDrag?: (locationId: string, newLat: number, newLng: number) => void;
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
  onLocationDrag,
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

    const defaultCenter: [number, number] = center || [41.8505, -87.9357]; // Oak Brook, IL
    const map = L.map(mapRef.current).setView(defaultCenter, zoom);
    mapInstanceRef.current = map;

    // CartoDB Voyager tiles — the Collage "field notebook" base layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: ['a', 'b', 'c', 'd'],
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>'
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
      const catLabel = categoryLabels[location.category] || 'stop';
      const pinState = isHighlighted ? 'highlighted' : location.pinState;
      const icon = createCollageIcon(color, pinState, index, location.name, catLabel);

      // Create marker (starts as non-draggable)
      const marker = L.marker([location.lat, location.lng], {
        icon,
        draggable: false
      }).bindPopup(`
          <div style="min-width: 150px; font-family: 'IBM Plex Serif', Georgia, serif;">
            <strong style="font-family: 'IBM Plex Serif', Georgia, serif;">${escapeHtml(location.name)}</strong>
            ${location.dayLabel ? `<br/><span style="color: #4A4843; font-size: 0.85em;">${escapeHtml(location.dayLabel)}</span>` : ''}
            ${location.address ? `<br/><span style="color: #4A4843; font-size: 0.85em;">${escapeHtml(location.address)}</span>` : ''}
          </div>
        `);

      // Long-press detection for drag-to-move
      let longPressTimer: ReturnType<typeof setTimeout> | null = null;
      let isDragging = false;

      const startLongPress = () => {
        longPressTimer = setTimeout(() => {
          // Enable dragging after 500ms hold
          marker.dragging?.enable();
          isDragging = true;

          // Visual feedback - add "dragging" class
          const el = marker.getElement();
          el?.classList.add('collage-pin-dragging');

          // Disable map dragging while moving pin
          mapInstanceRef.current?.dragging.disable();
          mapInstanceRef.current?.touchZoom.disable();
        }, 500);
      };

      const cancelLongPress = () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      };

      // Mouse/touch events for long-press detection
      marker.on('mousedown', startLongPress);
      marker.on('touchstart', startLongPress);
      marker.on('mouseup', cancelLongPress);
      marker.on('mouseleave', cancelLongPress);
      marker.on('touchend', () => {
        cancelLongPress();
        // If we were dragging, re-enable map after a short delay
        if (isDragging) {
          setTimeout(() => {
            mapInstanceRef.current?.dragging.enable();
            mapInstanceRef.current?.touchZoom.enable();
          }, 100);
        }
      });
      marker.on('touchcancel', cancelLongPress);

      // Handle drag end - save new position
      marker.on('dragend', () => {
        if (!isDragging) return;

        const newLatLng = marker.getLatLng();

        // Disable dragging again
        marker.dragging?.disable();
        isDragging = false;

        // Re-enable map dragging
        mapInstanceRef.current?.dragging.enable();
        mapInstanceRef.current?.touchZoom.enable();

        // Remove visual feedback
        const el = marker.getElement();
        el?.classList.remove('collage-pin-dragging');

        // Call callback with new position
        onLocationDrag?.(location.id, newLatLng.lat, newLatLng.lng);
      });

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
  }, [locations, bounds, onMarkerClick, highlightedPinIds, skipBoundsFit, onLocationDrag]);

  return (
    <div
      ref={mapRef}
      className={`collage-mapframe w-full ${className}`}
      style={{ minHeight: '300px' }}
    />
  );
}

// Scoped Collage pin + map styles. Injected once at module import.
// Keeps all presentational rules colocated with the component.
if (typeof document !== 'undefined' && !document.getElementById('collage-mapframe-styles')) {
  const style = document.createElement('style');
  style.id = 'collage-mapframe-styles';
  style.textContent = `
    /* Sepia wash on tiles so the map reads as part of the Collage palette */
    .collage-mapframe .leaflet-tile-pane {
      filter: sepia(0.18) saturate(0.88) contrast(1.02);
    }
    .collage-mapframe .leaflet-control-attribution {
      background: rgba(247, 243, 233, 0.85) !important;
      font-family: 'IBM Plex Serif', Georgia, serif;
      font-size: 10px;
      color: #4A4843;
    }
    .collage-mapframe .leaflet-control-attribution a { color: #1F3CC6; }
    .collage-mapframe .leaflet-bar a {
      background: #FFFFFF;
      color: #1D1D1B;
      border-color: #1D1D1B;
      font-family: 'Rubik Mono One', system-ui, sans-serif;
    }
    .collage-mapframe .leaflet-bar a:hover { background: #F6D55C; }
    .collage-mapframe .leaflet-popup-content-wrapper {
      background: #FFFFFF;
      border: 1.5px solid #1D1D1B;
      border-radius: 2px;
      box-shadow: 0 8px 24px -6px rgba(29,29,27,.22);
    }
    .collage-mapframe .leaflet-popup-tip { background: #FFFFFF; border: 1.5px solid #1D1D1B; }

    /* Collage DivIcon pins */
    .collage-pin-wrap { background: transparent !important; border: 0 !important; }
    .collage-pin {
      position: relative;
      width: 170px;
      transform-origin: bottom center;
      font-family: 'IBM Plex Serif', Georgia, serif;
      animation: collagePinDropIn 0.45s ease-out both;
      opacity: 0;
    }
    .collage-pin-card {
      background: #FFFFFF;
      border: 1.5px solid var(--pin-ring, #1D1D1B);
      border-left: 4px solid var(--pin-color, #1D1D1B);
      padding: 5px 9px 6px;
      box-shadow: 0 6px 12px -6px rgba(29,29,27,.4);
    }
    .collage-pin-cat {
      font-family: 'Rubik Mono One', system-ui, sans-serif;
      font-size: 8px;
      letter-spacing: .22em;
      text-transform: uppercase;
      color: #4A4843;
      margin-bottom: 2px;
    }
    .collage-pin-name {
      font-family: 'Caveat', cursive;
      font-weight: 600;
      font-size: 15px;
      line-height: 1.1;
      color: #1D1D1B;
    }
    .collage-pin-stem {
      width: 2px;
      height: 12px;
      background: var(--pin-color, #1D1D1B);
      margin: 0 auto;
    }
    .collage-pin-stem::after {
      content: "";
      display: block;
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: var(--pin-color, #1D1D1B);
      border: 2px solid #FFFFFF;
      margin: 2px auto 0;
      box-shadow: 0 2px 4px rgba(0,0,0,.35);
    }
    .collage-pin-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 12px;
      height: 12px;
      border-radius: 999px;
      border: 2px solid #FFFFFF;
      box-shadow: 0 1px 2px rgba(0,0,0,.25);
    }
    .collage-pin-wrap:hover .collage-pin-card {
      transform: translateY(-3px);
      transition: transform 140ms ease-out;
    }
    .collage-pin-glow-pen .collage-pin-card {
      animation: collagePinGlowPen 1.4s ease-in-out infinite;
    }
    .collage-pin-glow-ink .collage-pin-card {
      animation: collagePinGlowInk 2s ease-in-out infinite;
    }
    .collage-pin-dragging .collage-pin {
      transform: scale(1.08) translateY(-4px) rotate(0deg) !important;
    }
    .collage-pin-dragging .collage-pin-card {
      box-shadow: 0 12px 24px rgba(0,0,0,.35) !important;
    }
    @keyframes collagePinDropIn {
      0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
      100% { opacity: 1; }
    }
    @keyframes collagePinGlowPen {
      0%, 100% { box-shadow: 0 6px 12px -6px rgba(29,29,27,.4), 0 0 0 0 rgba(31,60,198,0.35); }
      50% { box-shadow: 0 6px 12px -6px rgba(29,29,27,.4), 0 0 14px 4px rgba(31,60,198,0.45); }
    }
    @keyframes collagePinGlowInk {
      0%, 100% { box-shadow: 0 6px 12px -6px rgba(29,29,27,.4), 0 0 0 0 rgba(168,50,50,0.3); }
      50% { box-shadow: 0 6px 12px -6px rgba(29,29,27,.4), 0 0 14px 4px rgba(168,50,50,0.4); }
    }
    @media (prefers-reduced-motion: reduce) {
      .collage-pin {
        animation: none !important;
        opacity: 1 !important;
        transform: rotate(0deg) !important;
      }
      .collage-pin-glow-pen .collage-pin-card,
      .collage-pin-glow-ink .collage-pin-card { animation: none !important; }
    }
  `;
  document.head.appendChild(style);
}
