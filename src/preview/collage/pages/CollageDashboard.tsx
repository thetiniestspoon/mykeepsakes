import { useSearchParams } from 'react-router-dom';
import { DashboardV1 } from './variants/DashboardV1';
import { DashboardV2 } from './variants/DashboardV2';
import { DashboardV3 } from './variants/DashboardV3';

// Chosen 2026-04-17: V2 (Center Altar). V1 + V3 retained for comparison via ?v=.
export function CollageDashboard() {
  const [params] = useSearchParams();
  const v = params.get('v');
  if (v === '1') return <DashboardV1 />;
  if (v === '3') return <DashboardV3 />;
  return <DashboardV2 />;
}
