export interface SpeciesOption {
  name: string;
  category: 'Bird' | 'Mammal' | 'Reptile / Amphibian';
}

export const speciesList: SpeciesOption[] = [
  // Birds
  { name: 'American Robin', category: 'Bird' },
  { name: 'Canada Goose', category: 'Bird' },
  { name: 'Mallard Duck', category: 'Bird' },
  { name: 'Northern Flicker', category: 'Bird' },
  { name: 'Red-winged Blackbird', category: 'Bird' },
  { name: 'Yellow Warbler', category: 'Bird' },
  { name: 'House Sparrow', category: 'Bird' },
  { name: 'European Starling', category: 'Bird' },
  { name: 'Black-capped Chickadee', category: 'Bird' },
  { name: 'Mountain Chickadee', category: 'Bird' },
  { name: 'Dark-eyed Junco', category: 'Bird' },
  { name: 'White-crowned Sparrow', category: 'Bird' },
  { name: 'Song Sparrow', category: 'Bird' },
  { name: 'Western Meadowlark', category: 'Bird' },
  { name: 'American Goldfinch', category: 'Bird' },
  { name: 'Pine Siskin', category: 'Bird' },
  { name: 'Bald Eagle', category: 'Bird' },
  { name: 'Osprey', category: 'Bird' },
  { name: 'Red-tailed Hawk', category: 'Bird' },
  { name: 'Cooper\'s Hawk', category: 'Bird' },
  { name: 'Great Blue Heron', category: 'Bird' },
  { name: 'Common Raven', category: 'Bird' },
  { name: 'American Crow', category: 'Bird' },

  // Mammals
  { name: 'Mule Deer', category: 'Mammal' },
  { name: 'White-tailed Deer', category: 'Mammal' },
  { name: 'Coyote', category: 'Mammal' },
  { name: 'Black Bear', category: 'Mammal' },
  { name: 'Grizzly Bear', category: 'Mammal' },
  { name: 'Raccoon', category: 'Mammal' },
  { name: 'Red Fox', category: 'Mammal' },
  { name: 'Bobcat', category: 'Mammal' },
  { name: 'Lynx', category: 'Mammal' },
  { name: 'Snowshoe Hare', category: 'Mammal' },
  { name: 'Nuttall\'s Cottontail', category: 'Mammal' },
  { name: 'Beaver', category: 'Mammal' },
  { name: 'Muskrat', category: 'Mammal' },
  { name: 'Chipmunk', category: 'Mammal' },
  { name: 'Ground Squirrel', category: 'Mammal' },
  { name: 'River Otter', category: 'Mammal' },

  // Reptiles and Amphibians
  { name: 'Painted Turtle', category: 'Reptile / Amphibian' },
  { name: 'Western Painted Turtle', category: 'Reptile / Amphibian' },
  { name: 'Western Toad', category: 'Reptile / Amphibian' },
  { name: 'Pacific Tree Frog', category: 'Reptile / Amphibian' },
  { name: 'Long-toed Salamander', category: 'Reptile / Amphibian' },
  { name: 'Common Garter Snake', category: 'Reptile / Amphibian' },
  { name: 'Western Terrestrial Garter Snake', category: 'Reptile / Amphibian' },
  { name: 'Garter Snake', category: 'Reptile / Amphibian' },
  { name: 'Rubber Boa', category: 'Reptile / Amphibian' },
  { name: 'Racer (Yellow-bellied Racer)', category: 'Reptile / Amphibian' },
];

export const notSureOption: SpeciesOption = {
  name: 'Not Sure / Other',
  category: 'Bird', // placeholder, category is still required
};

export function getSpeciesByCategory(category: SpeciesOption['category']): SpeciesOption[] {
  const filtered = speciesList.filter((s) => s.category === category);
  return [...filtered, { ...notSureOption, category }];
}

export function searchSpecies(query: string, category?: SpeciesOption['category']): SpeciesOption[] {
  const list = category ? getSpeciesByCategory(category) : [...speciesList, notSureOption];
  const lower = query.toLowerCase();
  return list.filter((s) => s.name.toLowerCase().includes(lower));
}
