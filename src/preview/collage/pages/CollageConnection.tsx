/**
 * CollageConnection — variant dispatcher for the Connection Capture sheet preview.
 *
 * Default: V2 (Index Card + Live Preview). Use ?v=1 for the Business Card
 * Filling Out variant. Production equivalent lives at
 * src/components/connections/ConnectionCaptureSheet.tsx — this is a preview
 * only and does not write.
 */
import { useSearchParams } from 'react-router-dom';
import { ConnectionV1 } from './variants/ConnectionV1';
import { ConnectionV2 } from './variants/ConnectionV2';

export function CollageConnection() {
  const [params] = useSearchParams();
  const v = params.get('v');
  if (v === '1') return <ConnectionV1 />;
  return <ConnectionV2 />;
}
