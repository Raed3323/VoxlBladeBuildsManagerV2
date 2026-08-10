// ============================================================
// BUILD DATA
// ------------------------------------------------------------
// This file holds:
//
//   1. CATEGORIES / CATEGORY_ORDER - the shared requirement
//      taxonomy every build's requirements are grouped under.
//   2. DEFAULT_BUILDS - seed data used the very first time
//      the app runs.
//
// DEFAULT_BUILDS is intentionally EMPTY so the website starts
// with NO default/sample builds.
//
// After initialization, the real source of truth is whatever
// is stored in localStorage - see:
//   src/hooks/useBuilds.js
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

export const CATEGORY_ORDER = [
  'weapon',
  'armor',
  'accessory',
  'enchant',
  'infuse',
  'guild',
  'shrine',
]

export const BUILD_TAGS = [
  'Damage',
  'Tank',
  'Buffer',
  'Debuffer',
  'Healer',
  'Summoner',
  'Mobility',
]

// ============================================================
// DEFAULT BUILDS
// ------------------------------------------------------------
// Intentionally empty.
//
// New users should start with ZERO builds.
// Users can create their own builds through the website.
//
// Do not add sample/demo builds here unless intentionally
// providing a default build in the future.
// ============================================================

export const DEFAULT_BUILDS = []