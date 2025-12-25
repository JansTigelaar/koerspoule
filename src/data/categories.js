// src/data/categories.js

export const CATEGORIES = [
  // Etappes (9 categorieën)
  { 
    id: 'gc-aliens', 
    name: 'GC Aliens', 
    type: 'stage',
    allowedRiderNumbers: [1, 11]
  },
  { 
    id: 'god-ex-alien', 
    name: 'God of n ex-Alien?', 
    type: 'stage',
    allowedRiderNumbers: [21, 71]
  },
  { 
    id: 'klassieke-aliens', 
    name: 'Klassieke Aliens & Ganna', 
    type: 'stage',
    allowedRiderNumbers: [17, 64, 101]
  },
  { 
    id: 'doen-leuk-mee', 
    name: 'Doen leuk mee', 
    type: 'stage',
    allowedRiderNumbers: [51, 61, 81, 191, 211]
  },
  { 
    id: 'willen-ook-meedoen', 
    name: 'Deze willen ook leuk meedoen', 
    type: 'stage',
    allowedRiderNumbers: [91, 151, 221, 67]
  },
  { 
    id: 'nog-kans', 
    name: 'Geef ze nog een kans!', 
    type: 'stage',
    allowedRiderNumbers: [76, 121, 141, 62]
  },
  { 
    id: 'superknecht', 
    name: 'Superknecht', 
    type: 'stage',
    allowedRiderNumbers: [5, 6, 16, 72, 28]
  },
  { 
    id: 'super-superknecht', 
    name: 'Super superknecht', 
    type: 'stage',
    allowedRiderNumbers: [2, 15]
  },
  { 
    id: 'tweelingen', 
    name: 'Tweelingenexperiment', 
    type: 'stage',
    allowedRiderNumbers: [8, 18]
  },
  
  // Sprinters (5 categorieën)
  { 
    id: 'supersprinter', 
    name: 'Supersprinter', 
    type: 'sprint',
    allowedRiderNumbers: [41, 83]
  },
  { 
    id: 'super-supersprinter', 
    name: 'Super supersprinter', 
    type: 'sprint',
    allowedRiderNumbers: [24, 105]
  },
  { 
    id: 'sprinter', 
    name: 'Sprinter', 
    type: 'sprint',
    allowedRiderNumbers: [73, 103, 124, 192, 78]
  },
  { 
    id: 'nog-sprinter', 
    name: 'Nog n sprinter', 
    type: 'sprint',
    allowedRiderNumbers: [31, 112, 134, 163, 173]
  },
  { 
    id: 'en-nog-een', 
    name: 'EN NOG EEN?!', 
    type: 'sprint',
    allowedRiderNumbers: [202, 52, 186, 228]
  },
  
  // Puncheurs (2 categorieën)
  { 
    id: 'puncheurs-1', 
    name: 'Puncheurs 1', 
    type: 'puncheur',
    allowedRiderNumbers: [131, 94, 84, 55, 111]
  },
  { 
    id: 'puncheurs-2', 
    name: 'Puncheurs 2', 
    type: 'puncheur',
    allowedRiderNumbers: [3, 38, 27, 75]
  },
  
  // Paret-Peintre special
  { 
    id: 'paret-peintre', 
    name: 'Paret-Peintre of Paret-Peintre?', 
    type: 'special',
    allowedRiderNumbers: [25, 156]
  },
  
  // Andere categorieën
  { 
    id: 'rittenkapers', 
    name: 'Rittenkapers', 
    type: 'other',
    allowedRiderNumbers: [34, 35, 37, 56, 85, 223, 114, 206]
  },
  { 
    id: 'klimmers', 
    name: 'Klimmers', 
    type: 'other',
    allowedRiderNumbers: [161, 117, 122, 147, 171, 201]
  },
  { 
    id: 'klassieke-belg', 
    name: 'Klassieke Belg', 
    type: 'other',
    allowedRiderNumbers: [7, 14, 87, 155, 214]
  },
  { 
    id: 'nederlander', 
    name: 'Nederlander om aan te moedigen', 
    type: 'other',
    allowedRiderNumbers: [23, 47, 77, 127, 177, 197, 198]
  },
  { 
    id: 'rouleurs-1', 
    name: 'Rouleurs 1', 
    type: 'other',
    allowedRiderNumbers: [4, 12, 13, 22]
  },
  { 
    id: 'rouleurs-2', 
    name: 'Rouleurs 2', 
    type: 'other',
    allowedRiderNumbers: [32, 63, 154, 146, 222]
  },
  
  // Jokers (2 categorieën)
  { 
    id: 'joker-1', 
    name: 'Joker 1', 
    type: 'joker',
    isJoker: true
  },
  { 
    id: 'joker-2', 
    name: 'Joker 2', 
    type: 'joker',
    isJoker: true
  }
];

// Helper functie om te checken of een renner toegestaan is voor een categorie
export const isRiderAllowedForCategory = (categoryId, riderNumber, riderIsJoker) => {
  const category = CATEGORIES.find(c => c.id === categoryId);
  if (!category) return false;
  
  // Voor joker categorieën: alleen joker renners zijn toegestaan
  if (category.isJoker) {
    return riderIsJoker;
  }
  
  // Voor andere categorieën: check of renner in allowedRiderNumbers zit
  if (category.allowedRiderNumbers) {
    return category.allowedRiderNumbers.includes(riderNumber);
  }
  
  return false;
};

// Helper functie om alle toegestane renners voor een categorie te krijgen
export const getAllowedRidersForCategory = (categoryId, allRiders) => {
  const category = CATEGORIES.find(c => c.id === categoryId);
  if (!category) return [];
  
  // Voor joker categorieën: return alle joker renners
  if (category.isJoker) {
    return allRiders.filter(r => r.isJoker);
  }
  
  // Voor andere categorieën: filter op allowedRiderNumbers
  if (category.allowedRiderNumbers) {
    return allRiders.filter(r => category.allowedRiderNumbers.includes(r.number));
  }
  
  return [];
};

// Puntensysteem per etappe
export const POINTS_SYSTEM = [
  { position: 1, points: 50 },
  { position: 2, points: 40 },
  { position: 3, points: 32 },
  { position: 4, points: 26 },
  { position: 5, points: 22 },
  { position: 6, points: 20 },
  { position: 7, points: 18 },
  { position: 8, points: 16 },
  { position: 9, points: 14 },
  { position: 10, points: 12 },
  { position: 11, points: 10 },
  { position: 12, points: 9 },
  { position: 13, points: 8 },
  { position: 14, points: 7 },
  { position: 15, points: 6 },
  { position: 16, points: 5 },
  { position: 17, points: 4 },
  { position: 18, points: 3 },
  { position: 19, points: 2 },
  { position: 20, points: 1 }
];

// Functie om punten te krijgen op basis van positie
export const getPointsForPosition = (position) => {
  const pointEntry = POINTS_SYSTEM.find(p => p.position === position);
  return pointEntry ? pointEntry.points : 0;
};
