import { useSearchParams } from 'react-router-dom';
import { GuideV1 } from './variants/GuideV1';
import { GuideV2 } from './variants/GuideV2';

/**
 * CollageGuide dispatcher.
 * Chosen 2026-04-17: V2 (Curator's Folio). V1 (Trifold) retained via ?v=1.
 */
export function CollageGuide() {
  const [params] = useSearchParams();
  const v = params.get('v');
  if (v === '1') return <GuideV1 />;
  return <GuideV2 />;
}
