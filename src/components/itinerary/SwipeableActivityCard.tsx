import { useState, useRef, useCallback, ReactNode } from 'react';
import { Check, Edit, SkipForward, Trash2, Camera } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import '@/preview/collage/collage.css';

/**
 * Mobile swipe wrapper — migrated to Collage (Phase 4 #2 core, W3.3a).
 * Presentation only. Swipe thresholds, touch handlers, action dispatch all
 * unchanged. Colors shifted from saturated blue/orange/purple/red pills to
 * the Collage palette (ink / pen / tape / success / danger); action tiles
 * are paper chips not rounded bubbles.
 */

interface SwipeableActivityCardProps {
  children: ReactNode;
  activityId: string;
  isCompleted: boolean;
  onComplete: () => void;
  onEdit?: () => void;
  onSkip?: () => void;
  onDelete?: () => void;
  onAddMemory?: () => void;
}

const SWIPE_THRESHOLD = 60;
const MAX_SWIPE = 120;

export function SwipeableActivityCard({
  children,
  activityId,
  isCompleted,
  onComplete,
  onEdit,
  onSkip,
  onDelete,
  onAddMemory
}: SwipeableActivityCardProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef(false);
  const isMobile = useIsMobile();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = false;
  }, [isMobile]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    // Determine if this is a horizontal swipe (first significant movement)
    if (!isHorizontalSwipe.current && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
      isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
    }

    // Only handle horizontal swipes
    if (!isHorizontalSwipe.current) return;

    // Prevent vertical scrolling during horizontal swipe
    e.preventDefault();

    // Clamp the swipe distance
    const clampedX = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diffX));
    setSwipeX(clampedX);
  }, [isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile) return;

    // Check if we passed the threshold
    if (swipeX > SWIPE_THRESHOLD) {
      // Swipe right - toggle complete
      onComplete();
      setSwipeX(0);
    } else if (swipeX < -SWIPE_THRESHOLD) {
      // Swipe left - show action menu
      setIsMenuOpen(true);
      setSwipeX(-MAX_SWIPE);
    } else {
      // Reset position
      setSwipeX(0);
    }
  }, [isMobile, swipeX, onComplete]);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    setSwipeX(0);
  }, []);

  const handleAction = useCallback((action: () => void) => {
    action();
    closeMenu();
  }, [closeMenu]);

  // Calculate background colors based on swipe direction
  const showRightBackground = swipeX > 0;
  const showLeftBackground = swipeX < 0 || isMenuOpen;
  const rightProgress = Math.min(swipeX / SWIPE_THRESHOLD, 1);
  const leftProgress = Math.min(-swipeX / SWIPE_THRESHOLD, 1);
  void leftProgress; // retained for future shimmer; not rendered.

  // If not on mobile, just render children directly
  if (!isMobile) {
    return (
      <div data-activity-id={activityId}>
        {children}
      </div>
    );
  }

  // Collage-flavored action tile
  const actionTileStyle = (bg: string, fg: string): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '8px 10px',
    background: bg,
    color: fg,
    border: 'none',
    borderRadius: 'var(--c-r-sm)',
    boxShadow: 'var(--c-shadow-sm)',
    cursor: 'pointer',
    fontFamily: 'var(--c-font-display)',
    fontSize: 9,
    letterSpacing: '.18em',
    textTransform: 'uppercase',
  });

  return (
    <div
      className="collage-root"
      data-activity-id={activityId}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--c-r-sm)',
      }}
    >
      {/* Right swipe background (complete) — success green when un-done, muted on undo */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingLeft: 16,
          background: isCompleted ? 'var(--c-ink-muted)' : 'var(--c-success)',
          transition: 'opacity var(--c-t-fast)',
          opacity: showRightBackground ? 1 : 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--c-creme)',
            fontFamily: 'var(--c-font-display)',
            fontSize: 11,
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            opacity: rightProgress,
            transform: `scale(${0.8 + rightProgress * 0.2})`,
          }}
        >
          <Check className="w-5 h-5" />
          <span>{isCompleted ? 'undo' : 'done'}</span>
        </div>
      </div>

      {/* Left swipe background (action menu) — creme plate with ink action chips */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 6,
          paddingRight: 8,
          background: 'var(--c-creme)',
          borderTop: '1px dashed var(--c-line)',
          borderBottom: '1px dashed var(--c-line)',
          transition: 'opacity var(--c-t-fast)',
          opacity: showLeftBackground ? 1 : 0,
        }}
      >
        {isMenuOpen && (
          <>
            {onEdit && (
              <button
                onClick={() => handleAction(onEdit)}
                style={actionTileStyle('var(--c-pen)', 'var(--c-creme)')}
                aria-label="Edit activity"
              >
                <Edit className="w-4 h-4" />
                <span>edit</span>
              </button>
            )}
            {onSkip && (
              <button
                onClick={() => handleAction(onSkip)}
                style={actionTileStyle('var(--c-warn)', 'var(--c-creme)')}
                aria-label="Skip activity"
              >
                <SkipForward className="w-4 h-4" />
                <span>skip</span>
              </button>
            )}
            {onAddMemory && (
              <button
                onClick={() => handleAction(onAddMemory)}
                style={actionTileStyle('var(--c-ink)', 'var(--c-creme)')}
                aria-label="Add memory"
              >
                <Camera className="w-4 h-4" />
                <span>memory</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => handleAction(onDelete)}
                style={actionTileStyle('var(--c-danger)', 'var(--c-creme)')}
                aria-label="Delete activity"
              >
                <Trash2 className="w-4 h-4" />
                <span>delete</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Main card content */}
      <div
        className="relative z-10 touch-pan-y"
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swipeX === 0 ? 'transform 0.2s ease-out' : 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>

      {/* Tap outside to close menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={closeMenu}
        />
      )}
    </div>
  );
}
