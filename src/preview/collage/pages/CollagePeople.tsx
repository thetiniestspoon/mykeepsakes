/**
 * CollagePeople — variant dispatcher.
 *
 * Chosen 2026-04-17: V2 (Who's Who Index). V1 (Rolodex) retained for comparison via ?v=1.
 */
import { useSearchParams } from 'react-router-dom';
import { PeopleV1 } from './variants/PeopleV1';
import { PeopleV2 } from './variants/PeopleV2';

export function CollagePeople() {
  const [params] = useSearchParams();
  const v = params.get('v');
  if (v === '1') return <PeopleV1 />;
  return <PeopleV2 />;
}
