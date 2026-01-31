

## Fix Broken URL: The Mews Restaurant

A simple data correction to fix the broken link for The Mews Restaurant.

---

### The Problem

The current URL `https://mews.com/` redirects to Mews Systems (a hospitality software company) instead of the Provincetown restaurant.

### The Fix

Update 2 occurrences in `src/lib/itinerary-data.ts`:

| Location | Line | Current | Corrected |
|----------|------|---------|-----------|
| Day 1 - Dinner at The Mews | 131 | `https://mews.com/` | `https://mewsptown.com/` |
| Restaurants Guide - The Mews | 459 | `https://mews.com/` | `https://mewsptown.com/` |

---

### Technical Details

**File:** `src/lib/itinerary-data.ts`

**Change 1 (Line 131):**
```typescript
// Before
link: 'https://mews.com/',

// After
link: 'https://mewsptown.com/',
```

**Change 2 (Line 459):**
```typescript
// Before
link: 'https://mews.com/',

// After
link: 'https://mewsptown.com/',
```

---

This is a 2-line fix that will restore functionality to the "View Menu" button on Day 1 and the website link in the Restaurants Guide.

