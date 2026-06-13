import L from 'leaflet';

/**
 * Marker variants supported by the map marker system.
 *
 * Currently only "default" is implemented. Future variants (e.g., species-specific
 * markers) can be added by extending this union and updating `getMarkerSvg`.
 */
export type MarkerType = 'default' | 'deer' | 'owl' | 'bear' | 'eagle';

const MARKER_SIZE: L.PointTuple = [32, 44];
const MARKER_ANCHOR: L.PointTuple = [16, 44];

function getMarkerSvg(type: MarkerType): string {
  // Future variants can return different SVGs here.
  switch (type) {
    case 'default':
    default:
      return `<svg width="32" height="44" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3));">
        <path d="M16 0C7.16 0 0 7.16 0 16C0 23.5 12 38 16 44C20 38 32 23.5 32 16C32 7.16 24.84 0 16 0Z" fill="#31742e"/>
        <circle cx="16" cy="16" r="6.5" fill="#ffffff"/>
      </svg>`;
  }
}

/**
 * Creates a crisp, vector-based Leaflet DivIcon for the requested marker type.
 *
 * The SVG renders at the requested icon size and remains sharp on Retina/HiDPI
 * displays because it is vector rather than a bitmap.
 */
export function createMarkerIcon(type: MarkerType = 'default'): L.DivIcon {
  return L.divIcon({
    className: 'custom-map-marker',
    html: getMarkerSvg(type),
    iconSize: MARKER_SIZE,
    iconAnchor: MARKER_ANCHOR,
    popupAnchor: [0, -MARKER_SIZE[1]],
  });
}
