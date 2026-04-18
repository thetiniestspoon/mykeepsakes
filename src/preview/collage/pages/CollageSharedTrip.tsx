import { useSearchParams } from 'react-router-dom';
import { CollageRoot } from '../CollageRoot';
import { SharedTripV1 } from './variants/SharedTripV1';
import { SharedTripV2 } from './variants/SharedTripV2';

/**
 * CollageSharedTrip — dispatcher for the public shared-trip surface.
 *
 * Chosen 2026-04-17: V1 (Single Long Letter). V2 (Zine Booklet) retained via ?v=2.
 *
 * This dispatcher wraps its children in CollageRoot directly so it does NOT
 * inherit the CollageShell chrome (tab bar, layout switcher, demo banner).
 * The public share view should feel like reading a dispatch, not using an app.
 */
export function CollageSharedTrip() {
  const [params] = useSearchParams();
  const v = params.get('v');
  const variant = v === '2' ? <SharedTripV2 /> : <SharedTripV1 />;
  return <CollageRoot>{variant}</CollageRoot>;
}
