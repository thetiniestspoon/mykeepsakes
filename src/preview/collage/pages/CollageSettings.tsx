import { useSearchParams } from 'react-router-dom';
import { SettingsV1 } from './variants/SettingsV1';
import { SettingsV2 } from './variants/SettingsV2';

// Defaults to V1 (Inside Cover). V2 (Receipt Pad) retained for comparison via ?v=2.
export function CollageSettings() {
  const [params] = useSearchParams();
  const v = params.get('v');
  if (v === '2') return <SettingsV2 />;
  return <SettingsV1 />;
}
