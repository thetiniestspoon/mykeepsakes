import { useSearchParams } from 'react-router-dom';
import { AlbumV1 } from './variants/AlbumV1';
import { AlbumV2 } from './variants/AlbumV2';

/**
 * CollageAlbum — dispatcher for the photos/album preview surface.
 * Chosen 2026-04-17: V1 (By Day · Scrapbook Pages). V2 (By Place) via ?v=2.
 */
export function CollageAlbum() {
  const [params] = useSearchParams();
  const v = params.get('v');
  if (v === '2') return <AlbumV2 />;
  return <AlbumV1 />;
}
