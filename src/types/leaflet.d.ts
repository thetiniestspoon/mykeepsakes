import 'leaflet';

declare module 'leaflet' {
  namespace Icon {
    interface Default {
      _getIconUrl?: () => string;
    }
  }
}

export interface LeafletHTMLElement extends HTMLElement {
  _leaflet_id?: number;
}
