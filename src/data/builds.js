// ============================================================
// BUILD DATA
// ------------------------------------------------------------
// This file no longer holds "the build" - it holds:
//
//   1. CATEGORIES / CATEGORY_ORDER - the shared requirement
//      taxonomy every build's requirements are grouped under.
//   2. DEFAULT_BUILDS - the seed data used the very first time
//      the app runs (i.e. Queen Bumblz). After that, the real
//      source of truth is whatever's in localStorage - see
//      src/hooks/useBuilds.js.
//
// Builds themselves - name, description, loadout, requirements,
// progress - are all just data now. Nothing in the UI branches
// on a specific build id or item name; add, edit, or delete
// builds entirely from the website.
//
// requirement fields:
//   id        - unique string within the build
//   category  - one of the CATEGORY keys below
//   name      - display name
//   note      - optional short note (e.g. "Used for: Sporeboss")
//   qty       - how many are needed (default 1)
//   optional  - true if it should NOT count toward main progress
//
// loadout slot fields:
//   id            - unique string within the build
//   label         - slot label, e.g. "Handle" or "Helmet" - free text,
//                   builds are not limited to any fixed slot set
//   item          - the equipped item's display name
//   optional      - true to flag the slot as optional gear
//   enchantments  - optional string[] of enchantment names/phrases
//                   applied to this slot's item (feeds the Stats
//                   calculator - see calculations/statsCalculator.js)
//   forgeLevel    - optional number 0-5, this slot's Forge upgrade
//                   level (also feeds the Stats calculator)
// ============================================================

export const CATEGORIES = {
  weapon: { label: 'Weapon', icon: '⚔' },
  armor: { label: 'Armor', icon: '🛡' },
  accessory: { label: 'Accessories', icon: '💍' },
  enchant: { label: 'Enchantments', icon: '✦' },
  infuse: { label: 'Infuse', icon: '◆' },
  guild: { label: 'Guild', icon: '🏰' },
  shrine: { label: 'Shrine of Balance', icon: '☯' },
}

export const CATEGORY_ORDER = ['weapon', 'armor', 'accessory', 'enchant', 'infuse', 'guild', 'shrine']

export const BUILD_TAGS = ['Damage', 'Tank', 'Buffer', 'Debuffer', 'Healer', 'Summoner', 'Mobility']

const queenBumblz = {
  id: 'queen-bumblz',
  name: 'Queen Bumblz Build',
  description: 'Physical burst build built around the Hallowed Blade and Sporeboss armor set.',
  tags: ['Damage'],
  loadout: [
    { id: 'slot-handle', label: 'Handle', item: 'Queen Bumblz' },
    { id: 'slot-pole', label: 'Pole', item: 'Queen Bumblz', forgeLevel: 5 },
    { id: 'slot-blade', label: 'Blade', item: 'Hallowed Blade', forgeLevel: 5 },
    { id: 'slot-armor', label: 'Armor', item: 'Sporeboss', enchantments: ['Restored Sacrificial'] },
    { id: 'slot-guild', label: 'Guild', item: 'Draco Obviously' },
    { id: 'slot-sob', label: 'SoB', item: 'Shrine of Balance', optional: true },
  ],
  requirements: [
    // -- WEAPON --
    { id: 'w-handle', category: 'weapon', name: 'Queen Bumblz', note: 'Handle', qty: 1 },
    { id: 'w-pole', category: 'weapon', name: 'Queen Bumblz', note: 'Pole', qty: 1 },
    { id: 'w-blade', category: 'weapon', name: 'Hallowed Blade', note: 'Blade', qty: 1 },

    // -- ARMOR --
    { id: 'a-sporeboss', category: 'armor', name: 'Sporeboss', note: 'Armor', qty: 1 },

    // -- ACCESSORIES --
    { id: 'acc-mines-captain', category: 'accessory', name: 'Mines Captain', qty: 2 },
    { id: 'acc-boglord-ring', category: 'accessory', name: 'Boglord Ring', qty: 1 },
    { id: 'acc-caci-rune', category: 'accessory', name: 'Caci Rune', qty: 1 },

    // -- ENCHANTMENTS --
    { id: 'ench-restored-sac', category: 'enchant', name: 'Restored Sacrificial', note: 'Used for: Sporeboss', qty: 1 },
    { id: 'ench-sac-contained', category: 'enchant', name: 'Sacrificial Contained', qty: 3 },
    { id: 'ench-sac-quick', category: 'enchant', name: 'Sacrificial Quick / Piercing', qty: 1 },

    // -- INFUSE --
    { id: 'inf-divine-infantry', category: 'infuse', name: 'Divine Infantry', qty: 1 },
    { id: 'inf-queen-bumblz', category: 'infuse', name: 'Queen Bumblz', qty: 1 },
    { id: 'inf-cragstone', category: 'infuse', name: 'Cragstone', qty: 1 },
    { id: 'inf-boglord-ring', category: 'infuse', name: 'Boglord Ring', qty: 1 },

    // -- GUILD --
    { id: 'guild-draco', category: 'guild', name: 'Draco Obviously', qty: 1 },

    // -- SHRINE OF BALANCE (optional) --
    { id: 'sob-shrine', category: 'shrine', name: 'Shrine of Balance', qty: 1, optional: true },
  ],
}

export const DEFAULT_BUILDS = [queenBumblz]
