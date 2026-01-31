import { Waves, Settings, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TripHeaderProps {
  onOpenSettings: () => void;
}

export function TripHeader({ onOpenSettings }: TripHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sunset-gradient rounded-full flex items-center justify-center shadow-warm">
            <Sun className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-foreground">
              Family Week 2026
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Waves className="w-3 h-3" />
              Provincetown
            </p>
          </div>
        </div>
        
        <Button variant="ghost" size="icon" onClick={onOpenSettings}>
          <Settings className="w-5 h-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </div>
    </header>
  );
}
