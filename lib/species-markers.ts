import L from 'leaflet';

/**
 * Supported species-specific and wildlife-category marker variants.
 */
export type SpeciesMarkerType =
  | 'deer'
  | 'owl'
  | 'eagle'
  | 'hawk'
  | 'bear'
  | 'coyote'
  | 'fox'
  | 'beaver'
  | 'raccoon'
  | 'skunk'
  | 'cougar'
  | 'moose'
  | 'elk'
  | 'turkey'
  | 'quail'
  | 'rabbit'
  // Wildlife category markers
  | 'reptile'
  | 'amphibian'
  | 'waterfowl'
  | 'songbird'
  | 'bat'
  | 'squirrel'
  // Generic category markers
  | 'bird'
  | 'mammal'
  | 'herp'
  | 'unknown';

export const SPECIES_MARKER_TYPES: SpeciesMarkerType[] = [
  'deer',
  'owl',
  'eagle',
  'hawk',
  'bear',
  'coyote',
  'fox',
  'beaver',
  'raccoon',
  'skunk',
  'cougar',
  'moose',
  'elk',
  'turkey',
  'quail',
  'rabbit',
  'reptile',
  'amphibian',
  'waterfowl',
  'songbird',
  'bat',
  'squirrel',
];

/**
 * Emoji used for each marker type on both the map and the legend.
 */
const SPECIES_EMOJIS: Record<SpeciesMarkerType, string> = {
  // Specific wildlife
  deer: '🦌',
  owl: '🦉',
  eagle: '🦅',
  hawk: '🦅',
  bear: '🐻',
  coyote: '🐺',
  fox: '🦊',
  beaver: '🦫',
  raccoon: '🦝',
  skunk: '🦨',
  cougar: '🐱',
  moose: '🫎',
  elk: '🫎',
  turkey: '🦃',
  quail: '🐦',
  rabbit: '🐇',
  // Category markers
  reptile: '🦎',
  amphibian: '🐸',
  waterfowl: '🦆',
  songbird: '🐦',
  bat: '🦇',
  squirrel: '🐿️',
  // Generic category fallbacks (not shown in legend by default)
  bird: '🐦',
  mammal: '🐾',
  herp: '🦎',
  unknown: '📍',
};

/**
 * Matching rules for specific species names.
 */
const SPECIES_RULES: { type: SpeciesMarkerType; include: string[]; exclude?: string[] }[] = [
  { type: 'deer', include: ['deer', 'mule deer', 'white-tailed deer', 'whitetail'], exclude: ['deer fly', 'deerfly'] },
  { type: 'owl', include: ['owl'] },
  { type: 'eagle', include: ['eagle'] },
  { type: 'hawk', include: ['hawk'], exclude: ['nighthawk'] },
  { type: 'bear', include: ['bear'] },
  { type: 'coyote', include: ['coyote'] },
  { type: 'fox', include: ['fox'], exclude: ['fox sparrow'] },
  { type: 'beaver', include: ['beaver'] },
  { type: 'raccoon', include: ['raccoon'] },
  { type: 'skunk', include: ['skunk'] },
  { type: 'cougar', include: ['cougar', 'mountain lion', 'puma'] },
  { type: 'moose', include: ['moose'] },
  { type: 'elk', include: ['elk'] },
  { type: 'turkey', include: ['turkey'], exclude: ['turkey vulture'] },
  { type: 'quail', include: ['quail', 'california quail'] },
  { type: 'rabbit', include: ['rabbit', 'cottontail', 'hare', 'jackrabbit'] },
];

/**
 * Wildlife-category mapping layer.
 *
 * Used when a species does not match a specific emoji rule.
 * Keywords are broader and map the species to its nearest wildlife group.
 */
