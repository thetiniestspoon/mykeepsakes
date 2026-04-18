import { useSearchParams } from 'react-router-dom';
import { TripsV1 } from './variants/TripsV1';
import { TripsV2 } from './variants/TripsV2';

// Default: V2 (Ticket Counter). V1 (Bookshelf) available at ?v=1 for comparison.
export function CollageTrips() {
  const [params] = useSearchParams();
  const v = params.get('v');
  if (v === '1') return <TripsV1 />;
  return <TripsV2 />;
}
