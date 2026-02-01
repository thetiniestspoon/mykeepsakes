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
        "dashboard-grid h-dvh overflow-hidden bg-background",
        className
      )}
    >
      {/* Header - spans all columns */}
      <header className="dashboard-header col-span-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-40">
        {header}
      </header>
      
      {/* Left Column - Itinerary */}
      <aside className="left-column overflow-y-auto border-r border-border bg-card/50">
        {leftColumn}
      </aside>
      
      {/* Center Column - Detail Panel */}
      <main className="center-column overflow-y-auto bg-background">
        {centerColumn}
      </main>
      
      {/* Right Column - Map */}
      <aside className="right-column flex flex-col bg-muted/30">
        {rightColumn}
      </aside>
    </div>
  );
}
