import { useSearchParams } from 'react-router-dom';
import { DayV1 } from './variants/DayV1';
import { DayV2 } from './variants/DayV2';
import { DayV3 } from './variants/DayV3';

// Chosen 2026-04-17: V2 (Session Blocks). V1 + V3 retained for comparison via ?v=.
export function CollageDay() {
  const [params] = useSearchParams();
  const v = params.get('v');
  if (v === '1') return <DayV1 />;
  if (v === '3') return <DayV3 />;
  return <DayV2 />;
}
