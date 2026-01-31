

## Update Trip End Date References - Implementation Plan

After extending the trip to 8 days (ending August 1, 2026), several UI components still display the old end date. This plan updates all date references across the codebase.

---

## Files to Update

| File | Location | Current Value | New Value |
|------|----------|---------------|-----------|
| `src/components/ItineraryTab.tsx` | Line 697 | `July 25 - 31, 2026` | `July 25 - August 1, 2026` |
| `src/lib/itinerary-data.ts` | Line 91 (comment) | `Family Week typically in late July` | `8-day Family Week, July 25 - August 1` |
| `index.html` | Lines 11, 24-25 | `Lovable App` | `Family Week 2026` |

---

## Implementation Details

### 1. Update ItineraryTab Date Display

**File:** `src/components/ItineraryTab.tsx`

**Line 697:**
```tsx
// Current:
<p className="text-muted-foreground">July 25 - 31, 2026</p>

// Updated:
<p className="text-muted-foreground">July 25 - August 1, 2026</p>
```

This is the main visible date range shown at the top of the Itinerary tab.

---

### 2. Update Itinerary Data Comment

**File:** `src/lib/itinerary-data.ts`

**Line 91:**
```typescript
// Current:
// Sample Itinerary - Family Week typically in late July

// Updated:
// Sample Itinerary - 8-day Family Week, July 25 - August 1
```

This keeps the code documentation accurate for future reference.

---

### 3. Update HTML Metadata

**File:** `index.html`

**Line 11:**
```html
<!-- Current -->
<title>Lovable App</title>

<!-- Updated -->
<title>Family Week 2026</title>
```

**Lines 24-25:**
```html
<!-- Current -->
<meta property="og:title" content="Lovable App">
<meta name="twitter:title" content="Lovable App">

<!-- Updated -->
<meta property="og:title" content="Family Week 2026">
<meta name="twitter:title" content="Family Week 2026">
```

This improves branding when the app is shared or bookmarked.

---

## Files Already Correct

These files were reviewed and do **not** need changes:

| File | Reason |
|------|--------|
| `TripHeader.tsx` | Shows "Family Week 2026" without specific dates |
| `PinEntry.tsx` | Shows "Family Week 2026" without specific dates |
| `PinSetup.tsx` | Generic "MyKeepsakes" welcome, no trip dates |
| `itinerary-data.ts` Day 7 notes | "late July" is still accurate (July 31) |

---

## Summary

| Update | Impact |
|--------|--------|
| ItineraryTab header | Users see correct trip duration |
| Code comment | Developer documentation accuracy |
| HTML title/meta | Browser tab and social sharing show trip name |

---

## Total Changes

- **3 files modified**
- **5 text strings updated**
- **No functional code changes**