const CATEGORY_RULES: { type: SpeciesMarkerType; include: string[] }[] = [
  { type: 'reptile', include: ['snake', 'lizard', 'turtle', 'rattlesnake', 'boa', 'garter', 'racer', 'alligator'] },
  { type: 'amphibian', include: ['frog', 'toad', 'salamander'] },
  { type: 'waterfowl', include: ['duck', 'goose', 'swan', 'loon', 'grebe', 'coot', 'merganser'] },
  { type: 'songbird', include: ['sparrow', 'finch', 'warbler', 'robin', 'chickadee', 'nuthatch', 'jay', 'crow', 'raven', 'blackbird', 'starling', 'towhee', 'junco', 'siskin', 'goldfinch', 'grosbeak', 'waxwing', 'kingbird', 'wren', 'vireo', 'oriole', 'tanager', 'gnatcatcher', 'catbird', 'thrush'] },
  { type: 'bat', include: ['bat'] },
  { type: 'squirrel', include: ['squirrel', 'chipmunk'] },
];

/**
 * Final fallback based on the observation's species category.
 */
const CATEGORY_FALLBACK: Record<string, SpeciesMarkerType> = {
  Bird: 'bird',
  Mammal: 'mammal',
  'Reptile / Amphibian': 'herp',
};

function matchesRules(name: string, rules: { type: SpeciesMarkerType; include: string[]; exclude?: string[] }[]): SpeciesMarkerType | null {
  const lower = name.toLowerCase();
  for (const rule of rules) {
    if (rule.exclude?.some((term) => lower.includes(term))) continue;
    if (rule.include.some((term) => lower.includes(term))) return rule.type;
  }
  return null;
}

/**
 * Determine the best marker type for a species name and category.
 *
 * Priority:
 * 1. Specific species emoji (e.g. "Bald Eagle" → 🦅)
 * 2. Wildlife-category keyword layer (e.g. "Mallard Duck" → 🦆)
 * 3. Broad species category fallback (e.g. category "Bird" → 🐦)
 * 4. Unknown fallback (📍)
 */
export function getSpeciesMarkerType(speciesName: string, speciesCategory?: string | null): SpeciesMarkerType {
  const specific = matchesRules(speciesName, SPECIES_RULES);
  if (specific) return specific;

  const category = matchesRules(speciesName, CATEGORY_RULES);
  if (category) return category;

  if (speciesCategory && CATEGORY_FALLBACK[speciesCategory]) {
    return CATEGORY_FALLBACK[speciesCategory];
  }

  return 'unknown';
}

const MARKER_SIZE = 32;

function buildEmojiIcon(emoji: string): L.DivIcon {
  return L.divIcon({
    className: 'species-map-marker',
    html: `<div style="width:${MARKER_SIZE}px;height:${MARKER_SIZE}px;border-radius:50%;background:#ffffff;display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1;box-shadow:0 2px 4px rgba(0,0,0,0.25);">${emoji}</div>`,
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
    popupAnchor: [0, -MARKER_SIZE / 2],
  });
}

/**
 * Cache of rendered Leaflet DivIcons keyed by emoji.
 * Multiple species can share the same emoji.
 */
const iconCache = new Map<string, L.DivIcon>();

/**
 * Creates an emoji marker icon for the main observation map.
 *
 * Uses specific → category keyword → species category → 📍 fallback chain.
 */
export function createSpeciesMarkerIcon(speciesName: string, speciesCategory?: string | null): L.DivIcon {
  const type = getSpeciesMarkerType(speciesName, speciesCategory);
  const emoji = SPECIES_EMOJIS[type];

  if (!iconCache.has(emoji)) {
    iconCache.set(emoji, buildEmojiIcon(emoji));
  }
  return iconCache.get(emoji)!;
}

/**
 * Returns a smaller SVG suitable for the map legend.
 */
export function getSpeciesLegendSvg(type: SpeciesMarkerType): string {
  const emoji = SPECIES_EMOJIS[type];
  return `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display:block;">
    <circle cx="12" cy="12" r="12" fill="#ffffff" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2))"/>
    <text x="12" y="13" text-anchor="middle" dominant-baseline="middle" font-size="14" style="font-family:emoji,Segoe UI Emoji,Apple Color Emoji,Noto Color Emoji,sans-serif;">${emoji}</text>
  </svg>`;
}
