import { useSearchParams } from 'react-router-dom';
import { FavoritesV1 } from './variants/FavoritesV1';
import { FavoritesV2 } from './variants/FavoritesV2';

// Parallel preview surface — not in production routing. Defaults to V2 (Shortlist); ?v=1 → Pin Wall.
export function CollageFavorites() {
  const [params] = useSearchParams();
  const v = params.get('v');
  if (v === '1') return <FavoritesV1 />;
  return <FavoritesV2 />;
}
