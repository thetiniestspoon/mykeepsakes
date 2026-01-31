# Implementation Plan: Site Assessment Fixes

## Executive Summary

This plan addresses 10 categories of issues found in the site assessment. The work is organized into 5 phases, starting with critical security fixes and ending with test coverage improvements.

---

## Phase 1: Critical Security Fixes (Priority: CRITICAL)

### Task 1.1: Fix React Router XSS Vulnerability
**Complexity:** Medium | **Files:** `package.json`

```bash
npm install react-router-dom@^7.13.0
```

Verify routes work after upgrade. React Router v7 maintains backward compatibility.

---

### Task 1.2: Fix Dependency Conflict - react-leaflet
**Complexity:** Low | **Files:** `package.json`

```bash
npm install react-leaflet@4.2.1
```

Downgrade to v4.x which supports React 18. Existing code uses Leaflet API directly, so no code changes needed.

---

### Task 1.3: Address Remaining Security Vulnerabilities
**Complexity:** Low-Medium | **Files:** `package.json`

```bash
npm audit fix
```

If issues persist, add overrides to package.json:
```json
{
  "overrides": {
    "glob": "^11.0.0",
    "esbuild": "^0.25.0"
  }
}
```

---

## Phase 2: Code Quality Fixes (Priority: HIGH)

### Task 2.1: Fix TypeScript `any` Type Usage
**Files:** `src/components/map/MapModal.tsx`, `src/components/map/OverviewMap.tsx`

Create `src/types/leaflet.d.ts`:
```typescript
import 'leaflet';

declare module 'leaflet' {
  namespace Icon {
    interface Default {
      _getIconUrl?: () => string;
    }
  }
}

interface LeafletHTMLElement extends HTMLElement {
  _leaflet_id?: number;
}
```

---

### Task 2.2: Fix Empty Interfaces
**Files:** `src/components/ui/command.tsx`, `src/components/ui/textarea.tsx`

Convert empty interfaces to type aliases:
```typescript
// command.tsx - line 24
type CommandDialogProps = DialogProps;

// textarea.tsx - line 5
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;
```

---

### Task 2.3: Fix require() in ES Module
**Files:** `tailwind.config.ts`

```typescript
import tailwindcssAnimate from "tailwindcss-animate";

// At plugins section:
plugins: [tailwindcssAnimate],
```

---

### Task 2.4: Fix React Hook Dependency Warnings
**Files:** `src/components/map/MapModal.tsx:132`, `src/components/map/OverviewMap.tsx:124`

Add eslint-disable comments with explanation:
```typescript
// MapModal.tsx
// eslint-disable-next-line react-hooks/exhaustive-deps -- Map initialization only on open state change
}, [open]);

// OverviewMap.tsx
// eslint-disable-next-line react-hooks/exhaustive-deps -- Map initialized once on mount
}, []);
```

---

### Task 2.5: Fix Fast Refresh Warnings
**Files:** Create new type files, update imports

1. Create `src/types/navigation.ts`:
```typescript
export type TabId = 'itinerary' | 'lodging' | 'map' | 'guide' | 'favorites' | 'contacts';
```

2. Create `src/types/map.ts`:
```typescript
export interface MapLocation {
  id: string;
  lat: number;
  lng: number;
  name: string;
  category: string;
  address?: string;
  dayId?: string;
  dayLabel?: string;
}
```

3. Update imports in `BottomNav.tsx`, `Index.tsx`, `OverviewMap.tsx`, `MapTab.tsx`

---

## Phase 3: Build/Performance Optimization (Priority: HIGH)

### Task 3.1: Reduce Bundle Size
**Current:** 908 kB | **Target:** < 500 kB

**Step 1: Remove unused components**

Verify and remove if unused:
- `src/components/ui/chart.tsx` (imports recharts)
- `src/components/ui/navigation-menu.tsx`
- `src/components/ui/menubar.tsx`
- `src/components/ui/carousel.tsx`
- `src/components/ui/sidebar.tsx`
- `src/components/ui/resizable.tsx`

```bash
npm uninstall recharts  # If chart.tsx removed
```

**Step 2: Add code splitting**

In `src/pages/Index.tsx`:
```typescript
import { lazy, Suspense } from 'react';

const MapTab = lazy(() => import('@/components/MapTab'));
const GuideTab = lazy(() => import('@/components/GuideTab'));

// In render:
{activeTab === 'map' && (
  <Suspense fallback={<div className="flex justify-center py-12">Loading...</div>}>
    <MapTab />
  </Suspense>
)}
```

**Step 3: Configure Vite chunking**

In `vite.config.ts`:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'leaflet': ['leaflet'],
        'vendor': ['react', 'react-dom', 'react-router-dom'],
      }
    }
  },
  chunkSizeWarningLimit: 500,
}
```

---

### Task 3.2: Update Browserslist Data
```bash
npx update-browserslist-db@latest
```

---

## Phase 4: Testing Infrastructure (Priority: MEDIUM)

### Task 4.1: Create Test Files

**`src/test/utils.test.ts`:**
```typescript
import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
  });

  it('deduplicates Tailwind classes', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });
});
```

**`src/test/hooks/use-mobile.test.tsx`:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIsMobile } from '@/hooks/use-mobile';

describe('useIsMobile', () => {
  it('returns false for desktop width', () => {
    vi.stubGlobal('innerWidth', 1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true for mobile width', () => {
    vi.stubGlobal('innerWidth', 500);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });
});
```

---

## Phase 5: Verification

### Final Verification Steps
```bash
# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Type check
npx tsc --noEmit

# 3. Lint
npm run lint

# 4. Test
npm test

# 5. Build
npm run build

# 6. Security audit
npm audit
```

---

## Task Sequencing Diagram

```
Phase 1 (Critical)           Phase 2 (Quality)           Phase 3 (Perf)
┌─────────────────┐          ┌─────────────────┐         ┌─────────────────┐
│ 1.1 Router fix  │──┐       │ 2.1 Fix `any`   │         │ 3.1 Bundle size │
│ 1.2 Leaflet fix │  │       │ 2.2 Interfaces  │         │ 3.2 Browserslist│
│ 1.3 Other vulns │◀─┘       │ 2.3 require()   │         └─────────────────┘
└─────────────────┘          │ 2.4 Hook deps   │                  │
         │                   │ 2.5 Fast Refresh│                  │
         ▼                   └─────────────────┘                  ▼
                                      │                  ┌─────────────────┐
                                      ▼                  │ Phase 4: Tests  │
                             ┌─────────────────┐         └─────────────────┘
                             │ Phase 5: Verify │                  │
                             └─────────────────┘◀─────────────────┘
```

---

## Quick Reference: Files to Modify

| File | Tasks |
|------|-------|
| `package.json` | 1.1, 1.2, 1.3 |
| `src/components/map/MapModal.tsx` | 2.1, 2.4 |
| `src/components/map/OverviewMap.tsx` | 2.1, 2.4, 2.5 |
| `src/components/ui/command.tsx` | 2.2 |
| `src/components/ui/textarea.tsx` | 2.2 |
| `tailwind.config.ts` | 2.3 |
| `src/components/BottomNav.tsx` | 2.5 |
| `src/pages/Index.tsx` | 2.5, 3.1 |
| `vite.config.ts` | 3.1 |
| `src/types/leaflet.d.ts` | 2.1 (new) |
| `src/types/navigation.ts` | 2.5 (new) |
| `src/types/map.ts` | 2.5 (new) |
