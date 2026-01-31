

## Site Assessment Fixes - Implementation Plan

This plan addresses 10 categories of issues from the site assessment, organized into 5 phases from critical security fixes to test coverage improvements.

---

## Phase 1: Critical Security & Compatibility Fixes

### Task 1.1: Upgrade React Router
**Current:** `^6.30.1` | **Target:** `^7.13.0`

React Router v7 addresses XSS vulnerabilities and maintains backward compatibility with v6 patterns. No code changes needed - just a version bump.

### Task 1.2: Fix react-leaflet Compatibility
**Current:** `^5.0.0` (requires React 19) | **Target:** `4.2.1` (supports React 18)

The app uses Leaflet directly via `L.map()` API (not React-Leaflet components), so downgrading won't require code changes.

### Task 1.3: Run Security Audit
Run `npm audit fix` to address remaining vulnerabilities. If transitive dependency issues persist, add overrides for `glob` and `esbuild`.

---

## Phase 2: Code Quality Fixes

### Task 2.1: Fix TypeScript `any` Usage
**Files:** `MapModal.tsx` (lines 19, 52, 92), `OverviewMap.tsx` (line 19)

The Leaflet icon fix uses `as any` to delete internal properties. Create a proper type declaration file:

**New file: `src/types/leaflet.d.ts`**
- Extends Leaflet types to include the internal `_getIconUrl` method
- Adds type for `_leaflet_id` property on HTML elements

### Task 2.2: Fix Empty Interface
**File:** `src/components/ui/command.tsx` (line 24)

Convert `interface CommandDialogProps extends DialogProps {}` to type alias: `type CommandDialogProps = DialogProps;`

Note: The textarea.tsx empty interface issue mentioned in the assessment is actually not an issue - that interface can be extended by consumers.

### Task 2.3: Fix require() in ES Module
**File:** `tailwind.config.ts`

Replace `require("tailwindcss-animate")` with ESM import.

### Task 2.4: Add ESLint Comments for Hook Dependency Warnings
**Files:** `MapModal.tsx` (line 132), `OverviewMap.tsx` (line 124)

Add documented eslint-disable comments explaining why certain dependencies are intentionally omitted from the map initialization effects.

### Task 2.5: Fix Fast Refresh Warnings
Currently, types are exported alongside components (e.g., `TabId` in `BottomNav.tsx`, `MapLocation` in `OverviewMap.tsx`). Move these to separate type files:

**New files:**
- `src/types/navigation.ts` - Export `TabId` type
- `src/types/map.ts` - Export `MapLocation` interface

Update imports in `BottomNav.tsx`, `Index.tsx`, `OverviewMap.tsx`, and `MapTab.tsx`.

---

## Phase 3: Bundle Size Optimization

### Current State
Bundle size: ~908 kB (target: < 500 kB)

### Task 3.1: Remove Unused UI Components & Dependencies

**Verified unused components:**
| Component | Dependency |
|-----------|------------|
| `chart.tsx` | recharts (2.15.4) |
| `carousel.tsx` | embla-carousel-react (8.6.0) |
| `resizable.tsx` | react-resizable-panels (2.1.9) |
| `sidebar.tsx` | - |
| `menubar.tsx` | @radix-ui/react-menubar |
| `navigation-menu.tsx` | @radix-ui/react-navigation-menu |

**Action:**
- Delete the 6 unused component files
- Uninstall: `recharts`, `embla-carousel-react`, `react-resizable-panels`
- (Radix packages can stay - they're small and might be needed later)

### Task 3.2: Add Code Splitting
Lazy load heavy tabs (Map, Guide) since they contain Leaflet and substantial content.

**File:** `src/pages/Index.tsx`
- Use `React.lazy()` for MapTab and GuideTab
- Wrap in `Suspense` with loading fallback

### Task 3.3: Configure Vite Chunking
**File:** `vite.config.ts`

Add manual chunks to separate vendor code:
- `leaflet` chunk for mapping library
- `vendor` chunk for React ecosystem

---

## Phase 4: Testing Infrastructure

### Current State
Only one placeholder test exists (`src/test/example.test.ts`). Test infrastructure is set up but unused.

### Task 4.1: Add Utility Tests
**New file:** `src/test/utils.test.ts`

Test the `cn()` utility function:
- Merging class names
- Conditional classes
- Tailwind class deduplication

### Task 4.2: Add Hook Tests
**New file:** `src/test/hooks/use-mobile.test.tsx`

Test the `useIsMobile` hook:
- Desktop width detection
- Mobile width detection
- Window resize handling

---

## Phase 5: Verification

After all changes, run this verification sequence:

1. Clean install: `rm -rf node_modules package-lock.json && npm install`
2. Type check: `npx tsc --noEmit`
3. Lint: `npm run lint`
4. Test: `npm test`
5. Build: `npm run build`
6. Security audit: `npm audit`

---

## Files Summary

| File | Action | Phase |
|------|--------|-------|
| `package.json` | Modify (upgrade deps, remove unused) | 1, 3 |
| `src/types/leaflet.d.ts` | Create | 2 |
| `src/types/navigation.ts` | Create | 2 |
| `src/types/map.ts` | Create | 2 |
| `src/components/map/MapModal.tsx` | Modify (types, eslint comment) | 2 |
| `src/components/map/OverviewMap.tsx` | Modify (types, eslint comment, import) | 2 |
| `src/components/ui/command.tsx` | Modify (type alias) | 2 |
| `tailwind.config.ts` | Modify (ESM import) | 2 |
| `src/components/BottomNav.tsx` | Modify (import type) | 2 |
| `src/pages/Index.tsx` | Modify (code splitting, import) | 2, 3 |
| `src/components/MapTab.tsx` | Modify (import type) | 2 |
| `vite.config.ts` | Modify (chunking config) | 3 |
| `src/components/ui/chart.tsx` | Delete | 3 |
| `src/components/ui/carousel.tsx` | Delete | 3 |
| `src/components/ui/resizable.tsx` | Delete | 3 |
| `src/components/ui/sidebar.tsx` | Delete | 3 |
| `src/components/ui/menubar.tsx` | Delete | 3 |
| `src/components/ui/navigation-menu.tsx` | Delete | 3 |
| `src/test/utils.test.ts` | Create | 4 |
| `src/test/hooks/use-mobile.test.tsx` | Create | 4 |

---

## Expected Outcomes

| Metric | Before | After |
|--------|--------|-------|
| Bundle Size | ~908 kB | < 500 kB |
| Security Vulnerabilities | Multiple | 0 |
| TypeScript `any` usage | 4 | 0 |
| Test Files | 1 placeholder | 3 real tests |
| Unused Dependencies | 3+ | 0 |

