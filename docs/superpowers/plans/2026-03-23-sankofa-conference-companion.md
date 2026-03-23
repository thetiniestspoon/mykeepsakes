# Sankofa Conference Companion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate MyKeepsakes from Lovable to Vercel with 4 new conference companion features (reflection capture, dispatches, connections, insight tagging), validated by a Sankofa Conference trip scaffold.

**Architecture:** Extend existing Supabase-backed React app with new columns on `memories` and `family_contacts`, one new `dispatch_items` table, and 4 new UI feature areas. All new features follow existing hook/mutation/dialog patterns. Migration is env-swap + cleanup.

**Tech Stack:** React 18, TypeScript, Vite, Supabase (PostgreSQL + Storage), TanStack React Query, shadcn/ui, Tailwind CSS, Leaflet, Vitest

**Spec:** `docs/superpowers/specs/2026-03-23-sankofa-conference-companion-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `vercel.json` | Vercel deployment config (SPA routing) |
| `supabase/migrations/20260323000000_conference_companion.sql` | Schema changes: new columns + dispatch_items table |
| `src/types/conference.ts` | New types: MemoryType, InsightTag, DispatchItem, Connection |
| `src/hooks/use-reflections.ts` | Create/query reflections (filtered memories) |
| `src/hooks/use-dispatches.ts` | Create/manage/share dispatches |
| `src/hooks/use-connections.ts` | Trip-scoped contact CRUD |
| `src/components/reflection/ReflectionFAB.tsx` | Floating action button with expandable menu |
| `src/components/reflection/ReflectionCaptureSheet.tsx` | Bottom sheet for quick text-first capture |
| `src/components/reflection/TagChips.tsx` | Reusable tag chip selector component |
| `src/components/dispatch/DispatchEditor.tsx` | Curate day content into a dispatch |
| `src/components/dispatch/DispatchPreview.tsx` | Preview dispatch before sharing |
| `src/components/connections/ConnectionCaptureSheet.tsx` | Quick connection entry bottom sheet |
| `src/components/connections/ConnectionCard.tsx` | Display card for a connection |
| `src/components/PeopleTab.tsx` | Trip-scoped connections list |
| `src/components/FilterBar.tsx` | Tag-based filter for trip view |
| `src/pages/SharedDispatch.tsx` | Public read-only dispatch view |
| `scripts/seed-sankofa.ts` | Seed script for Sankofa trip scaffold |

### Modified Files

| File | Changes |
|------|---------|
| `package.json` | Remove `lovable-tagger` |
| `vite.config.ts` | Remove lovable-tagger plugin reference |
| `src/types/trip.ts` | Extend Memory, FamilyContact interfaces; add MemoryType |
| `src/integrations/supabase/types.ts` | Regenerate after migration |
| `src/App.tsx` | Add `/shared/:token/dispatch/:id` route |
| `src/pages/Index.tsx` | Add PeopleTab, FilterBar, ReflectionFAB |
| `src/components/dashboard/DashboardLayout.tsx` | Add People tab to navigation |
| `src/hooks/use-memories.ts` | Filter by memory_type in queries |
| `src/hooks/use-trip-data.ts` | Extend family contacts hooks for trip_id scoping |
| `src/hooks/use-sharing.ts` | Add dispatch share link creation |
| `src/hooks/use-export.ts` | Add tag-based filtering to export |
| `src/components/album/MemoryCaptureDialog.tsx` | Add tag chips to existing dialog |
| `src/components/sharing/ShareDialog.tsx` | Add dispatch sharing option |

---

## Task 1: Migration — Remove Lovable dependencies

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `vercel.json`

- [ ] **Step 1: Read current vite.config.ts to find lovable-tagger usage**

Run: `cat vite.config.ts`

- [ ] **Step 2: Remove lovable-tagger from package.json**

```bash
cd "/c/Users/shawn/OneDrive/Documents/Agentic Design Lab - Local Foundry/Git Repositories/mykeepsakes"
npm uninstall lovable-tagger
```

- [ ] **Step 3: Remove lovable-tagger plugin from vite.config.ts**

Remove the `componentTagger()` import and its usage in the plugins array. Keep all other config intact.

- [ ] **Step 4: Create vercel.json for SPA routing**

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

- [ ] **Step 5: Verify build succeeds**

Run: `npm run build`
Expected: Build completes without errors

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts vercel.json
git commit -m "chore: remove lovable-tagger, add vercel.json for deployment"
```

---

## Task 2: Database migration — Conference companion schema

**Files:**
- Create: `supabase/migrations/20260323000000_conference_companion.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- Conference Companion schema extensions
-- Spec: docs/superpowers/specs/2026-03-23-sankofa-conference-companion-design.md

-- 1. Extend memories table
ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS memory_type text NOT NULL DEFAULT 'photo',
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS speaker text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS session_title text DEFAULT NULL;

COMMENT ON COLUMN memories.memory_type IS 'photo | reflection | dispatch';
COMMENT ON COLUMN memories.tags IS 'Array of: insight, quote, training-seed, personal, logistics';

-- 2. Add tags to itinerary_items
ALTER TABLE itinerary_items
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT NULL;

-- 3. Extend family_contacts for trip-scoped connections
ALTER TABLE family_contacts
  ADD COLUMN IF NOT EXISTS trip_id uuid REFERENCES trips(id) ON DELETE CASCADE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS organization text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS met_context text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS day_id uuid REFERENCES itinerary_days(id) ON DELETE SET NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS photo_path text DEFAULT NULL;

-- 4. Create dispatch_items table
CREATE TABLE IF NOT EXISTS dispatch_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id uuid NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  section text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dispatch_items_item_type_check CHECK (item_type IN ('reflection', 'activity', 'photo')),
  CONSTRAINT dispatch_items_section_check CHECK (section IN ('scene', 'insight', 'closing'))
);

-- Note: item_id is polymorphic (no FK constraint), matching the favorites pattern

-- 5. Extend trip_share_links for dispatch sharing
ALTER TABLE trip_share_links
  ADD COLUMN IF NOT EXISTS dispatch_id uuid REFERENCES memories(id) ON DELETE CASCADE DEFAULT NULL;

-- 6. RLS for dispatch_items (match existing public pattern)
ALTER TABLE dispatch_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for dispatch_items" ON dispatch_items FOR ALL USING (true) WITH CHECK (true);

-- 7. Performance indexes
CREATE INDEX IF NOT EXISTS idx_memories_tags ON memories USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_memories_memory_type ON memories (memory_type);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_tags ON itinerary_items USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_family_contacts_trip_id ON family_contacts (trip_id);
CREATE INDEX IF NOT EXISTS idx_family_contacts_day_id ON family_contacts (day_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_items_dispatch_id ON dispatch_items (dispatch_id);
CREATE INDEX IF NOT EXISTS idx_trip_share_links_dispatch_id ON trip_share_links (dispatch_id);
```

