/**
 * Animal homes and structures supported as a separate observation type.
 *
 * Derived from 4_Species/Animal_Homes_Structures_List.md.
 * This is the simplified runtime list used in the reporting form.
 */

export interface StructureEntry {
  displayName: string;
  id: string;
  emoji: string;
}

export interface StructureCategory {
  displayName: string;
  id: string;
  emoji: string;
  entries: StructureEntry[];
}

export const STRUCTURE_CATEGORIES: StructureCategory[] = [
  {
    displayName: 'Nests',
    id: 'nests',
    emoji: '🪺',
    entries: [
      { displayName: 'Eagle Nest', id: 'eagle-nest', emoji: '🪺' },
      { displayName: 'Owl Nest', id: 'owl-nest', emoji: '🪺' },
      { displayName: 'Hawk Nest', id: 'hawk-nest', emoji: '🪺' },
      { displayName: 'Osprey Nest', id: 'osprey-nest', emoji: '🪺' },
      { displayName: 'Heron Nest', id: 'heron-nest', emoji: '🪺' },
      { displayName: 'Songbird Nest', id: 'songbird-nest', emoji: '🪺' },
      { displayName: 'Ground Nest', id: 'ground-nest', emoji: '🪺' },
    ],
  },
  {
    displayName: 'Roosts',
    id: 'roosts',
    emoji: '🦇',
    entries: [
      { displayName: 'Bat Roost', id: 'bat-roost', emoji: '🦇' },
      { displayName: 'Bird Roost', id: 'bird-roost', emoji: '🐦' },
    ],
  },
  {
    displayName: 'Dens & Burrows',
    id: 'dens-burrows',
    emoji: '🕳️',
    entries: [
      { displayName: 'Mammal Den', id: 'mammal-den', emoji: '🕳️' },
      { displayName: 'Fox Den', id: 'fox-den', emoji: '🦊' },
      { displayName: 'Coyote Den', id: 'coyote-den', emoji: '🐺' },
      { displayName: 'Rabbit Burrow', id: 'rabbit-burrow', emoji: '🐰' },
      { displayName: 'Badger Burrow', id: 'badger-burrow', emoji: '🦡' },
      { displayName: 'Ground Squirrel Burrow', id: 'ground-squirrel-burrow', emoji: '🐿️' },
    ],
  },
  {
    displayName: 'Beaver Structures',
    id: 'beaver-structures',
    emoji: '🪵',
    entries: [
      { displayName: 'Beaver Dam', id: 'beaver-dam', emoji: '🪵' },
      { displayName: 'Beaver Lodge', id: 'beaver-lodge', emoji: '🛖' },
    ],
  },
  {
    displayName: 'Tree Habitat Features',
    id: 'tree-habitat-features',
    emoji: '🌳',
    entries: [
      { displayName: 'Tree Cavity', id: 'tree-cavity', emoji: '🌳' },
    ],
  },
  {
    displayName: 'Other',
    id: 'other',
    emoji: '🏠',
    entries: [
      { displayName: 'Animal Home (Unknown)', id: 'animal-home-unknown', emoji: '🏠' },
      { displayName: 'Other Structure', id: 'other-structure', emoji: '📍' },
    ],
  },
];

export const STRUCTURE_CATEGORY_ORDER = STRUCTURE_CATEGORIES.map((c) => c.id);

export function getStructureCategoryById(id: string): StructureCategory | undefined {
  return STRUCTURE_CATEGORIES.find((c) => c.id === id);
}

export function getStructureEntry(categoryId: string, entryId: string): StructureEntry | undefined {
  const category = getStructureCategoryById(categoryId);
  return category?.entries.find((e) => e.id === entryId);
}
