import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { Stamp } from '@/preview/collage/ui/Stamp';
import { MarginNote } from '@/preview/collage/ui/MarginNote';
import '@/preview/collage/collage.css';

interface LodgingIframeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  label: string;
}

/**
 * Iframe preview modal migrated to Collage (Phase 4 #9).
 * The iframe's own content is untouched — we only restyle the surrounding
 * chrome (header row, refresh/open/close controls, error state). Iframe
 * loading state, sandbox, cross-origin detection, and iframeKey all preserved.
 */
export function LodgingIframeModal({ open, onOpenChange, url, label }: LodgingIframeModalProps) {
  const [iframeError, setIframeError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = () => {
    setIframeError(false);
    setIframeKey((prev) => prev + 1);
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

  const chromeButton: React.CSSProperties = {
    appearance: 'none',
    cursor: 'pointer',
    padding: '6px 10px',
    fontFamily: 'var(--c-font-display)',
    fontSize: 10,
    letterSpacing: '.22em',
    textTransform: 'uppercase',
    background: 'var(--c-creme)',
    color: 'var(--c-ink)',
    border: '1.5px solid var(--c-ink)',
    borderRadius: 'var(--c-r-sm)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    lineHeight: 1,
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 gap-0 border-0 bg-transparent shadow-none">
        <div
          className="collage-root"
          style={{
            background: 'var(--c-paper)',
            boxShadow: 'var(--c-shadow)',
            border: '1px solid var(--c-line)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <DialogHeader className="space-y-0">
            <div
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--c-line)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'var(--c-creme)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                <Stamp variant="plain" size="sm" style={{ color: 'var(--c-ink-muted)', padding: 0 }}>
                  preview
                </Stamp>
                <DialogTitle asChild>
                  <h2
                    style={{
                      fontFamily: 'var(--c-font-body)',
                      fontSize: 16,
                      fontWeight: 500,
                      color: 'var(--c-ink)',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </h2>
                </DialogTitle>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button type="button" onClick={handleRefresh} style={chromeButton}>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button type="button" onClick={handleOpenExternal} style={chromeButton}>
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New tab</span>
                </button>
                <button
                  type="button"
                  aria-label="Close preview"
                  onClick={() => onOpenChange(false)}
                  style={{
                    ...chromeButton,
                    padding: 6,
                    background: 'transparent',
                    border: '1px dashed var(--c-line)',
                    color: 'var(--c-ink-muted)',
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </DialogHeader>

          <div
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              background: 'var(--c-creme)',
            }}
          >
            {url ? (
              <>
                {iframeError ? (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 24,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: 420,
                        background: 'var(--c-paper)',
                        border: '1px solid var(--c-line)',
                        boxShadow: 'var(--c-shadow)',
                        padding: '20px 22px',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <AlertCircle
                          className="w-5 h-5"
                          style={{ color: 'var(--c-warn)', flexShrink: 0 }}
                        />
                        <Stamp variant="outline" size="sm" rotate={-2}>
                          can&rsquo;t embed
                        </Stamp>
                      </div>
                      <p
                        style={{
                          fontFamily: 'var(--c-font-body)',
                          fontSize: 15,
                          color: 'var(--c-ink)',
                          margin: '0 0 8px',
                        }}
                      >
                        This site refused to load in a preview frame.
                      </p>
                      <p
                        style={{
                          fontFamily: 'var(--c-font-body)',
                          fontStyle: 'italic',
                          fontSize: 13,
                          color: 'var(--c-ink-muted)',
                          margin: '0 0 14px',
                        }}
                      >
                        Many rental sites (Airbnb, VRBO…) block embedding for security.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenExternal}
                        style={{
                          appearance: 'none',
                          cursor: 'pointer',
                          width: '100%',
                          padding: '10px 14px',
                          fontFamily: 'var(--c-font-display)',
                          fontSize: 11,
                          letterSpacing: '.22em',
                          textTransform: 'uppercase',
                          background: 'var(--c-ink)',
                          color: 'var(--c-creme)',
                          border: 0,
                          borderRadius: 'var(--c-r-sm)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          boxShadow: 'var(--c-shadow-sm)',
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open in new tab
                      </button>
                      <MarginNote
                        rotate={-2}
                        size={18}
                        style={{ display: 'block', marginTop: 10 }}
                      >
                        the external site still works →
                      </MarginNote>
                    </div>
                  </div>
                ) : (
                  <iframe
                    key={iframeKey}
                    src={url}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 0,
                      background: 'var(--c-paper)',
                    }}
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
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--c-font-body)',
                    fontStyle: 'italic',
                    color: 'var(--c-ink-muted)',
                    margin: 0,
                  }}
                >
                  No URL provided
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
