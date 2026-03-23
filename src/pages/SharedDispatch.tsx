import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Lock, Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getMemoryMediaUrl } from '@/hooks/use-memories';
import type { Memory, ItineraryDay } from '@/types/trip';
import type { DispatchItem } from '@/types/conference';

// ── types ─────────────────────────────────────────────────────────────────────

interface DispatchData {
  dispatch: Memory & { day: ItineraryDay | null };
  items: DispatchItem[];
  photos: Memory[];
  reflections: Memory[];
  tripTitle: string;
  tripShareToken: string | null;
}

// ── data hook ─────────────────────────────────────────────────────────────────

function useSharedDispatch(token: string | undefined, dispatchId: string | undefined) {
  return useQuery<DispatchData>({
    queryKey: ['shared-dispatch', token, dispatchId],
    queryFn: async () => {
      if (!token || !dispatchId) throw new Error('Missing token or dispatch id');

      // 1. Validate token – must match dispatch_id
      const { data: link, error: linkError } = await supabase
        .from('trip_share_links')
        .select('*')
        .eq('token', token)
        .eq('dispatch_id', dispatchId)
        .single();

      if (linkError || !link) throw new Error('Invalid or not found');

      // 2. Check expiry
      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        throw new Error('expired');
      }

      // 3. Fetch dispatch memory + day join
      const { data: dispatch, error: dispatchError } = await supabase
        .from('memories')
        .select('*, day:itinerary_days(*)')
        .eq('id', dispatchId)
        .single();

      if (dispatchError || !dispatch) throw new Error('Dispatch not found');

      // 4. Fetch dispatch items
      const { data: items, error: itemsError } = await supabase
        .from('dispatch_items')
        .select('*')
        .eq('dispatch_id', dispatchId)
        .order('section')
        .order('sort_order');

      if (itemsError) throw itemsError;

      // 5. Resolve referenced memories (photos + reflections)
      const photoIds = (items as DispatchItem[])
        .filter((i) => i.item_type === 'photo' || i.section === 'scene')
        .map((i) => i.item_id);

      const reflectionIds = (items as DispatchItem[])
        .filter((i) => i.item_type === 'reflection' || i.section === 'insight')
        .map((i) => i.item_id);

      const allIds = [...new Set([...photoIds, ...reflectionIds])];

      let photos: Memory[] = [];
      let reflections: Memory[] = [];

      if (allIds.length > 0) {
        const { data: memories, error: memError } = await supabase
          .from('memories')
          .select('*, media:memory_media(*)')
          .in('id', allIds);

        if (memError) throw memError;

        const photoSet = new Set(photoIds);
        const reflectionSet = new Set(reflectionIds);

        photos = ((memories ?? []) as Memory[])
          .filter((m) => photoSet.has(m.id))
          .sort(
            (a, b) =>
              (items as DispatchItem[]).find((i) => i.item_id === a.id)?.sort_order ?? 0 -
              ((items as DispatchItem[]).find((i) => i.item_id === b.id)?.sort_order ?? 0),
          );

        reflections = ((memories ?? []) as Memory[])
          .filter((m) => reflectionSet.has(m.id))
          .sort(
            (a, b) =>
              (items as DispatchItem[]).find((i) => i.item_id === a.id)?.sort_order ?? 0 -
              ((items as DispatchItem[]).find((i) => i.item_id === b.id)?.sort_order ?? 0),
          );
      }

      // 6. Fetch trip title
      const { data: trip } = await supabase
        .from('trips')
        .select('title')
        .eq('id', link.trip_id)
        .single();

      // 7. Check if a trip-level share link exists (no dispatch_id = trip-level)
      const { data: tripShareLink } = await supabase
        .from('trip_share_links')
        .select('token')
        .eq('trip_id', link.trip_id)
        .is('dispatch_id', null)
        .maybeSingle();

      return {
        dispatch: dispatch as Memory & { day: ItineraryDay | null },
        items: (items ?? []) as DispatchItem[],
        photos,
        reflections,
        tripTitle: trip?.title ?? 'Trip',
        tripShareToken: tripShareLink?.token ?? null,
      };
    },
    enabled: !!token && !!dispatchId,
    retry: false,
  });
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function SharedDispatch() {
  const { token, id } = useParams<{ token: string; id: string }>();
  const { data, isLoading, error } = useSharedDispatch(token, id);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading dispatch…</p>
        </div>
      </div>
    );
  }

  // Error / invalid
  if (error || !data) {
    const isExpired = (error as Error)?.message?.includes('expired');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              {isExpired ? (
                <Clock className="w-6 h-6 text-destructive" />
              ) : (
                <Lock className="w-6 h-6 text-destructive" />
              )}
            </div>
            <h2 className="text-lg font-semibold mb-2">Unable to Access Dispatch</h2>
            <p className="text-muted-foreground text-sm">
              {isExpired
                ? 'This share link has expired. Ask the sender for a new link.'
                : 'This dispatch link is invalid or no longer available.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { dispatch, photos, reflections, tripTitle, tripShareToken } = data;
  const day = dispatch.day;
  const dayLabel = day?.title ?? day?.date ?? 'Day';
  const closingNote = dispatch.note;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="container flex h-16 items-center justify-between px-4">
          <div>
            <h1 className="font-display text-lg font-semibold text-foreground leading-tight">
              {dayLabel}
            </h1>
            <p className="text-xs text-muted-foreground">{tripTitle}</p>
          </div>
          <span className="text-xs text-muted-foreground bg-secondary rounded-full px-3 py-1 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Read-only
          </span>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-2xl mx-auto space-y-8 pb-24">
        {/* Scene: photos */}
        {photos.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Scene
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {photos.map((photo) => {
                const firstMedia = photo.media?.[0];
                if (!firstMedia) return null;
                const url = getMemoryMediaUrl(firstMedia.storage_path);
                return (
                  <div
                    key={photo.id}
                    className="aspect-square rounded-lg overflow-hidden bg-muted"
                  >
                    <img
                      src={url}
                      alt={photo.title ?? 'Photo'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Insights */}
        {reflections.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Insights
            </h2>
            <ul className="space-y-4">
              {reflections.map((reflection) => (
                <li key={reflection.id} className="flex gap-3">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <div>
                    <p className="text-foreground text-sm leading-relaxed">
                      {reflection.note}
                    </p>
                    {reflection.speaker && (
                      <p className="text-xs text-muted-foreground mt-1">
                        — {reflection.speaker}
                        {reflection.session_title && `, ${reflection.session_title}`}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Closing note */}
        {closingNote && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Closing
            </h2>
            <blockquote className="border-l-4 border-primary pl-4 italic text-foreground text-sm leading-relaxed">
              {closingNote}
            </blockquote>
          </section>
        )}

        {photos.length === 0 && reflections.length === 0 && !closingNote && (
          <p className="text-center text-muted-foreground text-sm py-12">
            This dispatch has no content.
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-border py-3">
        <div className="container px-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Shared with you · Powered by MyKeepsakes
          </p>
          {tripShareToken && (
            <Link
              to={`/shared/${tripShareToken}`}
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              View full trip
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}
