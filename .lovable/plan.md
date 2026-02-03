
# Add Visible Drag Handle to Activity Cards

## Problem

The current drag handle is positioned **outside** the card boundaries (`-translate-x-6`) in the left margin. This causes:

1. **Hidden on mobile**: The handle can be clipped by parent containers or invisible
2. **Poor discoverability**: Users don't know where to touch to drag
3. **Conflict with scrolling**: Without a clear handle zone, the entire card might capture touch events, competing with scroll gestures

## Solution

Move the drag handle **inside** the card layout, to the left of the category icon, making it:
- Always visible
- Touch-friendly (minimum 44px touch target)
- Clearly separated from the clickable content area

---

## Design

### Compact Activity Card (Dashboard)

```
┌─────────────────────────────────────────────────┐
│ ⋮⋮  🍽️  9:30 AM  Breakfast at hotel      📍    │
└─────────────────────────────────────────────────┘
 ↑     ↑           ↑                         ↑
 Drag  Icon        Time + Title              Location
 Handle
```

The grip icon (`⋮⋮`) becomes the leftmost element, always visible with subtle styling.

### Full Activity Card (DatabaseActivityCard)

```
┌─────────────────────────────────────────────────────┐
│ ⋮⋮  ☐  🏖️ beach  9:00 AM                      ♡ 📝 │
│      Beach Day at Waikiki                           │
│      Relax and enjoy the sun...                     │
└─────────────────────────────────────────────────────┘
 ↑     ↑   ↑
 Drag  ✓   Category badge
 Handle
```

---

## Implementation

### File 1: `src/components/itinerary/DraggableActivity.tsx`

**Changes:**
- Remove the external absolute-positioned handle
- Instead, pass drag listeners/attributes to children via props
- Let the child component render the handle in the right position

```tsx
interface DraggableActivityProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
  originalTime?: string;
  previewTime?: string | null;
}

export function DraggableActivity({ id, children, disabled, originalTime, previewTime }: DraggableActivityProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled, data: { originalTime } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Clone children to pass drag handle props
  const childrenWithProps = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement, {
        previewTime: isDragging ? previewTime : undefined,
        isDragging,
        dragHandleProps: disabled ? undefined : { ...attributes, ...listeners },
      })
    : children;

  return (
    <div ref={setNodeRef} style={style} className={cn("relative", isDragging && "z-50 opacity-90 shadow-lg rounded-lg")}>
      {childrenWithProps}
    </div>
  );
}
```

---

### File 2: `src/components/dashboard/CompactActivityCard.tsx`

**Changes:**
- Accept `dragHandleProps` from parent
- Add grip icon as leftmost element inside the button
- Keep the rest of the card clickable for selection

```tsx
interface CompactActivityCardProps {
  activity: LegacyActivity;
  isNextActivity?: boolean;
  dayId: string;
  previewTime?: string;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;  // NEW
}

export function CompactActivityCard({ 
  activity, 
  isNextActivity, 
  dayId,
  previewTime,
  isDragging,
  dragHandleProps
}: CompactActivityCardProps) {
  // ...existing code...

  return (
    <div
      className={cn(
        "w-full flex items-center gap-1.5 rounded-md text-left transition-all",
        "border",
        categoryColors[activity.category],
        // ...other classes
      )}
    >
      {/* Drag handle - leftmost element */}
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className={cn(
            "flex-shrink-0 w-6 h-full flex items-center justify-center",
            "text-muted-foreground/40 hover:text-muted-foreground",
            "cursor-grab active:cursor-grabbing touch-none",
            "transition-colors rounded-l-md hover:bg-muted/50",
            isDragging && "cursor-grabbing text-primary"
          )}
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Rest of card content - clickable */}
      <button
        onClick={handleClick}
        className="flex-1 flex items-center gap-2 px-2 py-1.5"
      >
        {/* Category icon */}
        <div className={cn(...)}>
          {isCompleted ? <CheckCircle2 /> : <Icon />}
        </div>
        
        {/* Time + Title */}
        <div className="flex-1 min-w-0">
          {displayTime && <span className="text-xs font-mono">{displayTime}</span>}
          <span className="text-sm truncate">{activity.title}</span>
        </div>
        
        {/* Location indicator */}
        {activity.location && <MapPin className="w-3 h-3" />}
      </button>
    </div>
  );
}
```

---

### File 3: `src/components/itinerary/DatabaseActivityCard.tsx`

**Changes:**
- Accept `dragHandleProps` from parent
- Add grip icon to the left of the checkbox
- Ensure touch target is at least 44px wide

```tsx
interface DatabaseActivityCardProps {
  activity: LegacyActivity;
  onOpenMap?: (location: SelectedLocation) => void;
  onOpenPhoto?: (...) => void;
  isNextActivity?: boolean;
  onSelect?: () => void;
  previewTime?: string | null;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;  // NEW
}

export function DatabaseActivityCard({ 
  activity, 
  onOpenMap, 
  onOpenPhoto, 
  isNextActivity,
  onSelect,
  previewTime,
  isDragging,
  dragHandleProps
}: DatabaseActivityCardProps) {
  // ...existing code...

  return (
    <div className={cn("relative p-4 rounded-lg border...", isDragging && "shadow-lg")}>
      <div className="flex items-start gap-3">
        {/* Drag handle - before checkbox */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className={cn(
              "flex-shrink-0 w-6 flex items-center justify-center self-stretch",
              "text-muted-foreground/40 hover:text-muted-foreground",
              "cursor-grab active:cursor-grabbing touch-none",
              "transition-colors -ml-2 rounded-l hover:bg-muted/30",
              isDragging && "cursor-grabbing text-primary"
            )}
            aria-label="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        <AnimatedCheckbox checked={isCompleted} onCheckedChange={handleToggleComplete} />
        
        {/* Rest of card content */}
        <div onClick={onSelect} className="flex-1 min-w-0">
          {/* ...existing content... */}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1">...</div>
      </div>
    </div>
  );
}
```

---

## Visual Styling

### Handle Appearance
- **Color**: `text-muted-foreground/40` (subtle, not distracting)
- **Hover**: `text-muted-foreground` + light background
- **Active/Dragging**: `text-primary` (feedback during drag)

### Touch Target
- Minimum 24px width (compact), 32px (full card)
- Full height of the card for easy targeting
- `touch-none` CSS to prevent scroll interference

### Separator Visual (Optional)
Add a subtle border or gradient on the right edge of the handle area:
```css
border-right: 1px solid hsl(var(--border) / 0.3);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/itinerary/DraggableActivity.tsx` | Remove external handle, pass dragHandleProps to children |
| `src/components/dashboard/CompactActivityCard.tsx` | Add drag handle as leftmost element, accept dragHandleProps |
| `src/components/itinerary/DatabaseActivityCard.tsx` | Add drag handle before checkbox, accept dragHandleProps |

---

## Mobile Touch Behavior

With the handle properly separated:

1. **Swiping anywhere else**: Scrolls the list
2. **Touching the handle**: Initiates drag (after activation constraint)
3. **Tapping the card content**: Opens activity details

This follows the pattern used by iOS Reminders, Google Keep, and other drag-reorderable list UIs.

---

## Alternative: Handle on Right Side

Some apps (like Notion) put the handle on the right. This could work but:
- Conflicts with action buttons (heart, note, camera)
- Less discoverable in LTR reading order

**Recommendation**: Keep handle on left, it's the standard pattern.
