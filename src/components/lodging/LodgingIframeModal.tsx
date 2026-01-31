import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LodgingIframeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  label: string;
}

export function LodgingIframeModal({ open, onOpenChange, url, label }: LodgingIframeModalProps) {
  const [iframeError, setIframeError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = () => {
    setIframeError(false);
    setIframeKey(prev => prev + 1);
  };

  const handleOpenExternal = () => {
    window.open(url, '_blank');
  };

  // Reset error state when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setIframeError(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-lg truncate pr-4">{label}</DialogTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenExternal}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Open in New Tab</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 relative overflow-hidden">
          {url ? (
            <>
              {iframeError ? (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <Alert className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="mt-2">
                      <p className="font-medium mb-2">This site can't be embedded</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Many rental sites like Airbnb and VRBO prevent embedding for security reasons.
                      </p>
                      <Button onClick={handleOpenExternal} className="w-full gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Open in New Tab
                      </Button>
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <iframe
                  key={iframeKey}
                  src={url}
                  className="w-full h-full border-0"
                  title={label}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  onError={() => setIframeError(true)}
                  onLoad={(e) => {
                    // Try to detect if iframe failed to load content
                    try {
                      const iframe = e.target as HTMLIFrameElement;
                      // This will throw if cross-origin
                      if (iframe.contentDocument?.body?.innerHTML === '') {
                        setIframeError(true);
                      }
                    } catch {
                      // Cross-origin - can't check, assume it's working
                    }
                  }}
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">No URL provided</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
