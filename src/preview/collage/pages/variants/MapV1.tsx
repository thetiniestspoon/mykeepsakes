import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useActiveTrip } from '@/hooks/use-trip';
import { useLocations } from '@/hooks/use-locations';
import { Stamp } from '../../ui/Stamp';
import { StickerPill } from '../../ui/StickerPill';
import { MarginNote } from '../../ui/MarginNote';
import { Tape } from '../../ui/Tape';
import type { Location } from '@/types/trip';

/**
 * Map V1 — Annotated Pinboard.
 * Real Leaflet map (CartoDB Voyager tiles) under a Collage chrome overlay.
 * Location pins render as Collage-styled DivIcons in category colors; the airport→hotel→venue
 * route is a pen-blue dashed Polyline. Corner stamps + tape strips keep the scrapbook feel
 * while the base tiles ground the view in real geography.
 */

type Category = 'airport' | 'hotel' | 'venue' | 'other';

const ROUTE_ORDER: Category[] = ['airport', 'hotel', 'venue'];

const CATEGORY_COLOR: Record<Category, string> = {
  airport: '#5b7fa8',  // sky
  hotel:   '#2A2724',  // ink
  venue:   '#C2A87A',  // gold
  other:   '#8ba66e',  // sage
};

function categorize(loc: Location): Category {
  const cat = (loc.category ?? '').toLowerCase();
  const name = (loc.name ?? '').toLowerCase();
  if (cat.includes('airport') || name.includes('airport') || name.includes("o'hare") || name.includes('ohare') || name.includes('newark') || name.includes('ewr') || name.includes('ord')) {
    return 'airport';
  }
  if (cat.includes('hotel') || cat.includes('accommodation') || cat.includes('lodging') || name.includes('hotel') || name.includes('marriott') || name.includes('inn') || name.includes('suites')) {
    return 'hotel';
  }
  if (cat.includes('venue') || cat.includes('conference') || cat.includes('event') || name.includes('venue') || name.includes('center') || name.includes('centre') || name.includes('convention')) {
    return 'venue';
  }
  return 'other';
}

// Fallback Sankofa data when no locations exist yet.
const FALLBACK: Location[] = [
  {
    id: 'fallback-1',
    trip_id: 'fallback',
    name: "O'Hare International",
    category: 'airport',
    address: '10000 W O\'Hare Ave, Chicago, IL 60666',
    lat: 41.9742,
    lng: -87.9073,
    phone: null, url: null, notes: null, visited_at: null,
    created_at: '', updated_at: '',
  },
  {
    id: 'fallback-2',
    trip_id: 'fallback',
    name: 'Marriott Oak Brook',
    category: 'hotel',
    address: '1401 W 22nd St, Oak Brook, IL 60523',
    lat: 41.8395,
    lng: -87.9534,
    phone: null, url: null, notes: null, visited_at: null,
    created_at: '', updated_at: '',
  },
  {
    id: 'fallback-3',
    trip_id: 'fallback',
    name: 'Sankofa Venue',
    category: 'venue',
    address: '1333 S Wabash Ave, Chicago, IL 60605',
    lat: 41.8643,
    lng: -87.6250,
    phone: null, url: null, notes: null, visited_at: null,
    created_at: '', updated_at: '',
  },
];

/**
 * Collage-styled Leaflet DivIcon. A tiny paper tag with category color,
 * location name, and a subtle rotation. Pointer tip at the bottom-center.
 */
