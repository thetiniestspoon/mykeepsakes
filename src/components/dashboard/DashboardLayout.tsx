import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import '@/preview/collage/collage.css';

interface DashboardLayoutProps {
  header: ReactNode;
  leftColumn: ReactNode;
  centerColumn: ReactNode;
  rightColumn: ReactNode;
  className?: string;
}

/**
 * 3-column dashboard layout for landscape/desktop views.
 *
 * Migrated to the Collage direction 2026-04-23 (Phase 4 #1 step 4b).
 * The outer chrome — crème workbench bg, paper column surfaces, hairline
 * ink dividers, stamped header band with subtle tape accents at the
 * column boundaries — reads like a field-notebook operating console.
 *
 * Grid structure (unchanged — styles live in src/index.css):
 * - Header: spans all columns
 * - Left: Itinerary column (scrollable)
 * - Center: Detail panel (scrollable)
 * - Right: Persistent map
 *
 * Tokens load via the ancestor <CollageRoot> in Index.tsx; collage.css is
 * imported here defensively so the component remains usable in isolation.
 */
export function DashboardLayout({
  header,
  leftColumn,
  centerColumn,
  rightColumn,
  className,
}: DashboardLayoutProps) {
  return (
    <div
      className={cn('dashboard-grid h-dvh overflow-hidden relative', className)}
      style={{ background: 'var(--c-creme)' }}
    >
      {/* Header band — ink hairline bottom, crème surface matches CompactHeader.
          Backdrop blur retained for scroll contrast; no gradients. The
          column-boundary tape accents live on the column elements below so
          they land precisely at the grid seams. */}
      <header
        className="dashboard-header col-span-full z-40 relative"
        style={{
          borderBottom: '1px solid var(--c-line)',
          background: 'color-mix(in srgb, var(--c-creme) 95%, transparent)',
          backdropFilter: 'saturate(1.05) blur(4px)',
          WebkitBackdropFilter: 'saturate(1.05) blur(4px)',
        }}
      >
        {header}
      </header>

      {/* Left Column — paper surface, hairline ink divider on the right */}
      <aside
        className="left-column overflow-y-auto"
        style={{
          background: 'var(--c-paper)',
          borderRight: '1px solid var(--c-line)',
        }}
      >
        {leftColumn}
      </aside>

      {/* Center Column — crème workbench surface */}
      <main
        className="center-column overflow-y-auto"
        style={{ background: 'var(--c-creme)' }}
      >
        {centerColumn}
      </main>

      {/* Right Column — paper surface, hairline ink divider on the left */}
      <aside
        className="right-column flex flex-col"
        style={{
          background: 'var(--c-paper)',
          borderLeft: '1px solid var(--c-line)',
        }}
      >
        {rightColumn}
      </aside>

      {/* Column-boundary tape accents — desktop only, decorative.
          Positioned absolutely over the dashboard-grid parent so they sit at
          the header/column seams and never scroll with column content.
          Percentages approximate the grid tracks (260fr / 300fr*1.5 / 280fr). */}
      <span
        aria-hidden="true"
        className="hidden lg:block"
        style={{
          position: 'absolute',
          top: 36,
          left: 'calc(26% - 22px)',
          width: 44,
          height: 14,
          background: 'rgba(246, 213, 92, 0.62)',
          transform: 'rotate(-4deg)',
          boxShadow: '0 1px 2px rgba(0, 0, 0, .12)',
          pointerEvents: 'none',
          zIndex: 41,
        }}
      />
      <span
        aria-hidden="true"
        className="hidden lg:block"
        style={{
          position: 'absolute',
          top: 36,
          right: 'calc(26% - 22px)',
          width: 44,
          height: 14,
          background: 'rgba(246, 213, 92, 0.62)',
          transform: 'rotate(3deg)',
          boxShadow: '0 1px 2px rgba(0, 0, 0, .12)',
          pointerEvents: 'none',
          zIndex: 41,
        }}
      />
    </div>
  );
}
