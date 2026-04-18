import { useSearchParams } from 'react-router-dom';
import { PinV1 } from './variants/PinV1';
import { PinV2 } from './variants/PinV2';
import { PinV3 } from './variants/PinV3';

// Chosen 2026-04-17: V1 (Centered Card). V2 + V3 retained for comparison via ?v=.
export function CollagePin() {
  const [params] = useSearchParams();
  const v = params.get('v');
  if (v === '2') return <PinV2 />;
  if (v === '3') return <PinV3 />;
  return <PinV1 />;
}