function makeDivIcon(loc: Location, category: Category, rotate: number): L.DivIcon {
  const color = CATEGORY_COLOR[category];
  const label = (loc.name ?? '').length > 22
    ? (loc.name ?? '').slice(0, 21).trim() + '…'
    : loc.name ?? '';
  const catLabel = category === 'other' ? 'stop' : category;
  const html = `
    <div class="collage-pin" style="transform: rotate(${rotate}deg); --pin-color:${color};">
      <div class="collage-pin-card">
        <div class="collage-pin-cat">${catLabel}</div>
        <div class="collage-pin-name">${escapeHtml(label)}</div>
      </div>
      <div class="collage-pin-stem" aria-hidden="true"></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'collage-pin-wrap',
    iconSize: [170, 70],
    iconAnchor: [85, 70],
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string)
  );
}

export function MapV1() {
  const { data: trip } = useActiveTrip();
  const { data: locations = [] } = useLocations(trip?.id);

  const source: Location[] = locations.length > 0 ? locations : FALLBACK;

  // Annotate each location with category + a deterministic tag rotation.
  const annotated = useMemo(() => {
    return source
      .filter(l => typeof l.lat === 'number' && typeof l.lng === 'number')
      .map(loc => {
        const category = categorize(loc);
        const rotateSeed = ((loc.name?.charCodeAt(0) ?? 0) + (loc.name?.length ?? 0)) % 10;
        const rotate = (rotateSeed - 5) * 0.9; // -4.5..+4.5
        return { loc, category, rotate };
      });
  }, [source]);

  // Determine route: one representative per category in ROUTE_ORDER.
  const routeCoords = useMemo<[number, number][]>(() => {
    const points: [number, number][] = [];
    for (const cat of ROUTE_ORDER) {
      const first = annotated.find(a => a.category === cat);
      if (first && first.loc.lat != null && first.loc.lng != null) {
        points.push([first.loc.lat, first.loc.lng]);
      }
    }
    return points;
  }, [annotated]);

  // Fit bounds to all coords, with a soft padding.
  const bounds = useMemo<L.LatLngBoundsExpression | null>(() => {
    const pts = annotated
      .map(a => [a.loc.lat as number, a.loc.lng as number] as [number, number]);
    if (pts.length === 0) return null;
    if (pts.length === 1) {
      const [lat, lng] = pts[0];
      return [[lat - 0.1, lng - 0.15], [lat + 0.1, lng + 0.15]];
    }
    const lats = pts.map(p => p[0]);
    const lngs = pts.map(p => p[1]);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    // pad by ~10% of the extent
    const padLat = Math.max(0.03, (maxLat - minLat) * 0.18);
    const padLng = Math.max(0.04, (maxLng - minLng) * 0.18);
    return [[minLat - padLat, minLng - padLng], [maxLat + padLat, maxLng + padLng]];
  }, [annotated]);

  return (
    <main
      style={{
        padding: 'clamp(24px, 4vw, 56px) clamp(16px, 5vw, 64px) 80px',
        minHeight: 'calc(100vh - 120px)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 24,
          marginBottom: 28,
        }}
      >
        <div>
          <Stamp variant="outline" size="sm" rotate={-2} style={{ marginBottom: 14 }}>the map · pinboard</Stamp>
          <h1 style={{ fontFamily: 'var(--c-font-body)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 500, margin: 0, lineHeight: 1.05 }}>
            {trip?.title ?? 'Sankofa'}
          </h1>
          <p style={{ fontFamily: 'var(--c-font-body)', fontStyle: 'italic', color: 'var(--c-ink-muted)', margin: '6px 0 0', fontSize: 16 }}>
            {trip?.location_name ? `${trip.location_name} · ` : ''}
            {annotated.length} location{annotated.length === 1 ? '' : 's'} pinned
          </p>
        </div>
        <MarginNote rotate={-3} size={22} style={{ maxWidth: 260, textAlign: 'right' }}>
          pinned where we'll actually be — not to scale
        </MarginNote>
      </header>

      {/* Framed map — leaflet base + collage overlay */}
      <div
        className="collage-mapframe"
        style={{
          position: 'relative',
          width: '100%',
          height: 'min(620px, 70vh)',
          minHeight: 440,
          border: '1.5px solid var(--c-ink)',
          boxShadow: 'var(--c-shadow)',
          overflow: 'hidden',
          background: 'var(--c-creme)',
        }}
      >
        {bounds ? (
          <MapContainer
            bounds={bounds}
            scrollWheelZoom={false}
            style={{ width: '100%', height: '100%' }}
            attributionControl={true}
            zoomControl={true}
          >
            <LayersControl position="bottomright">
              <LayersControl.BaseLayer checked name="Field notebook (Voyager)">
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{y}/{x}{r}.png"
                  subdomains={['a', 'b', 'c', 'd']}
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Quiet (Positron)">
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{y}/{x}{r}.png"
                  subdomains={['a', 'b', 'c', 'd']}
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Raw (OSM)">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png"
                  subdomains={['a', 'b', 'c']}
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            {/* Pen-blue dashed route */}
            {routeCoords.length >= 2 && (
              <Polyline
                positions={routeCoords}
                pathOptions={{
                  color: '#1F3CC6',
                  weight: 3,
                  opacity: 0.9,
                  dashArray: '8 7',
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            )}

            {/* Collage-styled pins */}
            {annotated.map(({ loc, category, rotate }) => (
              <Marker
                key={loc.id}
                position={[loc.lat as number, loc.lng as number]}
                icon={makeDivIcon(loc, category, rotate)}
              />
            ))}
          </MapContainer>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <StickerPill variant="ink">no coordinates yet</StickerPill>
          </div>
        )}

        {/* Corner tape — purely decorative */}
        <Tape position="top-left" rotate={-8} width={84} style={{ zIndex: 500 }} />
        <Tape position="top-right" rotate={6} width={84} style={{ zIndex: 500 }} />

        {/* LEGEND card — positioned over map */}
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            left: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            alignItems: 'flex-start',
            zIndex: 500,
            pointerEvents: 'none',
          }}
        >
          <Stamp variant="ink" size="sm" rotate={-3}>legend</Stamp>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              background: 'var(--c-paper)',
              padding: '10px 12px',
              boxShadow: 'var(--c-shadow-sm)',
              border: '1px solid var(--c-line)',
            }}
          >
            {([
              { cat: 'airport' as Category, label: 'Airport' },
              { cat: 'hotel' as Category, label: 'Hotel' },
              { cat: 'venue' as Category, label: 'Venue' },
            ]).map(row => (
              <div key={row.cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  aria-hidden
                  style={{
                    width: 14,
                    height: 14,
                    background: CATEGORY_COLOR[row.cat],
                    border: '1.5px solid var(--c-ink)',
                    borderRadius: '50%',
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--c-font-display)',
                    fontSize: 9,
                    letterSpacing: '.2em',
                    textTransform: 'uppercase',
                    color: 'var(--c-ink)',
                  }}
                >
                  {row.label}
                </span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <span
                aria-hidden
                style={{
                  width: 18,
                  height: 2,
                  background: 'repeating-linear-gradient(90deg, #1F3CC6 0 4px, transparent 4px 7px)',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--c-font-display)',
                  fontSize: 9,
                  letterSpacing: '.2em',
                  textTransform: 'uppercase',
                  color: 'var(--c-ink)',
                }}
              >
                Our route
              </span>
            </div>
          </div>
        </div>
      </div>

      <p
        style={{
          marginTop: 18,
          fontFamily: 'var(--c-font-body)',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--c-ink-muted)',
        }}
      >
        Tiles © CARTO / OpenStreetMap. The tape and pen-marks are ours.
      </p>

      {/* Collage pin styling — scoped via the Leaflet divIcon class */}
      <style>{`
        .collage-pin-wrap { background: transparent !important; border: 0 !important; }
        .collage-pin {
          width: 170px;
          transform-origin: bottom center;
          font-family: var(--c-font-body);
        }
        .collage-pin-card {
          background: var(--c-paper);
          border: 1.5px solid var(--c-ink);
          border-left: 4px solid var(--pin-color, var(--c-ink));
          padding: 6px 10px 7px;
          box-shadow: 0 6px 12px -6px rgba(29,29,27,.4);
        }
        .collage-pin-cat {
          font-family: var(--c-font-display);
          font-size: 8px;
          letter-spacing: .22em;
          text-transform: uppercase;
          color: var(--c-ink-muted);
          margin-bottom: 2px;
        }
        .collage-pin-name {
          font-family: var(--c-font-script);
          font-weight: 600;
          font-size: 16px;
          line-height: 1.1;
          color: var(--c-ink);
        }
        .collage-pin-stem {
          width: 2px;
          height: 14px;
          background: var(--pin-color, var(--c-ink));
          margin: 0 auto;
        }
        .collage-pin-stem::after {
          content: "";
          display: block;
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: var(--pin-color, var(--c-ink));
          border: 2px solid var(--c-paper);
          margin: 2px auto 0;
          box-shadow: 0 2px 4px rgba(0,0,0,.35);
        }

        /* Soft sepia wash over Leaflet tiles so they sit under the Collage palette */
        .collage-mapframe .leaflet-tile-pane {
          filter: sepia(0.18) saturate(0.88) contrast(1.02);
        }
        .collage-mapframe .leaflet-control-attribution {
          background: rgba(247, 243, 233, 0.85) !important;
          font-family: var(--c-font-body);
          font-size: 10px;
          color: var(--c-ink-muted);
        }
        .collage-mapframe .leaflet-control-attribution a { color: var(--c-pen); }
        .collage-mapframe .leaflet-bar a {
          background: var(--c-paper);
          color: var(--c-ink);
          border-color: var(--c-ink);
          font-family: var(--c-font-display);
        }
        .collage-mapframe .leaflet-bar a:hover { background: var(--c-tape); }

        @media (prefers-reduced-motion: reduce) {
          .collage-pin { transform: rotate(0deg) !important; }
        }
        @media (max-width: 720px) {
          .collage-mapframe { height: 520px !important; min-height: 520px !important; }
          .collage-pin { width: 150px; }
          .collage-pin-name { font-size: 14px; }
        }
      `}</style>
    </main>
  );
}
