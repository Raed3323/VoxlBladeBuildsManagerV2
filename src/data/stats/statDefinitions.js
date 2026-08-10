// ============================================================
// STAT DEFINITIONS
// ------------------------------------------------------------
// Source of truth for which stats actually exist in VoxlBlade.
//
// Verified against:
//   - https://voxlpedia.miraheze.org/wiki/Stats
//     "Boosts are the main way in which the player is granted
//      bonuses... present on all types of Equipment, Weapons,
//      and Guilds. The following is a list of stats and their
//      effects, not including Perks."
//   - https://voxlpedia.miraheze.org/wiki/Template:ArmorStats
//     the actual template parameter list every armor infobox is
//     built from - this is the most authoritative enumeration of
//     real stat fields available:
//       Air Boost, Dexterity Boost, Earth Boost, Fire Boost,
//       Hex Boost, Holy Boost, Magic Boost, Physical Boost,
//       Water Boost, Speed Boost, Jump Boost, Attack Speed,
//       Air Defense, Earth Defense, Fire Defense, Hex Defense,
//       Holy Defense, Magic Defense, Physical Defense,
//       Water Defense, Protection, Warding, Tenacity,
//       Cold Resistance, Heat Resistance
//   - Individual weapon pages (Hallowed Blade, Queen Bumblz
//     Pole/Core/Gloves) additionally confirm Summon Boost as a
//     real boost stat (not in the armor template, but present on
//     weapon/guild stat blocks per the Stats page's own wording).
//
// `type` matters - VoxlBlade does NOT represent every stat as a
// percentage:
//   'percentage' - e.g. Physical Boost +45.0%
//   'flat'       - e.g. Protection +10, Jump Boost +5
//                  (Jump Boost flat value confirmed on Bumblz
//                  Gloves: "Jump Boost: +5")
//   'multiplier' - Attack Speed, a base weapon-part value (e.g.
//                  1, 1.1) rather than an additive bonus
//   'special'    - stats whose exact representation could not be
//                  confirmed this session (see `verified` below)
//
// Every entry carries `verified`. Where research this session
// could not confirm a detail (e.g. whether Tenacity is flat or
// percentage), it is marked unverified rather than guessed, per
// the accuracy-over-completeness rule.
// ============================================================

export const STAT_CATEGORIES = {
  boosts: { id: 'boosts', label: 'Boosts', icon: '⚔' },
  defenses: { id: 'defenses', label: 'Defenses', icon: '🛡' },
  resistances: { id: 'resistances', label: 'Resistances', icon: '❄' },
  utility: { id: 'utility', label: 'Utility / Special', icon: '✦' },
  scalings: { id: 'scalings', label: 'Damage Scalings', icon: '◈' },
}

export const STAT_CATEGORY_ORDER = ['boosts', 'defenses', 'resistances', 'utility', 'scalings']

// color isn't random - each element/stat family keeps one hue
// across boosts and defenses so e.g. every "Fire" row reads the
// same color whether it's a boost or a defense.
const ELEMENT_COLORS = {
  physical: '#e0525f',
  magic: '#4c9de0',
  holy: '#eac54f',
  hex: '#a259e0',
  fire: '#e0703e',
  water: '#4fb8e0',
  earth: '#a67c4a',
  air: '#cfe8f5',
  dexterity: '#e0c23e',
  speed: '#8fd45c',
  summon: '#7fb2e0',
  cold: '#7fd4e0',
  heat: '#e08c4f',
}

