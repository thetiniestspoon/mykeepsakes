import { useSearchParams } from 'react-router-dom';
import { MapV1 } from './variants/MapV1';
import { MapV2 } from './variants/MapV2';

// Preview dispatcher for the Collage Map surface.
// Default: V1 (Annotated Map Pinboard). V2 (Route Card Stack) via ?v=2.
export function CollageMap() {
  const [params] = useSearchParams();
  const v = params.get('v');
  if (v === '2') return <MapV2 />;
  return <MapV1 />;
}
