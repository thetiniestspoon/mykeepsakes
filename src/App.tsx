import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy load shared trip page
const SharedTrip = lazy(() => import("./pages/SharedTrip"));
const SharedDispatch = lazy(() => import("./pages/SharedDispatch"));

// Lazy load Collage preview (parallel, non-destructive demo route)
const CollageShell = lazy(() => import("./preview/collage/CollageShell").then(m => ({ default: m.CollageShell })));
const CollageDashboard = lazy(() => import("./preview/collage/pages/CollageDashboard").then(m => ({ default: m.CollageDashboard })));
const CollageDay = lazy(() => import("./preview/collage/pages/CollageDay").then(m => ({ default: m.CollageDay })));
const CollageMemory = lazy(() => import("./preview/collage/pages/CollageMemory").then(m => ({ default: m.CollageMemory })));
const CollagePin = lazy(() => import("./preview/collage/pages/CollagePin").then(m => ({ default: m.CollagePin })));
const CollageMap = lazy(() => import("./preview/collage/pages/CollageMap").then(m => ({ default: m.CollageMap })));
const CollagePeople = lazy(() => import("./preview/collage/pages/CollagePeople").then(m => ({ default: m.CollagePeople })));
const CollageGuide = lazy(() => import("./preview/collage/pages/CollageGuide").then(m => ({ default: m.CollageGuide })));
const CollageAlbum = lazy(() => import("./preview/collage/pages/CollageAlbum").then(m => ({ default: m.CollageAlbum })));
const CollageDispatch = lazy(() => import("./preview/collage/pages/CollageDispatch").then(m => ({ default: m.CollageDispatch })));
const CollageSharedTrip = lazy(() => import("./preview/collage/pages/CollageSharedTrip").then(m => ({ default: m.CollageSharedTrip })));
const CollageLodging = lazy(() => import("./preview/collage/pages/CollageLodging").then(m => ({ default: m.CollageLodging })));
const CollageReflection = lazy(() => import("./preview/collage/pages/CollageReflection").then(m => ({ default: m.CollageReflection })));
const CollageConnection = lazy(() => import("./preview/collage/pages/CollageConnection").then(m => ({ default: m.CollageConnection })));
const CollageFavorites = lazy(() => import("./preview/collage/pages/CollageFavorites").then(m => ({ default: m.CollageFavorites })));
const CollageExport = lazy(() => import("./preview/collage/pages/CollageExport").then(m => ({ default: m.CollageExport })));
const CollageSettings = lazy(() => import("./preview/collage/pages/CollageSettings").then(m => ({ default: m.CollageSettings })));
const CollageTrips = lazy(() => import("./preview/collage/pages/CollageTrips").then(m => ({ default: m.CollageTrips })));

const queryClient = new QueryClient();

function PageLoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/mykeepsakes">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route 
            path="/shared/:token" 
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <SharedTrip />
              </Suspense>
            } 
          />
          <Route
            path="/shared/:token/dispatch/:id"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <SharedDispatch />
              </Suspense>
            }
          />
          {/* Collage preview — parallel route for aesthetic demo against real Sankofa data */}
          <Route
            path="/preview/collage"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <CollageShell />
              </Suspense>
            }
          >
            <Route index element={<Suspense fallback={<PageLoadingFallback />}><CollageDashboard /></Suspense>} />
            <Route path="dashboard" element={<Suspense fallback={<PageLoadingFallback />}><CollageDashboard /></Suspense>} />
            <Route path="day" element={<Suspense fallback={<PageLoadingFallback />}><CollageDay /></Suspense>} />
            <Route path="day/:dayId" element={<Suspense fallback={<PageLoadingFallback />}><CollageDay /></Suspense>} />
            <Route path="memory" element={<Suspense fallback={<PageLoadingFallback />}><CollageMemory /></Suspense>} />
            <Route path="memory/:id" element={<Suspense fallback={<PageLoadingFallback />}><CollageMemory /></Suspense>} />
            <Route path="pin" element={<Suspense fallback={<PageLoadingFallback />}><CollagePin /></Suspense>} />
            <Route path="map" element={<Suspense fallback={<PageLoadingFallback />}><CollageMap /></Suspense>} />
            <Route path="people" element={<Suspense fallback={<PageLoadingFallback />}><CollagePeople /></Suspense>} />
            <Route path="guide" element={<Suspense fallback={<PageLoadingFallback />}><CollageGuide /></Suspense>} />
            <Route path="album" element={<Suspense fallback={<PageLoadingFallback />}><CollageAlbum /></Suspense>} />
            <Route path="dispatch" element={<Suspense fallback={<PageLoadingFallback />}><CollageDispatch /></Suspense>} />
            <Route path="lodging" element={<Suspense fallback={<PageLoadingFallback />}><CollageLodging /></Suspense>} />
            <Route path="reflection" element={<Suspense fallback={<PageLoadingFallback />}><CollageReflection /></Suspense>} />
            <Route path="connection" element={<Suspense fallback={<PageLoadingFallback />}><CollageConnection /></Suspense>} />
            <Route path="favorites" element={<Suspense fallback={<PageLoadingFallback />}><CollageFavorites /></Suspense>} />
            <Route path="export" element={<Suspense fallback={<PageLoadingFallback />}><CollageExport /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<PageLoadingFallback />}><CollageSettings /></Suspense>} />
            <Route path="trips" element={<Suspense fallback={<PageLoadingFallback />}><CollageTrips /></Suspense>} />
          </Route>

          {/* Shared-Trip preview — sibling route, no shell chrome (feels like opening a letter, not using an app). */}
          <Route
            path="/preview/collage-shared"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <CollageSharedTrip />
              </Suspense>
            }
          />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
