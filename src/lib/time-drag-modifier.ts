/**
 * Time-based drag modifier utilities
 * Handles velocity tracking and time calculations during drag operations
 */

export interface TimeDragState {
  startY: number;
  lastY: number;
  lastTimestamp: number;
  velocity: number;       // px/ms
  accumulatedDelta: number;
  currentTime: string;    // Preview time during drag
  originalTime: string;
}

// Pixels per minute at different speeds
const PIXELS_PER_MINUTE_SLOW = 8;   // Slow drag: 8px = 1 min
const PIXELS_PER_MINUTE_FAST = 24;  // Fast drag: 24px = 1 min

/**
 * Calculate time increment granularity based on drag velocity
 * Slow = 5min, Medium = 15min, Fast = 30min
 */
export function calculateTimeIncrement(velocity: number): number {
  const absVelocity = Math.abs(velocity);
  if (absVelocity < 0.3) return 5;   // Slow: 5-min increments
  if (absVelocity < 0.8) return 15;  // Medium: 15-min increments
  return 30;                          // Fast: 30-min increments
}

/**
 * Calculate new time based on vertical drag delta and velocity
 * @param originalTime - Original time in "HH:mm:ss" format
 * @param deltaY - Vertical pixel delta (negative = up = earlier)
 * @param velocity - Current drag velocity in px/ms
 * @returns New time in "HH:mm:ss" format
 */
export function calculateNewTime(
  originalTime: string,
  deltaY: number,
  velocity: number
): string {
  if (!originalTime) return originalTime;
  
  const increment = calculateTimeIncrement(velocity);
  const pixelsPerIncrement = velocity < 0.3 
    ? PIXELS_PER_MINUTE_SLOW * increment 
    : PIXELS_PER_MINUTE_FAST;
  
  const steps = Math.floor(Math.abs(deltaY) / pixelsPerIncrement);
  const direction = deltaY < 0 ? -1 : 1;  // Up = earlier, Down = later
  const minutesDelta = steps * increment * direction;
  
  return addMinutesToTime(originalTime, minutesDelta);
}

/**
 * Add (or subtract) minutes to a time string
 * @param time - Time in "HH:mm:ss" or "HH:mm" format
 * @param minutes - Minutes to add (can be negative)
 * @returns New time in "HH:mm:ss" format, clamped to 00:00:00 - 23:59:59
 */
export function addMinutesToTime(time: string, minutes: number): string {
  const parts = time.split(':').map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts[2] || 0;
  
  let totalMinutes = h * 60 + m + minutes;
  
  // Clamp to 00:00 - 23:59
  totalMinutes = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  
  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Calculate difference in minutes between two time strings
 * @param startTime - Start time in "HH:mm:ss" format
 * @param endTime - End time in "HH:mm:ss" format
 * @returns Difference in minutes
 */
export function timeDifferenceInMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  
  return endMinutes - startMinutes;
}

/**
 * Format time from "HH:mm:ss" to display format "H:mm AM/PM"
 */
export function formatTimeForDisplay(time: string | null): string | undefined {
  if (!time) return undefined;
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Create initial drag state
 */
export function createDragState(originalTime: string, startY: number): TimeDragState {
  return {
    startY,
    lastY: startY,
    lastTimestamp: Date.now(),
    velocity: 0,
    accumulatedDelta: 0,
    currentTime: originalTime,
    originalTime,
  };
}

/**
 * Update drag state with new position
 */
export function updateDragState(
  state: TimeDragState,
  currentY: number
): TimeDragState {
  const now = Date.now();
  const timeDelta = now - state.lastTimestamp;
  const yDelta = currentY - state.lastY;
  
  // Calculate velocity (smoothed)
  const instantVelocity = timeDelta > 0 ? yDelta / timeDelta : 0;
  const smoothedVelocity = state.velocity * 0.7 + instantVelocity * 0.3;
  
  const totalDelta = currentY - state.startY;
  const newTime = calculateNewTime(state.originalTime, totalDelta, smoothedVelocity);
  
  return {
    ...state,
    lastY: currentY,
    lastTimestamp: now,
    velocity: smoothedVelocity,
    accumulatedDelta: totalDelta,
    currentTime: newTime,
  };
}
