import { useState } from 'react';
import { Waves, Settings, Sun, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareDialog } from '@/components/sharing/ShareDialog';

interface TripHeaderProps {
  onOpenSettings: () => void;
}

export function TripHeader({ onOpenSettings }: TripHeaderProps) {
  const [shareOpen, setShareOpen] = useState(false);
  
  return (
    <>
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
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setShareOpen(true)}>
              <Share2 className="w-5 h-5" />
              <span className="sr-only">Share</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onOpenSettings}>
              <Settings className="w-5 h-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </div>
        </div>
      </header>
      
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} />
    </>
  );
}
