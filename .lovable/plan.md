
# Make Candidate Row Clickable to Open Link

## Summary

Update the `AccommodationCard` component so that tapping on the title/domain area opens the accommodation's URL in a new tab.

---

## Changes

### File: `src/components/dashboard/DetailPanels/stay/AccommodationCard.tsx`

**Current structure (lines 79-86):**
```tsx
<div className="flex-1 min-w-0">
  <p className={cn('font-medium truncate', ...)}>
    {accommodation.title}
  </p>
  {domain && (
    <p className="text-xs text-muted-foreground truncate">{domain}</p>
  )}
</div>
```

**Updated structure:**
- Wrap the content area in a clickable element
- Add click handler to open the URL in a new tab (if URL exists)
- Add hover styling and cursor pointer when URL is present
- Prevent the click from triggering drag events

```tsx
<div 
  className={cn(
    "flex-1 min-w-0",
    accommodation.url && "cursor-pointer hover:bg-accent/50 rounded-md -my-1 py-1 -mx-1 px-1 transition-colors"
  )}
  onClick={(e) => {
    if (accommodation.url) {
      e.stopPropagation();
      window.open(accommodation.url, '_blank');
    }
  }}
>
  <p className={cn('font-medium truncate', isDeprioritized && 'text-muted-foreground')}>
    {accommodation.title}
  </p>
  {domain && (
    <p className="text-xs text-muted-foreground truncate">{domain}</p>
  )}
</div>
```

**Also apply the same change to `StaticAccommodationCard` (lines 145-152)** for consistency with deprioritized items.

---

## Behavior

- **If URL exists**: Tapping the title/domain area opens the link in a new tab
- **If no URL**: No action on tap (no cursor change either)
- **Drag handle**: Remains separate - dragging still works via the grip icon
- **Dropdown menu**: Still accessible via the ⋮ button

---

## Files Summary

| File | Action |
|------|--------|
| `src/components/dashboard/DetailPanels/stay/AccommodationCard.tsx` | Update both `AccommodationCard` and `StaticAccommodationCard` to make title area clickable |