- [ ] **Step 2: Verify migration syntax**

Run: `cat supabase/migrations/20260323000000_conference_companion.sql`
Verify: No syntax errors, all referenced tables exist in prior migrations.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260323000000_conference_companion.sql
git commit -m "feat(db): add conference companion schema - memories, contacts, dispatches"
```

---

## Task 3: TypeScript types — Conference companion types

**Files:**
- Create: `src/types/conference.ts`
- Modify: `src/types/trip.ts`

- [ ] **Step 1: Create conference types file**

```typescript
// src/types/conference.ts
// Conference companion feature types

export type MemoryType = 'photo' | 'reflection' | 'dispatch';

export type InsightTag = 'insight' | 'quote' | 'training-seed' | 'personal' | 'logistics';

export const INSIGHT_TAGS: { value: InsightTag; label: string; color: string }[] = [
  { value: 'insight', label: 'Insight', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'quote', label: 'Quote', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'training-seed', label: 'Training Seed', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'personal', label: 'Personal', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { value: 'logistics', label: 'Logistics', color: 'bg-gray-100 text-gray-800 border-gray-300' },
];

export interface DispatchItem {
  id: string;
  dispatch_id: string;
  item_type: 'reflection' | 'activity' | 'photo';
  item_id: string;
  sort_order: number;
  section: 'scene' | 'insight' | 'closing';
  created_at: string;
}

export interface Connection {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  organization: string | null;
  met_context: string | null;
  trip_id: string | null;
  day_id: string | null;
  photo_path: string | null;
  relationship: string | null;
  category: string;
  emergency_info: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Extend Memory interface in trip.ts**

Add to the existing `Memory` interface in `src/types/trip.ts`:

```typescript
// Add these fields to the Memory interface:
  memory_type: 'photo' | 'reflection' | 'dispatch';
  tags: string[] | null;
  speaker: string | null;
  session_title: string | null;
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: Type errors in components that construct Memory objects (will be fixed in subsequent tasks)

- [ ] **Step 4: Commit**

```bash
git add src/types/conference.ts src/types/trip.ts
git commit -m "feat(types): add conference companion types - MemoryType, InsightTag, DispatchItem, Connection"
```

---

## Task 4: Tag Chips — Reusable tag selector component

**Files:**
- Create: `src/components/reflection/TagChips.tsx`
- Test: `src/test/components/TagChips.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/test/components/TagChips.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TagChips } from '@/components/reflection/TagChips';

describe('TagChips', () => {
  it('renders all 5 tags', () => {
    render(<TagChips selected={[]} onToggle={() => {}} />);
    expect(screen.getByText('Insight')).toBeInTheDocument();
    expect(screen.getByText('Quote')).toBeInTheDocument();
    expect(screen.getByText('Training Seed')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Logistics')).toBeInTheDocument();
  });

  it('calls onToggle when a tag is tapped', () => {
    const onToggle = vi.fn();
    render(<TagChips selected={[]} onToggle={onToggle} />);
    fireEvent.click(screen.getByText('Insight'));
    expect(onToggle).toHaveBeenCalledWith('insight');
  });

  it('shows selected state for active tags', () => {
    render(<TagChips selected={['insight', 'quote']} onToggle={() => {}} />);
    const insightChip = screen.getByText('Insight').closest('button');
    expect(insightChip).toHaveClass('bg-blue-100');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/components/TagChips.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement TagChips component**

```typescript
// src/components/reflection/TagChips.tsx
import { INSIGHT_TAGS, type InsightTag } from '@/types/conference';

interface TagChipsProps {
  selected: InsightTag[];
  onToggle: (tag: InsightTag) => void;
}

export function TagChips({ selected, onToggle }: TagChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {INSIGHT_TAGS.map((tag) => {
        const isSelected = selected.includes(tag.value);
        return (
          <button
            key={tag.value}
            type="button"
            onClick={() => onToggle(tag.value)}
            className={`
              shrink-0 rounded-full px-3 py-2 text-sm font-medium border
              transition-colors min-h-[40px]
              ${isSelected ? tag.color : 'bg-white text-gray-500 border-gray-200'}
            `}
          >
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/components/TagChips.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/reflection/TagChips.tsx src/test/components/TagChips.test.tsx
git commit -m "feat: add TagChips component for insight tagging"
```

---

## Task 5: Reflection hooks — CRUD for reflections

**Files:**
- Create: `src/hooks/use-reflections.ts`
- Test: `src/test/hooks/use-reflections.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/test/hooks/use-reflections.test.tsx
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: '1', memory_type: 'reflection' }, error: null }),
    })),
  },
}));

// Mock react-query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return { ...actual };
});

import { useCreateReflection } from '@/hooks/use-reflections';

describe('use-reflections', () => {
  it('exports useCreateReflection hook', () => {
    expect(useCreateReflection).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/hooks/use-reflections.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement reflections hook**

```typescript
// src/hooks/use-reflections.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Memory } from '@/types/trip';
import type { InsightTag } from '@/types/conference';
import { toast } from 'sonner';

export function useReflections(tripId: string | undefined) {
  return useQuery({
    queryKey: ['reflections', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('memories')
        .select('*, media:memory_media(*), day:itinerary_days(*)')
        .eq('trip_id', tripId)
        .in('memory_type', ['reflection'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Memory[];
    },
    enabled: !!tripId,
  });
}

export function useCreateReflection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tripId,
      note,
      tags,
      speaker,
      sessionTitle,
      dayId,
      locationId,
    }: {
      tripId: string;
      note: string;
      tags?: InsightTag[];
      speaker?: string;
      sessionTitle?: string;
      dayId?: string;
      locationId?: string;
    }) => {
      const { data, error } = await supabase
        .from('memories')
        .insert({
          trip_id: tripId,
          note,
          memory_type: 'reflection',
          tags: tags?.length ? tags : null,
          speaker: speaker || null,
          session_title: sessionTitle || null,
          day_id: dayId || null,
          location_id: locationId || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Memory;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reflections', data.trip_id] });
      queryClient.invalidateQueries({ queryKey: ['memories', data.trip_id] });
      toast.success('Reflection saved');
    },
    onError: () => {
      toast.error('Failed to save reflection');
    },
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/hooks/use-reflections.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-reflections.ts src/test/hooks/use-reflections.test.tsx
git commit -m "feat: add reflection CRUD hooks"
```

---

## Task 6: Reflection Capture UI — FAB + Bottom Sheet

**Files:**
- Create: `src/components/reflection/ReflectionFAB.tsx`
- Create: `src/components/reflection/ReflectionCaptureSheet.tsx`

- [ ] **Step 1: Implement ReflectionCaptureSheet**

```typescript
// src/components/reflection/ReflectionCaptureSheet.tsx
import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, Camera, Loader2 } from 'lucide-react';
import { TagChips } from '@/components/reflection/TagChips';
import { useCreateReflection } from '@/hooks/use-reflections';
import { useUploadMemoryMedia } from '@/hooks/use-memories';
import type { InsightTag } from '@/types/conference';
import type { ItineraryDay } from '@/types/trip';

interface ReflectionCaptureSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  days: ItineraryDay[];
  currentDayId?: string;
}

export function ReflectionCaptureSheet({
  open,
  onOpenChange,
  tripId,
  days,
  currentDayId,
}: ReflectionCaptureSheetProps) {
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<InsightTag[]>([]);
  const [speaker, setSpeaker] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [showExtras, setShowExtras] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createReflection = useCreateReflection();
  const uploadMedia = useUploadMemoryMedia();

  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  const handleToggleTag = (tag: InsightTag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!note.trim()) return;
    try {
      const memory = await createReflection.mutateAsync({
        tripId,
        note: note.trim(),
        tags: tags.length > 0 ? tags : undefined,
        speaker: speaker.trim() || undefined,
        sessionTitle: sessionTitle.trim() || undefined,
        dayId: currentDayId,
      });

      if (photo) {
        await uploadMedia.mutateAsync({
          memoryId: memory.id,
          tripId,
          file: photo,
          mediaType: 'image',
        });
      }

      setNote('');
      setTags([]);
      setSpeaker('');
      setSessionTitle('');
      setPhoto(null);
      setShowExtras(false);
      onOpenChange(false);
    } catch {
      // Error handled by hook
    }
  };

  const isSaving = createReflection.isPending || uploadMedia.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-left">Quick Reflection</SheetTitle>
        </SheetHeader>

        <div className="space-y-3">
          <Textarea
            ref={textareaRef}
            placeholder="What just resonated? A thought, a quote, a feeling..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[80px] resize-none text-base"
            autoFocus
          />

          <TagChips selected={tags} onToggle={handleToggleTag} />

          <button
            type="button"
            onClick={() => setShowExtras(!showExtras)}
            className="flex items-center gap-1 text-sm text-muted-foreground"
          >
            {showExtras ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Speaker & session
          </button>

          {showExtras && (
            <div className="space-y-2">
              <Input
                placeholder="Speaker name"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
              />
              <Input
                placeholder="Session title"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4 mr-1" />
              {photo ? photo.name.slice(0, 20) : 'Photo'}
            </Button>

            <div className="flex-1" />

            <Button
              onClick={handleSave}
              disabled={!note.trim() || isSaving}
              className="min-w-[80px]"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Implement ReflectionFAB**

```typescript
// src/components/reflection/ReflectionFAB.tsx
import { useState } from 'react';
import { Plus, PenLine, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReflectionFABProps {
  onReflection: () => void;
  onConnection: () => void;
}

export function ReflectionFAB({ onReflection, onConnection }: ReflectionFABProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col-reverse items-end gap-2">
      {expanded && (
        <>
          <Button
            size="lg"
            variant="secondary"
            className="rounded-full shadow-lg h-12 px-4 gap-2 animate-in fade-in slide-in-from-bottom-2"
            onClick={() => { onReflection(); setExpanded(false); }}
          >
            <PenLine className="h-5 w-5" />
            Reflection
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="rounded-full shadow-lg h-12 px-4 gap-2 animate-in fade-in slide-in-from-bottom-2"
            onClick={() => { onConnection(); setExpanded(false); }}
          >
            <UserPlus className="h-5 w-5" />
            Connection
          </Button>
        </>
      )}
      <Button
        size="lg"
        className="rounded-full shadow-xl h-14 w-14 p-0"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds (components not yet wired into pages)

- [ ] **Step 4: Commit**

```bash
git add src/components/reflection/
git commit -m "feat: add ReflectionFAB and ReflectionCaptureSheet components"
```

---

## Task 7: Connections hooks — Trip-scoped contact CRUD

**Files:**
- Create: `src/hooks/use-connections.ts`

- [ ] **Step 1: Implement connections hook**

```typescript
// src/hooks/use-connections.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Connection } from '@/types/conference';
import { toast } from 'sonner';

export function useConnections(tripId: string | undefined) {
  return useQuery({
    queryKey: ['connections', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('family_contacts')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Connection[];
    },
    enabled: !!tripId,
  });
}

export function useCreateConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tripId,
      name,
      email,
      organization,
      metContext,
      dayId,
      phone,
    }: {
      tripId: string;
      name: string;
      email?: string;
      organization?: string;
      metContext?: string;
      dayId?: string;
      phone?: string;
    }) => {
      const { data, error } = await supabase
        .from('family_contacts')
        .insert({
          name,
          trip_id: tripId,
          email: email || null,
          organization: organization || null,
          met_context: metContext || null,
          day_id: dayId || null,
          phone: phone || null,
          category: 'connection',
        })
        .select()
        .single();
      if (error) throw error;
      return data as Connection;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['connections', data.trip_id] });
      toast.success('Connection saved');
    },
    onError: () => {
      toast.error('Failed to save connection');
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-connections.ts
git commit -m "feat: add trip-scoped connections hooks"
```

---

## Task 8: Connection Capture UI

**Files:**
- Create: `src/components/connections/ConnectionCaptureSheet.tsx`
- Create: `src/components/connections/ConnectionCard.tsx`
- Create: `src/components/PeopleTab.tsx`

- [ ] **Step 1: Implement ConnectionCaptureSheet**

```typescript
// src/components/connections/ConnectionCaptureSheet.tsx
import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Loader2 } from 'lucide-react';
import { useCreateConnection } from '@/hooks/use-connections';
import type { ItineraryDay } from '@/types/trip';

interface ConnectionCaptureSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  currentDayId?: string;
}

export function ConnectionCaptureSheet({
  open,
  onOpenChange,
  tripId,
  currentDayId,
}: ConnectionCaptureSheetProps) {
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [metContext, setMetContext] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  const createConnection = useCreateConnection();

  useEffect(() => {
    if (open && nameRef.current) {
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await createConnection.mutateAsync({
        tripId,
        name: name.trim(),
        email: email.trim() || undefined,
        organization: organization.trim() || undefined,
        metContext: metContext.trim() || undefined,
        dayId: currentDayId,
        phone: phone.trim() || undefined,
      });
      setName('');
      setOrganization('');
      setMetContext('');
      setEmail('');
      setPhone('');
      onOpenChange(false);
    } catch {
      // Error handled by hook
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-left">New Connection</SheetTitle>
        </SheetHeader>

        <div className="space-y-3">
          <Input
            ref={nameRef}
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Input
            placeholder="Role / Organization"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />
          <Textarea
            placeholder="How did you meet? What did you discuss?"
            value={metContext}
            onChange={(e) => setMetContext(e.target.value)}
            className="min-h-[60px] resize-none"
          />
          <div className="flex gap-2">
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!name.trim() || createConnection.isPending}
              className="min-w-[80px]"
            >
              {createConnection.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Implement ConnectionCard**

```typescript
// src/components/connections/ConnectionCard.tsx
import { Card, CardContent } from '@/components/ui/card';
import { User, Building, MessageSquare } from 'lucide-react';
import type { Connection } from '@/types/conference';

interface ConnectionCardProps {
  connection: Connection;
}

export function ConnectionCard({ connection }: ConnectionCardProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{connection.name}</h3>
            {connection.organization && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Building className="h-3 w-3" />
                {connection.organization}
              </p>
            )}
          </div>
        </div>
        {connection.met_context && (
          <p className="text-sm text-muted-foreground pl-11">
            <MessageSquare className="h-3 w-3 inline mr-1" />
            {connection.met_context}
          </p>
        )}
        {(connection.email || connection.phone) && (
          <div className="text-xs text-muted-foreground pl-11 space-x-3">
            {connection.email && <span>{connection.email}</span>}
            {connection.phone && <span>{connection.phone}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Implement PeopleTab**

```typescript
// src/components/PeopleTab.tsx
import { useConnections } from '@/hooks/use-connections';
import { ConnectionCard } from '@/components/connections/ConnectionCard';
import { Users } from 'lucide-react';

interface PeopleTabProps {
  tripId: string;
}

export function PeopleTab({ tripId }: PeopleTabProps) {
  const { data: connections = [], isLoading } = useConnections(tripId);

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  }

  if (connections.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No connections yet</p>
        <p className="text-xs mt-1">Tap + to add someone you meet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {connections.map((connection) => (
        <ConnectionCard key={connection.id} connection={connection} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/components/connections/ src/components/PeopleTab.tsx
git commit -m "feat: add connection capture UI - sheet, card, PeopleTab"
```

---

## Task 9: Filter Bar — Tag-based filtering

**Files:**
- Create: `src/components/FilterBar.tsx`

- [ ] **Step 1: Implement FilterBar**

```typescript
// src/components/FilterBar.tsx
import { INSIGHT_TAGS, type InsightTag } from '@/types/conference';

interface FilterBarProps {
  activeFilter: InsightTag | null;
  onFilterChange: (tag: InsightTag | null) => void;
}

export function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide border-b">
      <button
        type="button"
        onClick={() => onFilterChange(null)}
        className={`
          shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors
          ${activeFilter === null ? 'bg-primary text-primary-foreground border-primary' : 'bg-white text-gray-500 border-gray-200'}
        `}
      >
        All
      </button>
      {INSIGHT_TAGS.map((tag) => (
        <button
          key={tag.value}
          type="button"
          onClick={() => onFilterChange(activeFilter === tag.value ? null : tag.value)}
          className={`
            shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors
            ${activeFilter === tag.value ? tag.color : 'bg-white text-gray-500 border-gray-200'}
          `}
        >
          {tag.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FilterBar.tsx
git commit -m "feat: add FilterBar component for tag-based filtering"
```

---

## Task 10: Dispatch hooks — Create and share dispatches

**Files:**
- Create: `src/hooks/use-dispatches.ts`

- [ ] **Step 1: Implement dispatch hooks**

```typescript
// src/hooks/use-dispatches.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Memory } from '@/types/trip';
import type { DispatchItem } from '@/types/conference';
import { toast } from 'sonner';

export function useDispatches(tripId: string | undefined) {
  return useQuery({
    queryKey: ['dispatches', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      const { data, error } = await supabase
        .from('memories')
        .select('*, day:itinerary_days(*)')
        .eq('trip_id', tripId)
        .eq('memory_type', 'dispatch')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Memory[];
    },
    enabled: !!tripId,
  });
}

export function useDispatchItems(dispatchId: string | undefined) {
  return useQuery({
    queryKey: ['dispatch-items', dispatchId],
    queryFn: async () => {
      if (!dispatchId) return [];
      const { data, error } = await supabase
        .from('dispatch_items')
        .select('*')
        .eq('dispatch_id', dispatchId)
        .order('section')
        .order('sort_order');
      if (error) throw error;
      return data as DispatchItem[];
    },
    enabled: !!dispatchId,
  });
}

export function useCreateDispatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tripId,
      dayId,
      closingNote,
      items,
    }: {
      tripId: string;
      dayId: string;
      closingNote: string;
      items: Omit<DispatchItem, 'id' | 'dispatch_id' | 'created_at'>[];
    }) => {
      // 1. Create the dispatch memory record
      const { data: dispatch, error: dispatchError } = await supabase
        .from('memories')
        .insert({
          trip_id: tripId,
          day_id: dayId,
          memory_type: 'dispatch',
          note: closingNote || null,
        })
        .select()
        .single();
      if (dispatchError) throw dispatchError;

      // 2. Create dispatch items
      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('dispatch_items')
          .insert(
            items.map((item) => ({
              ...item,
              dispatch_id: dispatch.id,
            }))
          );
        if (itemsError) throw itemsError;
      }

      // 3. Create share token
      const { data: shareLink, error: shareError } = await supabase
        .from('trip_share_links')
        .insert({
          trip_id: tripId,
          dispatch_id: dispatch.id,
          permission: 'read',
        })
        .select()
        .single();
      if (shareError) throw shareError;

      return { dispatch, shareToken: shareLink.token };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dispatches', data.dispatch.trip_id] });
      queryClient.invalidateQueries({ queryKey: ['memories', data.dispatch.trip_id] });
      toast.success('Dispatch created');
    },
    onError: () => {
      toast.error('Failed to create dispatch');
    },
  });
}

export function useDispatchShareLink(dispatchId: string | undefined) {
  return useQuery({
    queryKey: ['dispatch-share-link', dispatchId],
    queryFn: async () => {
      if (!dispatchId) return null;
      const { data, error } = await supabase
        .from('trip_share_links')
        .select('*')
        .eq('dispatch_id', dispatchId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!dispatchId,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-dispatches.ts
git commit -m "feat: add dispatch CRUD and sharing hooks"
```

---

## Task 11: Dispatch Editor UI

**Files:**
- Create: `src/components/dispatch/DispatchEditor.tsx`
- Create: `src/components/dispatch/DispatchPreview.tsx`

- [ ] **Step 1: Implement DispatchEditor**

This is the largest single component. It shows the day's content with checkboxes, organizes into sections, and produces a dispatch.

```typescript
// src/components/dispatch/DispatchEditor.tsx
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Eye, Share2 } from 'lucide-react';
import { useReflections } from '@/hooks/use-reflections';
import { useCreateDispatch } from '@/hooks/use-dispatches';
import { useMemories } from '@/hooks/use-memories';
import { DispatchPreview } from '@/components/dispatch/DispatchPreview';
import type { Memory, ItineraryDay, ItineraryItem } from '@/types/trip';
import type { DispatchItem } from '@/types/conference';

interface DispatchEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  day: ItineraryDay;
  activities: ItineraryItem[];
}

export function DispatchEditor({
  open,
  onOpenChange,
  tripId,
  day,
  activities,
}: DispatchEditorProps) {
  const { data: allMemories = [] } = useMemories(tripId);
  const createDispatch = useCreateDispatch();

  // Filter to this day's content
  const dayReflections = useMemo(
    () => allMemories.filter((m) => m.day_id === day.id && m.memory_type === 'reflection'),
    [allMemories, day.id]
  );
  const dayPhotos = useMemo(
    () => allMemories.filter((m) => m.day_id === day.id && m.memory_type === 'photo' && m.media?.length),
    [allMemories, day.id]
  );
  const completedActivities = useMemo(
    () => activities.filter((a) => a.status === 'done'),
    [activities]
  );

  // Auto-select items tagged insight/quote/training-seed, exclude personal
  const [selectedReflections, setSelectedReflections] = useState<Set<string>>(() => {
    const auto = new Set<string>();
    dayReflections.forEach((r) => {
      const tags = r.tags || [];
      if (tags.some((t) => ['insight', 'quote', 'training-seed'].includes(t)) &&
          !tags.includes('personal')) {
        auto.add(r.id);
      }
    });
    return auto;
  });
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [closingNote, setClosingNote] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const toggleReflection = (id: string) => {
    setSelectedReflections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const togglePhoto = (id: string) => {
    setSelectedPhotos((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    const items: Omit<DispatchItem, 'id' | 'dispatch_id' | 'created_at'>[] = [];
    let sortOrder = 0;

    // Scene items (photos)
    selectedPhotos.forEach((id) => {
      items.push({ item_type: 'photo', item_id: id, sort_order: sortOrder++, section: 'scene' });
    });

    // Insight items (reflections)
    sortOrder = 0;
    selectedReflections.forEach((id) => {
      items.push({ item_type: 'reflection', item_id: id, sort_order: sortOrder++, section: 'insight' });
    });

    try {
      const result = await createDispatch.mutateAsync({
        tripId,
        dayId: day.id,
        closingNote: closingNote.trim(),
        items,
      });
      const url = `${window.location.origin}/shared/${result.shareToken}/dispatch/${result.dispatch.id}`;
      setShareUrl(url);
    } catch {
      // Error handled by hook
    }
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied!');
    }
  };

  if (shareUrl) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dispatch Shared!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Your dispatch is ready to share.</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 text-xs bg-muted rounded px-2 py-1.5"
              />
              <Button size="sm" onClick={handleCopyLink}>Copy</Button>
            </div>
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Dispatch — {day.title || day.date}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scene: Photos */}
          {dayPhotos.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-2">Scene (select 1-3 photos)</h3>
              <div className="grid grid-cols-3 gap-2">
                {dayPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => togglePhoto(photo.id)}
                    className={`relative rounded-lg overflow-hidden aspect-square border-2 transition-colors ${
                      selectedPhotos.has(photo.id) ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    {photo.media?.[0] && (
                      <img
                        src={supabase.storage.from('trip-photos').getPublicUrl(photo.media[0].storage_path).data.publicUrl}
                        alt=""
                        className="object-cover w-full h-full"
                      />
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Insights: Reflections */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Insights ({selectedReflections.size} selected)</h3>
            {dayReflections.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reflections for this day yet.</p>
            ) : (
              <div className="space-y-2">
                {dayReflections
                  .filter((r) => !r.tags?.includes('personal'))
                  .map((reflection) => (
                    <label key={reflection.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                      <Checkbox
                        checked={selectedReflections.has(reflection.id)}
                        onCheckedChange={() => toggleReflection(reflection.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{reflection.note}</p>
                        {reflection.speaker && (
                          <p className="text-xs text-muted-foreground mt-0.5">— {reflection.speaker}</p>
                        )}
                      </div>
                    </label>
                  ))}
              </div>
            )}
          </section>

          {/* Closing */}
          <section>
            <h3 className="text-sm font-semibold mb-2">Closing</h3>
            <Textarea
              placeholder="A quote that landed, a feeling to carry forward, a one-liner for the team..."
              value={closingNote}
              onChange={(e) => setClosingNote(e.target.value)}
              className="min-h-[60px] resize-none"
            />
          </section>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4 mr-1" /> Preview
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreate}
              disabled={createDispatch.isPending || (selectedReflections.size === 0 && !closingNote.trim())}
            >
              {createDispatch.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <><Share2 className="h-4 w-4 mr-1" /> Share</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

Note: The `import { toast } from 'sonner'` and `import { supabase } from '@/integrations/supabase/client'` imports need to be added at the top of the DispatchEditor. The implementer should add these.

- [ ] **Step 2: Implement DispatchPreview**

```typescript
// src/components/dispatch/DispatchPreview.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Memory } from '@/types/trip';

interface DispatchPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayTitle: string;
  selectedPhotos: Memory[];
  selectedReflections: Memory[];
  closingNote: string;
}

export function DispatchPreview({
  open,
  onOpenChange,
  dayTitle,
  selectedPhotos,
  selectedReflections,
  closingNote,
}: DispatchPreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{dayTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scene photos */}
          {selectedPhotos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {selectedPhotos.map((photo) => (
                <div key={photo.id} className="shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-muted">
                  {/* Photo thumbnail */}
                </div>
              ))}
            </div>
          )}

          {/* Insights */}
          {selectedReflections.length > 0 && (
            <ul className="space-y-2">
              {selectedReflections.map((r) => (
                <li key={r.id} className="text-sm flex gap-2">
                  <span className="text-primary mt-1">•</span>
                  <div>
                    <span>{r.note}</span>
                    {r.speaker && (
                      <span className="text-muted-foreground"> — {r.speaker}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Closing */}
          {closingNote && (
            <blockquote className="border-l-2 border-primary pl-3 italic text-sm text-muted-foreground">
              {closingNote}
            </blockquote>
          )}
        </div>

        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Back to Editor
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/components/dispatch/
git commit -m "feat: add DispatchEditor and DispatchPreview components"
```

---

## Task 12: Shared Dispatch Page

**Files:**
- Create: `src/pages/SharedDispatch.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement SharedDispatch page**

```typescript
// src/pages/SharedDispatch.tsx
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Memory } from '@/types/trip';
import type { DispatchItem } from '@/types/conference';

export default function SharedDispatch() {
  const { token, id } = useParams<{ token: string; id: string }>();

  // Validate token and fetch dispatch
  const { data, isLoading, error } = useQuery({
    queryKey: ['shared-dispatch', token, id],
    queryFn: async () => {
      // 1. Validate token
      const { data: link, error: linkError } = await supabase
        .from('trip_share_links')
        .select('*')
        .eq('token', token)
        .eq('dispatch_id', id)
        .single();
      if (linkError || !link) throw new Error('Invalid or expired link');

      // Check expiry
      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        throw new Error('This link has expired');
      }

      // 2. Fetch dispatch memory
      const { data: dispatch, error: dispatchError } = await supabase
        .from('memories')
        .select('*, day:itinerary_days(*)')
        .eq('id', id)
        .single();
      if (dispatchError) throw dispatchError;

      // 3. Fetch dispatch items
      const { data: items, error: itemsError } = await supabase
        .from('dispatch_items')
        .select('*')
        .eq('dispatch_id', id)
        .order('section')
        .order('sort_order');
      if (itemsError) throw itemsError;

      // 4. Resolve item references
      const reflectionIds = items.filter((i) => i.item_type === 'reflection').map((i) => i.item_id);
      const photoIds = items.filter((i) => i.item_type === 'photo').map((i) => i.item_id);

      let reflections: Memory[] = [];
      let photos: Memory[] = [];

      if (reflectionIds.length > 0) {
        const { data: r } = await supabase
          .from('memories')
          .select('*')
          .in('id', reflectionIds);
        reflections = (r || []) as Memory[];
      }

      if (photoIds.length > 0) {
        const { data: p } = await supabase
          .from('memories')
          .select('*, media:memory_media(*)')
          .in('id', photoIds);
        photos = (p || []) as Memory[];
      }

      // Check for trip-level share link
      const { data: tripLink } = await supabase
        .from('trip_share_links')
        .select('token')
        .eq('trip_id', link.trip_id)
        .is('dispatch_id', null)
        .limit(1);

      return {
        dispatch: dispatch as Memory,
        items: items as DispatchItem[],
        reflections,
        photos,
        tripShareToken: tripLink?.[0]?.token || null,
      };
    },
    enabled: !!token && !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading dispatch...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Dispatch Not Found</h1>
          <p className="text-muted-foreground">This link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  const { dispatch, reflections, photos } = data;
  const dayTitle = dispatch.day?.title || dispatch.day?.date || 'Conference Day';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-6 space-y-6">
        {/* Header */}
        <header className="text-center space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Dispatch</p>
          <h1 className="text-xl font-bold">{dayTitle}</h1>
          <p className="text-sm text-muted-foreground">
            Sankofa 2026 — Healing, Justice & Sacred Care
          </p>
        </header>

        {/* Scene photos */}
        {photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {photos.map((photo) => (
              <div key={photo.id} className="shrink-0 w-48 h-36 rounded-xl overflow-hidden bg-muted">
                {photo.media?.[0] && (
                  <img
                    src={supabase.storage.from('trip-photos').getPublicUrl(photo.media[0].storage_path).data.publicUrl}
                    alt=""
                    className="object-cover w-full h-full"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Insights */}
        {reflections.length > 0 && (
          <section className="space-y-3">
            {reflections.map((r) => (
              <div key={r.id} className="flex gap-3">
                <span className="text-primary font-bold mt-0.5">•</span>
                <div>
                  <p className="text-sm leading-relaxed">{r.note}</p>
                  {r.speaker && (
                    <p className="text-xs text-muted-foreground mt-0.5">— {r.speaker}</p>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Closing */}
        {dispatch.note && (
          <blockquote className="border-l-2 border-primary pl-4 py-2">
            <p className="italic text-sm leading-relaxed text-muted-foreground">
              {dispatch.note}
            </p>
          </blockquote>
        )}

        {/* Footer */}
        <footer className="text-center pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Shared from MyKeepsakes
          </p>
          {data.tripShareToken && (
            <a
              href={`/shared/${data.tripShareToken}`}
              className="text-xs text-primary underline mt-1 block"
            >
              View full trip
            </a>
          )}
        </footer>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add route to App.tsx**

Read `src/App.tsx` first, then add the new route:

```typescript
// Add import at top:
const SharedDispatch = lazy(() => import('./pages/SharedDispatch'));

// Add route inside <Routes>:
<Route path="/shared/:token/dispatch/:id" element={<SharedDispatch />} />
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/pages/SharedDispatch.tsx src/App.tsx
git commit -m "feat: add shared dispatch page and route"
```

---

## Task 13: Wire features into main app

**Files:**
- Modify: `src/pages/Index.tsx`
- Modify: `src/components/dashboard/DashboardLayout.tsx`

This task integrates all new components into the existing app. Read both files carefully first — the exact integration points depend on the current structure.

- [ ] **Step 1: Read Index.tsx and DashboardLayout.tsx**

Run: Read both files to understand current tab structure and layout.

- [ ] **Step 2: Add PeopleTab to dashboard navigation**

In `DashboardLayout.tsx`, add a "People" tab alongside existing tabs (Itinerary, Album, Map, Contacts, etc.). Use the `Users` icon from lucide-react.

- [ ] **Step 3: Add ReflectionFAB to Index.tsx**

Import and render `ReflectionFAB` at the bottom of the trip view. Wire the `onReflection` and `onConnection` callbacks to open `ReflectionCaptureSheet` and `ConnectionCaptureSheet` respectively.

```typescript
// State
const [reflectionOpen, setReflectionOpen] = useState(false);
const [connectionOpen, setConnectionOpen] = useState(false);

// In render:
<ReflectionFAB
  onReflection={() => setReflectionOpen(true)}
  onConnection={() => setConnectionOpen(true)}
/>
<ReflectionCaptureSheet
  open={reflectionOpen}
  onOpenChange={setReflectionOpen}
  tripId={activeTripId}
  days={days}
  currentDayId={selectedDayId}
/>
<ConnectionCaptureSheet
  open={connectionOpen}
  onOpenChange={setConnectionOpen}
  tripId={activeTripId}
  currentDayId={selectedDayId}
/>
```

- [ ] **Step 4: Add "Create Dispatch" button to day view**

In the day card or day detail component, add a button that opens the `DispatchEditor` for that day.

- [ ] **Step 5: Add FilterBar**

Add `FilterBar` above the content area when viewing reflections/memories. Wire the filter state to filter displayed content by tag.

- [ ] **Step 6: Verify app runs**

Run: `npm run dev`
Open in browser. Verify: FAB visible, tapping opens reflection sheet, People tab shows, dispatch button present on day view.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Index.tsx src/components/dashboard/DashboardLayout.tsx
git commit -m "feat: wire conference companion features into main app"
```

---

## Task 14: Add tags to existing MemoryCaptureDialog

**Files:**
- Modify: `src/components/album/MemoryCaptureDialog.tsx`

- [ ] **Step 1: Read MemoryCaptureDialog.tsx**

Understand the current form structure and state.

- [ ] **Step 2: Add TagChips to the dialog**

Import `TagChips` and `InsightTag`. Add state for `tags`. Render `TagChips` below the note field. Include `tags` in the mutation payload when creating a memory.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/components/album/MemoryCaptureDialog.tsx
git commit -m "feat: add insight tags to existing memory capture dialog"
```

---

## Task 15: Update export to support tag filtering

**Files:**
- Modify: `src/hooks/use-export.ts`

- [ ] **Step 1: Read use-export.ts**

Understand the current export flow.

- [ ] **Step 2: Add tag filter option**

Add an optional `filterByTag` parameter. When set, filter memories to only those containing the specified tag in their `tags` array before including in the export.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-export.ts
git commit -m "feat: add tag-based filtering to trip export"
```

---

## Task 16: Sankofa trip scaffold seed script

**Files:**
- Create: `scripts/seed-sankofa.ts`

- [ ] **Step 1: Create the seed script**

```typescript
// scripts/seed-sankofa.ts
// Run with: npx tsx scripts/seed-sankofa.ts
// Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function seed() {
  console.log('Creating Sankofa 2026 trip...');

  // 1. Create trip
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({
      title: 'Sankofa 2026 — Healing, Justice & Sacred Care',
      location_name: 'Chicago / Oak Brook, IL',
      start_date: '2026-04-21',
      end_date: '2026-04-24',
      timezone: 'America/Chicago',
    })
    .select()
    .single();
  if (tripError) throw tripError;
  console.log(`Trip created: ${trip.id}`);

  // 2. Create days
  const days = [
    { date: '2026-04-21', title: 'Arrival & Opening', sort_index: 0 },
    { date: '2026-04-22', title: 'Conference Day 1', sort_index: 1 },
    { date: '2026-04-23', title: 'Conference Day 2', sort_index: 2 },
    { date: '2026-04-24', title: 'Closing & Departure', sort_index: 3 },
  ];
  const { data: createdDays, error: daysError } = await supabase
    .from('itinerary_days')
    .insert(days.map((d) => ({ ...d, trip_id: trip.id })))
    .select();
  if (daysError) throw daysError;
  console.log(`${createdDays.length} days created`);

  // 3. Create accommodation
  const { error: accomError } = await supabase
    .from('accommodations')
    .insert({
      trip_id: trip.id,
      title: 'Chicago Marriott Oak Brook',
      address: '1401 W 22nd St, Oak Brook, IL 60523',
      check_in: '2026-04-21T16:00:00-05:00',
      check_out: '2026-04-24T12:00:00-05:00',
      is_selected: true,
      notes: 'Confirmation #84897700. $154/night ($503.58 total). Sharing with Dan Llanes. Complimentary parking. Phone: +1-630-573-8555',
      location_lat: 41.8505,
      location_lng: -87.9357,
    });
  if (accomError) throw accomError;
  console.log('Accommodation created');

  // 4. Create locations
  const locations = [
    { name: 'Chicago Marriott Oak Brook', category: 'accommodation', address: '1401 W 22nd St, Oak Brook, IL 60523', lat: 41.8505, lng: -87.9357 },
    { name: "O'Hare International Airport", category: 'transport', address: "10000 W O'Hare Ave, Chicago, IL 60666", lat: 41.9742, lng: -87.9073 },
    { name: 'Midway International Airport', category: 'transport', address: '5700 S Cicero Ave, Chicago, IL 60638', lat: 41.7868, lng: -87.7522 },
  ];
  const { error: locError } = await supabase
    .from('locations')
    .insert(locations.map((l) => ({ ...l, trip_id: trip.id })));
  if (locError) throw locError;
  console.log(`${locations.length} locations created`);

  // 5. Create contacts (Beacon team)
  const contacts = [
    { name: 'Dr. Danielle Buhuro', email: 'sankofacpeconference@gmail.com', phone: '773-953-9398', organization: 'Sankofa CPE Center — Organizer', category: 'connection', trip_id: trip.id },
    { name: 'Rev. Dr. Jé Exodus Hooper', email: 'je@summitbeacon.org', phone: '804-837-2404', organization: 'Beacon UU — Assistant Minister, Presenter', category: 'connection', trip_id: trip.id },
    { name: 'Rev. Dr. Robin Tanner', email: 'robin@summitbeacon.org', phone: '908-219-9959', organization: 'Beacon UU — Senior Minister', category: 'connection', trip_id: trip.id },
    { name: 'Dan Llanes', organization: 'Beacon UU — Chaplain, Roommate', category: 'connection', trip_id: trip.id },
    { name: 'Heather Stober', organization: 'Beacon UU — Chaplain', category: 'connection', trip_id: trip.id },
    { name: 'Catherine Menendez', organization: 'Beacon UU — Chaplain', category: 'connection', trip_id: trip.id },
    { name: 'Dana N. Moore', organization: 'Beacon UU — Congregational Coordinator', category: 'connection', trip_id: trip.id },
  ];
  const { error: contactError } = await supabase
    .from('family_contacts')
    .insert(contacts);
  if (contactError) throw contactError;
  console.log(`${contacts.length} contacts created`);

  // 6. Create known speakers as connections
  const speakers = [
    { name: 'Dr. Nathaniel D. West, LPC', organization: 'Samuel Dewitt Proctor School of Theology', met_context: 'Plenary: "Shifting Toward Consistent Self-Care"', category: 'connection', trip_id: trip.id },
    { name: 'Dr. Pamela Ayo Yetunde', organization: 'Pastoral Counselor & Author', category: 'connection', trip_id: trip.id },
    { name: 'Dr. Nisa Muhammad', organization: 'Howard University — Assistant Dean for Religious Life', category: 'connection', trip_id: trip.id },
  ];
  const { error: speakerError } = await supabase
    .from('family_contacts')
    .insert(speakers);
  if (speakerError) throw speakerError;
  console.log(`${speakers.length} speakers created`);

  // 7. Create placeholder itinerary items
  const dayMap = Object.fromEntries(createdDays.map((d) => [d.date, d.id]));

  const items = [
    // Day 1
    { trip_id: trip.id, day_id: dayMap['2026-04-21'], title: 'Hotel Check-in', start_time: '16:00', category: 'accommodation', status: 'planned', sort_index: 0, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-21'], title: 'Opening Session', category: 'event', status: 'planned', sort_index: 1, item_type: 'activity' },
    // Day 2
    { trip_id: trip.id, day_id: dayMap['2026-04-22'], title: 'Morning Plenary', category: 'event', status: 'planned', sort_index: 0, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-22'], title: 'Workshop Block 1', category: 'event', status: 'planned', sort_index: 1, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-22'], title: 'Lunch', category: 'dining', status: 'planned', sort_index: 2, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-22'], title: 'Workshop Block 2', category: 'event', status: 'planned', sort_index: 3, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-22'], title: 'Dinner', category: 'dining', status: 'planned', sort_index: 4, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-22'], title: 'Evening Programming', category: 'event', status: 'planned', sort_index: 5, item_type: 'activity' },
    // Day 3 (same structure)
    { trip_id: trip.id, day_id: dayMap['2026-04-23'], title: 'Morning Plenary', category: 'event', status: 'planned', sort_index: 0, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-23'], title: 'Workshop Block 1', category: 'event', status: 'planned', sort_index: 1, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-23'], title: 'Lunch', category: 'dining', status: 'planned', sort_index: 2, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-23'], title: 'Workshop Block 2', category: 'event', status: 'planned', sort_index: 3, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-23'], title: 'Dinner & Celebration', category: 'dining', status: 'planned', sort_index: 4, item_type: 'activity' },
    // Day 4
    { trip_id: trip.id, day_id: dayMap['2026-04-24'], title: 'Closing Session', category: 'event', status: 'planned', sort_index: 0, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-24'], title: 'Hotel Checkout', start_time: '12:00', category: 'accommodation', status: 'planned', sort_index: 1, item_type: 'activity' },
    { trip_id: trip.id, day_id: dayMap['2026-04-24'], title: 'Departure', category: 'transport', status: 'planned', sort_index: 2, item_type: 'activity' },
  ];
  const { error: itemError } = await supabase
    .from('itinerary_items')
    .insert(items);
  if (itemError) throw itemError;
  console.log(`${items.length} itinerary items created`);

  console.log('\nSankofa 2026 trip scaffold complete!');
  console.log(`Trip ID: ${trip.id}`);
}

seed().catch(console.error);
```

- [ ] **Step 2: Commit**

```bash
git add scripts/seed-sankofa.ts
git commit -m "feat: add Sankofa 2026 trip scaffold seed script"
```

---

## Task 17: Deploy to Vercel

**Files:**
- Modify: `.env` (local only, not committed)

- [ ] **Step 1: Create new Supabase project**

Go to app.supabase.com. Create new project. Note the URL and anon key.

- [ ] **Step 2: Run migrations on new Supabase**

```bash
npx supabase db push --db-url "postgresql://postgres:[password]@[host]:5432/postgres"
```

Or use the Supabase SQL Editor to run each migration file in order.

- [ ] **Step 3: Create storage bucket**

In Supabase dashboard: Storage → New bucket → Name: `trip-photos` → Public: true

- [ ] **Step 4: Update .env with new Supabase credentials**

```bash
VITE_SUPABASE_URL=https://[new-project].supabase.co
VITE_SUPABASE_ANON_KEY=[new-anon-key]
VITE_SUPABASE_PROJECT_ID=[new-project-id]
```

- [ ] **Step 5: Deploy to Vercel**

```bash
npx vercel --prod
```

Set environment variables in Vercel dashboard matching .env values.

- [ ] **Step 6: Verify deployment**

Open the Vercel URL. Verify: PIN entry works, app loads, no console errors.

- [ ] **Step 7: Run seed script**

```bash
npx tsx scripts/seed-sankofa.ts
```

Verify: Sankofa trip appears in the app with all 4 days, accommodation, contacts, and itinerary placeholders.

- [ ] **Step 8: Commit any deployment config changes**

```bash
git add -A
git commit -m "chore: deployment config for Vercel"
```

---

## Task 18: End-to-end validation

No new files. This is manual testing of the complete flow.

- [ ] **Step 1: Open Sankofa trip on mobile device**

Navigate to the Vercel URL on your phone. Enter PIN. Select the Sankofa trip.

- [ ] **Step 2: Test reflection capture**

Tap FAB → Reflection. Type a test thought. Select "insight" tag. Save. Verify it appears in the timeline.

- [ ] **Step 3: Test connection capture**

Tap FAB → Connection. Enter a test name and org. Save. Switch to People tab. Verify it appears.

- [ ] **Step 4: Test dispatch creation**

From Day 1, tap "Create Dispatch". Select the test reflection. Add a closing note. Preview. Share. Copy the link. Open in an incognito window. Verify the dispatch renders correctly.

- [ ] **Step 5: Test tag filtering**

Add reflections with different tags. Use the FilterBar to filter by tag. Verify filtering works.

- [ ] **Step 6: Test export with tag filter**

Open export dialog. Verify tag filter option exists. Export with "training-seed" filter.

- [ ] **Step 7: Clean up test data**

Delete test reflections and connections. Keep the Sankofa scaffold.
