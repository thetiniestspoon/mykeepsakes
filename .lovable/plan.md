# Itinerary Enhancement Plan

This plan covers implementing 7 major improvements to the Itinerary page: Today Mode with auto-scroll, swipe gestures, functional drag-and-drop reordering, quick-add button, visual timeline view, weather integration, and memory quick-capture prompts.

---

## ✅ COMPLETED - Implementation Summary

All 7 features have been implemented:

### Features Implemented
1. ✅ **Today Mode with Auto-Scroll** - Filter to today's activities with automatic scroll to next planned item
2. ✅ **Swipe Gestures** - Mobile swipe right to complete, swipe left for action menu  
3. ✅ **Functional Drag-and-Drop** - Reorder handles now persist changes to database
4. ✅ **Quick-Add Activity Button** - FAB and inline quick-add row at end of each day
5. ✅ **Visual Timeline View** - Time-blocked layout with "Now" indicator during active trips
6. ✅ **Weather Integration** - Weather badges in day headers (mock data, ready for API key)
7. ✅ **Memory Quick-Capture** - Prompt dialog after marking activity "done"

---

## Files Created

| File | Purpose |
|------|---------|
| `src/hooks/use-today-mode.ts` | Today mode state and auto-scroll |
| `src/hooks/use-reorder-items.ts` | Drag-drop persistence mutation |
| `src/hooks/use-weather.ts` | Weather data hook (with mock data) |
| `src/components/itinerary/TodayModeToggle.tsx` | Timeline vs Today toggle |
| `src/components/itinerary/SwipeableActivityCard.tsx` | Touch gesture wrapper |
| `src/components/itinerary/QuickAddButton.tsx` | Floating action button |
| `src/components/itinerary/QuickAddRow.tsx` | Inline add row |
| `src/components/itinerary/TimelineView.tsx` | Timeline layout container |
| `src/components/itinerary/TimelineItem.tsx` | Timeline activity item |
| `src/components/itinerary/NowIndicator.tsx` | Current time indicator |
| `src/components/itinerary/WeatherBadge.tsx` | Weather display component |
| `src/components/itinerary/MemoryPromptDialog.tsx` | Post-completion prompt |

## Files Modified

| File | Changes |
|------|---------|
| `src/components/DatabaseItineraryTab.tsx` | Add Today toggle, FAB, Cards/Timeline view toggle |
| `src/components/itinerary/DatabaseDayCard.tsx` | Swipe wrapper, reorder logic, quick-add row, weather badge |
| `src/components/itinerary/DatabaseActivityCard.tsx` | Added data-activity-id attribute, isNextActivity prop |

---

## Future Enhancements (Optional)

1. **Weather API Integration** - Add OpenWeatherMap API key and edge function for real weather data
2. **Memory Capture Dialog** - Wire up photo upload flow from memory prompt
3. **Activity Editor Integration** - Connect swipe "Edit" action to activity editor sheet
4. **Delete Activity** - Implement delete mutation for swipe delete action
