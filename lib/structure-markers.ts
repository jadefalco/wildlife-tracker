import L from 'leaflet';

/**
 * Supported structure marker variants.
 */
export type StructureMarkerType =
  | 'nest'
  | 'roost'
  | 'den-burrow'
  | 'beaver-dam'
  | 'beaver-lodge'
  | 'tree-cavity'
  | 'unknown-structure';

export const STRUCTURE_MARKER_TYPES: StructureMarkerType[] = [
  'nest',
  'roost',
  'den-burrow',
  'beaver-dam',
  'beaver-lodge',
  'tree-cavity',
  'unknown-structure',
];

/**
 * Emoji used for each structure marker type on both the map and the legend.
 */
const STRUCTURE_EMOJIS: Record<StructureMarkerType, string> = {
  nest: '🪺',
  roost: '🦇',
  'den-burrow': '🕳️',
  'beaver-dam': '🪵',
  'beaver-lodge': '🛖',
  'tree-cavity': '🌳',
  'unknown-structure': '🏠',
};

/**
 * Structure category display names for the legend.
 */
export const STRUCTURE_MARKER_LABELS: Record<StructureMarkerType, string> = {
  nest: 'Nest',
  roost: 'Roost',
  'den-burrow': 'Den / Burrow',
  'beaver-dam': 'Beaver Dam',
  'beaver-lodge': 'Beaver Lodge',
  'tree-cavity': 'Tree Cavity',
  'unknown-structure': 'Unknown Structure',
};

/**
 * Determine the best marker type for a structure category and name.
 */
export function getStructureMarkerType(
  structureCategory?: string | null,
  structureName?: string | null
): StructureMarkerType {
  const category = (structureCategory ?? '').toLowerCase();
  const name = (structureName ?? '').toLowerCase();

  if (category === 'beaver-structures' || category === 'beaver structures') {
    if (name.includes('dam')) return 'beaver-dam';
    if (name.includes('lodge')) return 'beaver-lodge';
    return 'beaver-dam';
  }

  if (category === 'nests' || category === 'nest') return 'nest';
  if (category === 'roosts' || category === 'roost') return 'roost';
  if (category === 'dens-burrows' || category === 'dens & burrows') return 'den-burrow';
  if (category === 'tree-habitat-features' || category === 'tree habitat features') return 'tree-cavity';

  return 'unknown-structure';
}

const MARKER_SIZE = 32;

function buildEmojiIcon(emoji: string): L.DivIcon {
  return L.divIcon({
    className: 'structure-map-marker',
    html: `<div style="width:${MARKER_SIZE}px;height:${MARKER_SIZE}px;border-radius:50%;background:#ffffff;display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1;box-shadow:0 2px 4px rgba(0,0,0,0.25);">${emoji}</div>`,
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
    popupAnchor: [0, -MARKER_SIZE / 2],
  });
}

const iconCache = new Map<string, L.DivIcon>();

/**
 * Creates an emoji marker icon for a structure observation.
 */
export function createStructureMarkerIcon(
  structureCategory?: string | null,
  structureName?: string | null
): L.DivIcon {
  const type = getStructureMarkerType(structureCategory, structureName);
  const emoji = STRUCTURE_EMOJIS[type];

  if (!iconCache.has(emoji)) {
    iconCache.set(emoji, buildEmojiIcon(emoji));
  }
  return iconCache.get(emoji)!;
}

/**
 * Returns a smaller SVG suitable for the map legend.
 */
export function getStructureLegendSvg(type: StructureMarkerType): string {
  const emoji = STRUCTURE_EMOJIS[type];
  return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display:block;">
    <circle cx="12" cy="12" r="12" fill="#ffffff" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2))"/>
    <text x="12" y="13" text-anchor="middle" dominant-baseline="middle" font-size="14" style="font-family:emoji,Segoe UI Emoji,Apple Color Emoji,Noto Color Emoji,sans-serif;">${emoji}</text>
  </svg>`;
}
