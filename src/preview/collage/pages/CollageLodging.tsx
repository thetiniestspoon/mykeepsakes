import { useSearchParams } from 'react-router-dom';
import { LodgingV1 } from './variants/LodgingV1';
import { LodgingV2 } from './variants/LodgingV2';

/**
 * CollageLodging dispatcher.
 * Defaults to V1 (Concierge Card). V2 (Ticket + Stubs) available via ?v=2.
 * Parallel preview surface — kept out of the production Beach-themed routes.
 */
export function CollageLodging() {
  const [params] = useSearchParams();
  const v = params.get('v');
  if (v === '2') return <LodgingV2 />;
  return <LodgingV1 />;
}
