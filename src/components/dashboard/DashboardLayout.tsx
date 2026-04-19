import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  header: ReactNode;
  leftColumn: ReactNode;
  centerColumn: ReactNode;
  rightColumn: ReactNode;
  className?: string;
}

/**
 * 3-column dashboard layout for landscape/desktop views
 * 
 * Grid structure:
 * - Header: spans all columns
 * - Left: Itinerary column (scrollable)
 * - Center: Detail panel (scrollable)
 * - Right: Persistent map
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
      className={cn(
        "dashboard-grid h-dvh overflow-hidden bg-[var(--c-creme)]",
        className
      )}
    >
      {/* Header - spans all columns */}
      <header className="dashboard-header col-span-full border-b border-[var(--c-line)] bg-[var(--c-creme)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--c-creme)]/80 z-40">
        {header}
      </header>

      {/* Left Column - Itinerary */}
      <aside className="left-column overflow-y-auto border-r border-[var(--c-line)] bg-[var(--c-paper)]">
        {leftColumn}
      </aside>

      {/* Center Column - Detail Panel */}
      <main className="center-column overflow-y-auto bg-[var(--c-creme)]">
        {centerColumn}
      </main>

      {/* Right Column - Map */}
      <aside className="right-column flex flex-col border-l border-[var(--c-line)] bg-[var(--c-paper)]">
        {rightColumn}
      </aside>
    </div>
  );
}
