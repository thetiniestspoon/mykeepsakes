/**
 * CollageExport — dispatcher for the Export preview surface.
 * Defaults to V2 (Address Label); `?v=1` serves V1 (Sealed Envelope).
 * Both variants are preview-only; production ExportDialog is untouched.
 */
import { useSearchParams } from 'react-router-dom';
import { ExportV1 } from './variants/ExportV1';
import { ExportV2 } from './variants/ExportV2';

export function CollageExport() {
  const [params] = useSearchParams();
  const v = params.get('v');
  if (v === '1') return <ExportV1 />;
  return <ExportV2 />;
}