export const STAT_DEFS = {
  // ---- BOOSTS (verified) ----
  physicalBoost: { id: 'physicalBoost', label: 'Physical Boost', category: 'boosts', type: 'percentage', color: ELEMENT_COLORS.physical, verified: true, description: 'Increases the effectiveness of Physical damage scaling.' },
  magicBoost: { id: 'magicBoost', label: 'Magic Boost', category: 'boosts', type: 'percentage', color: ELEMENT_COLORS.magic, verified: true, description: 'Increases the effectiveness of Magic damage scaling.' },
  holyBoost: { id: 'holyBoost', label: 'Holy Boost', category: 'boosts', type: 'percentage', color: ELEMENT_COLORS.holy, verified: true, description: 'Increases the effectiveness of Holy damage scaling.' },
  hexBoost: { id: 'hexBoost', label: 'Hex Boost', category: 'boosts', type: 'percentage', color: ELEMENT_COLORS.hex, verified: true, description: 'Increases the effectiveness of Hex damage scaling.' },
  fireBoost: { id: 'fireBoost', label: 'Fire Boost', category: 'boosts', type: 'percentage', color: ELEMENT_COLORS.fire, verified: true, description: 'Increases the effectiveness of Fire damage scaling.' },
  waterBoost: { id: 'waterBoost', label: 'Water Boost', category: 'boosts', type: 'percentage', color: ELEMENT_COLORS.water, verified: true, description: 'Increases the effectiveness of Water damage scaling.' },
  earthBoost: { id: 'earthBoost', label: 'Earth Boost', category: 'boosts', type: 'percentage', color: ELEMENT_COLORS.earth, verified: true, description: 'Increases the effectiveness of Earth damage scaling.' },
  airBoost: { id: 'airBoost', label: 'Air Boost', category: 'boosts', type: 'percentage', color: ELEMENT_COLORS.air, verified: true, description: 'Increases the effectiveness of Air damage scaling.' },
  dexterityBoost: { id: 'dexterityBoost', label: 'Dexterity Boost', category: 'boosts', type: 'percentage', color: ELEMENT_COLORS.dexterity, verified: true, description: 'Increases the effectiveness of Dexterity damage scaling.' },
  speedBoost: { id: 'speedBoost', label: 'Speed Boost', category: 'boosts', type: 'percentage', color: ELEMENT_COLORS.speed, verified: true, description: 'Increases movement speed.' },
  summonBoost: { id: 'summonBoost', label: 'Summon Boost', category: 'boosts', type: 'percentage', color: ELEMENT_COLORS.summon, verified: true, description: 'Increases the effectiveness of Summon damage scaling and summon-related perks.' },

  // ---- DAMAGE SCALINGS (weapon-part values) ----
  physicalScaling: { id: 'physicalScaling', label: 'Physical Scaling', category: 'scalings', type: 'multiplier', color: ELEMENT_COLORS.physical, verified: true, description: 'Weapon-part Physical damage scaling value.' },
  magicScaling: { id: 'magicScaling', label: 'Magic Scaling', category: 'scalings', type: 'multiplier', color: ELEMENT_COLORS.magic, verified: true, description: 'Weapon-part Magic damage scaling value.' },
  holyScaling: { id: 'holyScaling', label: 'Holy Scaling', category: 'scalings', type: 'multiplier', color: ELEMENT_COLORS.holy, verified: true, description: 'Weapon-part Holy damage scaling value.' },
  hexScaling: { id: 'hexScaling', label: 'Hex Scaling', category: 'scalings', type: 'multiplier', color: ELEMENT_COLORS.hex, verified: true, description: 'Weapon-part Hex damage scaling value.' },
  fireScaling: { id: 'fireScaling', label: 'Fire Scaling', category: 'scalings', type: 'multiplier', color: ELEMENT_COLORS.fire, verified: true, description: 'Weapon-part Fire damage scaling value.' },
  waterScaling: { id: 'waterScaling', label: 'Water Scaling', category: 'scalings', type: 'multiplier', color: ELEMENT_COLORS.water, verified: true, description: 'Weapon-part Water damage scaling value.' },
  earthScaling: { id: 'earthScaling', label: 'Earth Scaling', category: 'scalings', type: 'multiplier', color: ELEMENT_COLORS.earth, verified: true, description: 'Weapon-part Earth damage scaling value.' },
  airScaling: { id: 'airScaling', label: 'Air Scaling', category: 'scalings', type: 'multiplier', color: ELEMENT_COLORS.air, verified: true, description: 'Weapon-part Air damage scaling value.' },
  dexterityScaling: { id: 'dexterityScaling', label: 'Dexterity Scaling', category: 'scalings', type: 'multiplier', color: ELEMENT_COLORS.dexterity, verified: true, description: 'Weapon-part Dexterity damage scaling value.' },
  summonScaling: { id: 'summonScaling', label: 'Summon Scaling', category: 'scalings', type: 'multiplier', color: ELEMENT_COLORS.summon, verified: true, description: 'Weapon-part Summon damage scaling value.' },

  // ---- DEFENSES (verified) ----
  physicalDefense: { id: 'physicalDefense', label: 'Physical Defense', category: 'defenses', type: 'percentage', color: ELEMENT_COLORS.physical, verified: true, description: 'Reduces incoming Physical damage.' },
  magicDefense: { id: 'magicDefense', label: 'Magic Defense', category: 'defenses', type: 'percentage', color: ELEMENT_COLORS.magic, verified: true, description: 'Reduces incoming Magic damage.' },
  holyDefense: { id: 'holyDefense', label: 'Holy Defense', category: 'defenses', type: 'percentage', color: ELEMENT_COLORS.holy, verified: true, description: 'Reduces incoming Holy damage.' },
  hexDefense: { id: 'hexDefense', label: 'Hex Defense', category: 'defenses', type: 'percentage', color: ELEMENT_COLORS.hex, verified: true, description: 'Reduces incoming Hex damage.' },
  fireDefense: { id: 'fireDefense', label: 'Fire Defense', category: 'defenses', type: 'percentage', color: ELEMENT_COLORS.fire, verified: true, description: 'Reduces incoming Fire damage.' },
  waterDefense: { id: 'waterDefense', label: 'Water Defense', category: 'defenses', type: 'percentage', color: ELEMENT_COLORS.water, verified: true, description: 'Reduces incoming Water damage.' },
  earthDefense: { id: 'earthDefense', label: 'Earth Defense', category: 'defenses', type: 'percentage', color: ELEMENT_COLORS.earth, verified: true, description: 'Reduces incoming Earth damage.' },
  airDefense: { id: 'airDefense', label: 'Air Defense', category: 'defenses', type: 'percentage', color: ELEMENT_COLORS.air, verified: true, description: 'Reduces incoming Air damage.' },

  // ---- RESISTANCES (verified) ----
  coldResistance: { id: 'coldResistance', label: 'Cold Resistance', category: 'resistances', type: 'percentage', color: ELEMENT_COLORS.cold, verified: true, description: 'Reduces the effect of Cold-related status/damage.' },
  heatResistance: { id: 'heatResistance', label: 'Heat Resistance', category: 'resistances', type: 'percentage', color: ELEMENT_COLORS.heat, verified: true, description: 'Reduces the effect of Heat-related status/damage.' },

  // ---- UTILITY / SPECIAL ----
  attackSpeed: { id: 'attackSpeed', label: 'Attack Speed', category: 'utility', type: 'percentage', color: '#f5d97a', verified: true, description: 'Attack Speed bonus as shown on equipment/enchant pages (e.g. +2%, -15%). Weapon-part base multipliers are rare and handled separately when present.' },
  jumpBoost: { id: 'jumpBoost', label: 'Jump Boost', category: 'utility', type: 'flat', color: '#7fe07f', verified: true, description: 'Flat increase to jump height (e.g. Bumblz Gloves grant a flat +5).' },
  protection: { id: 'protection', label: 'Protection', category: 'utility', type: 'flat', color: '#c9c3d6', verified: true, description: 'Grants a shield that recovers slowly over time; negative Protection reduces Max HP.' },
  armorPenetration: { id: 'armorPenetration', label: 'Armor Penetration', category: 'utility', type: 'flat', color: '#d0d0d0', verified: true, description: 'Flat Armor Penetration granted by equipment/enchantments (e.g. Piercing).' },
  cooldown: { id: 'cooldown', label: 'Cooldown', category: 'utility', type: 'flat', color: '#9aa0b4', verified: true, description: 'Base cooldown in seconds for runes/weapon arts as listed on the wiki.' },
  cooldownReduction: { id: 'cooldownReduction', label: 'Cooldown Reduction', category: 'utility', type: 'percentage', color: '#7ec8e3', verified: true, description: 'Reduces rune or weapon art cooldowns.' },
  warding: { id: 'warding', label: 'Warding', category: 'utility', type: 'percentage', color: '#eac54f', verified: true, description: 'Reduces debuff potency and increases resistance to damage-over-time effects. Wiki pages may encode it as decimals such as +0.1; the calculator normalizes that to the percentage-style in-game display.' },
  lifesteal: { id: 'lifesteal', label: 'Lifesteal', category: 'utility', type: 'flat', color: '#e05b7f', verified: true, description: 'Lifesteal value granted by equipment/enchantments.' },
  tenacity: {
    id: 'tenacity',
    label: 'Tenacity',
    category: 'utility',
    type: 'special',
    color: '#9b6fd6',
    verified: false,
    description: 'Listed on the Wiki\'s Stats/ArmorStats template as a real stat, but this session could not confirm whether its value is flat or percentage-based (live Wiki fetch was blocked by bot protection). Treat displayed values as UNVERIFIED representation.',
  },
}

export function getStatDef(id) {
  return STAT_DEFS[id] ?? null
}
