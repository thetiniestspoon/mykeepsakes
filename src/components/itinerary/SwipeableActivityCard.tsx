import { useState, useRef, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Check, Edit, SkipForward, Trash2, Camera } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
const LONG_PRESS_MS = 650;
const LONG_PRESS_MOVE_THRESHOLD = 8;

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
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef(false);
  const longPressTimer = useRef<number | null>(null);
  const longPressOrigin = useRef<{ x: number; y: number } | null>(null);
  const isMobile = useIsMobile();

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressOrigin.current = null;
    setIsLongPressing(false);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!onDelete) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [role="button"]')) return;
    longPressOrigin.current = { x: e.clientX, y: e.clientY };
    setIsLongPressing(true);
    longPressTimer.current = window.setTimeout(() => {
      longPressTimer.current = null;
      setIsLongPressing(false);
      setConfirmDeleteOpen(true);
    }, LONG_PRESS_MS);
  }, [onDelete]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!longPressOrigin.current) return;
    const dx = e.clientX - longPressOrigin.current.x;
    const dy = e.clientY - longPressOrigin.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > LONG_PRESS_MOVE_THRESHOLD) {
      cancelLongPress();
    }
  }, [cancelLongPress]);

  const handleConfirmDelete = useCallback(() => {
    onDelete?.();
    setConfirmDeleteOpen(false);
  }, [onDelete]);

  const deleteConfirmDialog = (
    <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this event?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the item from your itinerary. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  
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
  
  // If not on mobile, just render children directly (with long-press support)
  if (!isMobile) {
    return (
      <>
        <div
          data-activity-id={activityId}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={cancelLongPress}
          onPointerCancel={cancelLongPress}
          onPointerLeave={cancelLongPress}
          className={cn(
            "transition-[transform,opacity]",
            isLongPressing && "opacity-80 scale-[.985]"
          )}
        >
          {children}
        </div>
        {deleteConfirmDialog}
      </>
    );
  }

  return (
    <>
    <div
      className="relative overflow-hidden rounded-lg"
      data-activity-id={activityId}
    >
      {/* Right swipe background (complete) */}
      <div 
        className={cn(
          "absolute inset-0 flex items-center justify-start pl-4 transition-colors",
          isCompleted ? "bg-muted" : "bg-green-500"
        )}
        style={{ opacity: showRightBackground ? 1 : 0 }}
      >
        <div 
          className="flex items-center gap-2 text-white font-medium"
          style={{ 
            opacity: rightProgress,
            transform: `scale(${0.8 + rightProgress * 0.2})`
          }}
        >
          <Check className="w-6 h-6" />
          <span>{isCompleted ? 'Undo' : 'Done!'}</span>
        </div>
      </div>
      
      {/* Left swipe background (action menu) */}
      <div 
        className={cn(
          "absolute inset-0 flex items-center justify-end gap-2 pr-2 bg-muted transition-opacity",
        )}
        style={{ opacity: showLeftBackground ? 1 : 0 }}
      >
        {isMenuOpen && (
          <>
            {onEdit && (
              <button
                onClick={() => handleAction(onEdit)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <Edit className="w-5 h-5" />
                <span className="text-xs">Edit</span>
              </button>
            )}
            {onSkip && (
              <button
                onClick={() => handleAction(onSkip)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
              >
                <SkipForward className="w-5 h-5" />
                <span className="text-xs">Skip</span>
              </button>
            )}
            {onAddMemory && (
              <button
                onClick={() => handleAction(onAddMemory)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
              >
                <Camera className="w-5 h-5" />
                <span className="text-xs">Memory</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => handleAction(onDelete)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span className="text-xs">Delete</span>
              </button>
            )}
          </>
        )}
      </div>
      
      {/* Main card content */}
      <div
        className={cn(
          "relative z-10 transition-transform touch-pan-y",
          isLongPressing && "opacity-80 scale-[.985]"
        )}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swipeX === 0 ? 'transform 0.2s ease-out' : 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={cancelLongPress}
        onPointerCancel={cancelLongPress}
        onPointerLeave={cancelLongPress}
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
    {deleteConfirmDialog}
    </>
  );
}
