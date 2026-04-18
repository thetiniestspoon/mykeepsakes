import { useSearchParams } from 'react-router-dom';
import { ReflectionV1 } from './variants/ReflectionV1';
import { ReflectionV2 } from './variants/ReflectionV2';

/**
 * Reflection Capture Sheet preview dispatcher.
 * Default: V2 (Index Card). V1 (Notebook Page) available via ?v=1.
 * Parallel preview surface — production Beach-themed
 * ReflectionCaptureSheet.tsx is untouched.
 */
export function CollageReflection() {
  const [params] = useSearchParams();
  const v = params.get('v');
  if (v === '1') return <ReflectionV1 />;
  return <ReflectionV2 />;
}
