import { useSearchParams } from 'react-router-dom';
import { DispatchV1 } from './variants/DispatchV1';
import { DispatchV2 } from './variants/DispatchV2';

/**
 * Dispatch editor preview dispatcher.
 * Chosen 2026-04-17: V2 (Split Workspace). V1 (Three Drawers) retained via ?v=1.
 */
export function CollageDispatch() {
  const [params] = useSearchParams();
  const v = params.get('v');
  if (v === '1') return <DispatchV1 />;
  return <DispatchV2 />;
}
