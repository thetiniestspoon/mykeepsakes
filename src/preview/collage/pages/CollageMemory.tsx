import { useSearchParams } from 'react-router-dom';
import { MemoryV1 } from './variants/MemoryV1';
import { MemoryV2 } from './variants/MemoryV2';
import { MemoryV3 } from './variants/MemoryV3';

// Chosen 2026-04-17: V3 (Scrapbook Spread). V1 + V2 retained for comparison via ?v=.
export function CollageMemory() {
  const [params] = useSearchParams();
  const v = params.get('v');
  if (v === '1') return <MemoryV1 />;
  if (v === '2') return <MemoryV2 />;
  return <MemoryV3 />;
}
