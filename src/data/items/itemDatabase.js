// ============================================================
// ITEM DATABASE
// ------------------------------------------------------------
// Centralized, extensible per-item stat data. Keyed by the
// lowercased, trimmed item name as it appears in a build's
// loadout slot (`slot.item`).
//
// Every entry declares `verified`. Items that were actually
// found and read on the Wiki this session (via search snippets -
// the live site itself blocked direct fetches with bot
// detection) have `verified: true`, exact `stats`/`perks`, and a
// real `wikiUrl`.
//
// Items referenced by the seed build that could NOT be
// confirmed with real numbers this session (Spore Boss Man,
// Boglord Ring, Mines Captain, Caci Rune, Draco Obviously) are
// intentionally left OUT of this database entirely rather than
// filled in with invented numbers - the calculator treats a
// missing entry as "no verified Wiki data" and says so in the
// UI instead of showing a fabricated stat or a silent 0.
//
// Stat value convention: percentage-type values are stored as
// the raw percent number (15 means +15%), matching how the Wiki
// itself writes them ("Holy Boost: +15%").
// ============================================================

const WIKI_BASE = 'https://voxlpedia.miraheze.org/wiki/'

function entry({ name, wikiTitle, slotType, tier, stats = {}, perks = [], verified, note }) {
  return {
    name,
    slotType,
    tier,
    stats,
    perks,
    verified,
    note,
    wikiUrl: wikiTitle ? `${WIKI_BASE}${encodeURIComponent(wikiTitle.replace(/ /g, '_'))}` : null,
  }
}

// Keys are `${lowercased item name}` OR, where a name is shared
// across multiple distinct Wiki pages (weapon "parts" branches),
// `${lowercased item name}|${lowercased slot label}` so the
// exact same build item can resolve differently per slot without
// guessing which part is meant.
export const ITEM_DB = {
  // --- Hallowed Blade (Blade part) ---
  // https://voxlpedia.miraheze.org/wiki/Hallowed_Blade
  'hallowed blade': entry({
    name: 'Hallowed Blade',
    wikiTitle: 'Hallowed Blade',
    slotType: 'weapon-blade',
    tier: 4,
    stats: {
      holyBoost: 15,
      warding: 20,
    },
    perks: [
      { name: 'Blessing', amount: 1, description: 'Healing now has a low chance to grant various standard Buffs at varying potency.' },
      { name: 'Light Bearer', amount: 1, description: "Hits with LMB's or RMB's has a chance to release a healing pulse. Possesses a Proc Coefficient." },
    ],
    verified: true,
  }),

  // --- Queen Bumblz Pole (Handle part) ---
  // https://voxlpedia.miraheze.org/wiki/Queen_Bumblz_Pole
  'queen bumblz|pole': entry({
    name: 'Queen Bumblz Pole',
    wikiTitle: 'Queen Bumblz Pole',
    slotType: 'weapon-handle',
    tier: 4,
    stats: {
      summonBoost: 10,
    },
    perks: [
      { name: "Queens Power", amount: 1, description: "Upon summoning a minion, grants the Buff 'Queens Power'." },
      { name: 'Reinforced Block', amount: 1, description: 'Decreases Damage taken from an Attack that failed to Guardbreak you.' },
    ],
    verified: true,
  }),

  // --- Queen Bumblz Core (Blade-category counterpart to the Pole) ---
  // https://voxlpedia.miraheze.org/wiki/Queen_Bumblz_Core
  'queen bumblz core': entry({
    name: 'Queen Bumblz Core',
    wikiTitle: 'Queen Bumblz Core',
    slotType: 'weapon-blade',
    tier: 4,
    stats: {
      summonBoost: 10,
    },
    perks: [
      { name: 'Reinforced Block', amount: 1, description: 'Decreases Damage taken from an Attack that failed to Guardbreak you.' },
      { name: "Queens Power", amount: 1, description: "Upon summoning a minion, grants the Buff 'Queens Power'." },
    ],
    verified: true,
  }),

  // --- Queen Bumblz Gloves (Essence-branch/Gloves part) ---
  // https://voxlpedia.miraheze.org/wiki/Queen_Bumblz_Gloves
  'queen bumblz gloves': entry({
    name: 'Queen Bumblz Gloves',
    wikiTitle: 'Queen Bumblz Gloves',
    slotType: 'weapon-gloves',
    tier: 4,
    stats: {
      summonBoost: 15,
    },
    perks: [
      { name: 'Sticky Summons', amount: 1, description: 'Your minions gain Magic Defense and a chance to inflict Sticky on hit.' },
      { name: "Queens Power", amount: 1, description: "Upon summoning a minion, grants the Buff 'Queens Power'." },
      { name: 'Queen Bumblz Spirit', amount: 1, description: 'Release your Spiritual Energy upon summoning a minion in the form of a Spiritual Queen Bee that fires honey blasts at nearby enemies (inflicts Sticky, has a Proc Coefficient).' },
    ],
    verified: true,
  }),

  // "Queen Bumblz" alone (no part suffix) is genuinely ambiguous -
  // the Wiki has separate pages for the Pole, Core, Gloves, and
  // Essence variants of this weapon branch, and the build's
  // loadout only ever stores the bare name "Queen Bumblz". Rather
  // than guess which part is meant, this generic key is left
  // unverified/ambiguous so the UI can tell the user exactly what
  // to rename the slot's item to in order to get real numbers.
  'queen bumblz': entry({
    name: 'Queen Bumblz',
    wikiTitle: 'Queen Bumblz',
    slotType: 'ambiguous',
    stats: {},
    perks: [],
    verified: false,
    note: 'Multiple Wiki pages share this name (Queen Bumblz Pole, Core, Gloves, Essence) for different weapon parts. Rename this loadout item to the exact part, e.g. "Queen Bumblz Pole", to get verified stats.',
  }),
}

// --- Verified current-build entries researched from Voxlblade Wiki mirrors ---
// These are kept locally so the Stats page still works offline for common
// equipment. The Wiki resolver fills gaps for newer/renamed items.
Object.assign(ITEM_DB, {
  'crude magic handle': entry({
    name: 'Crude Magic Handle',
    wikiTitle: 'Crude Magic Handle',
    slotType: 'weapon-handle',
    tier: 4,
    stats: { magicBoost: 20, magicScaling: 0.7 },
    perks: [
      { name: 'Dual Wielding', amount: 0.1, description: 'If using a one handed sword or dagger, changes the weapon type into dual wielding.' },
      { name: 'Royal Finisher', amount: 0.1, description: 'Release a magic wave when using a finisher.' },
    ],
    verified: true,
  }),
  'cursed dagger blade': entry({
    name: 'Cursed Dagger Blade',
    wikiTitle: 'Cursed Dagger Blade',
    slotType: 'weapon-blade',
    tier: 4,
    stats: { hexBoost: 10, dexterityBoost: 10, hexScaling: 0.55, dexterityScaling: 0.55 },
    perks: [
      { name: 'Curse Rip', amount: 1, description: 'Hitting a debuffed opponent absorbs essence, heals you slightly, and increases damage.' },
    ],
    verified: true,
  }),
  'earthen ring': entry({
    name: 'Earthen Ring',
    wikiTitle: 'Earthen Ring',
    slotType: 'accessory',
    stats: { earthBoost: 10 },
    perks: [
      { name: 'Erosion', amount: 1, description: 'Earth Type Damage has a chance to inflict Shatter.' },
    ],
    verified: true,
  }),

  // --- Relic Jewel (Helmet) ---
  // https://voxlpedia.miraheze.org/wiki/Relic_Jewel
  'relic jewel': entry({
    name: 'Relic Jewel',
    wikiTitle: 'Relic Jewel',
    slotType: 'armor',
    stats: {
      earthBoost: 20,
      magicBoost: 20,
      speedBoost: -5,
      attackSpeed: -15,
      warding: 20,
    },
    perks: [
      {
        name: 'Essence Ray',
        amount: 1,
        description: 'The Magical Ray Weapon Art in specific is converted into an Essence Ray that shoots out of your forehead, which auto-aims at an eligible opponent furthest from you. You can act freely during this process.',
      },
    ],
    verified: true,
  }),

  // --- Blaster Ring ---
  // https://voxlpedia.miraheze.org/wiki/Blaster_Ring
  'blaster ring': entry({
    name: 'Blaster Ring',
    wikiTitle: 'Blaster Ring',
    slotType: 'accessory',
    stats: {
      speedBoost: 5,
      attackSpeed: 2,
    },
    perks: [
      {
        name: 'Locked And Loaded',
        amount: 1,
        description: "If you're using a one handed weapon type, gain a gun in your offhand that replaces your RMB. Possesses unique interactions at multiple of the perk, and with the Monk guild.",
      },
    ],
    verified: true,
  }),

  // --- Galactic Graviturgy (shared across Helmet / Chestplate / Leggings) ---
  // https://voxlpedia.miraheze.org/wiki/Galactic_Graviturgy
  'galactic graviturgy': entry({
    name: 'Galactic Graviturgy',
    wikiTitle: 'Galactic Graviturgy',
    slotType: 'armor',
    stats: {
      earthBoost: 15,
      magicBoost: 15,
      jumpBoost: 3,
      warding: 25,
    },
    perks: [
      {
        name: 'Heavy Gravitate',
        amount: 1,
        description: "Hitting an opponent with either Earth or Magic Damage from a Weapon Art or Rune applies the debuff 'Heavy Gravity'. Heavy Gravity reduces movement speed, and can be consumed upon using your RMB to deal Damage and heavy Poise Damage.",
      },
    ],
    verified: true,
  }),
  'galactic graviturgy|helmet': entry({
    name: 'Galactic Graviturgy',
    wikiTitle: 'Galactic Graviturgy',
    slotType: 'armor',
    stats: { earthBoost: 15, magicBoost: 15, jumpBoost: 3, warding: 25 },
    perks: [{
      name: 'Heavy Gravitate', amount: 1,
      description: "Hitting an opponent with either Earth or Magic Damage from a Weapon Art or Rune applies the debuff 'Heavy Gravity'. Heavy Gravity reduces movement speed, and can be consumed upon using your RMB to deal Damage and heavy Poise Damage.",
    }],
    verified: true,
  }),
  'galactic graviturgy|chestplate': entry({
    name: 'Galactic Graviturgy',
    wikiTitle: 'Galactic Graviturgy',
    slotType: 'armor',
    stats: { earthBoost: 15, magicBoost: 15, jumpBoost: 3, warding: 25 },
    perks: [{
      name: 'Heavy Gravitate', amount: 1,
      description: "Hitting an opponent with either Earth or Magic Damage from a Weapon Art or Rune applies the debuff 'Heavy Gravity'. Heavy Gravity reduces movement speed, and can be consumed upon using your RMB to deal Damage and heavy Poise Damage.",
    }],
    verified: true,
  }),
  'galactic graviturgy|leggings': entry({
    name: 'Galactic Graviturgy',
    wikiTitle: 'Galactic Graviturgy',
    slotType: 'armor',
    stats: { earthBoost: 15, magicBoost: 15, jumpBoost: 3, warding: 25 },
    perks: [{
      name: 'Heavy Gravitate', amount: 1,
      description: "Hitting an opponent with either Earth or Magic Damage from a Weapon Art or Rune applies the debuff 'Heavy Gravity'. Heavy Gravity reduces movement speed, and can be consumed upon using your RMB to deal Damage and heavy Poise Damage.",
    }],
    verified: true,
  }),

  // --- Hex Web Rune ---
  // https://voxlpedia.miraheze.org/wiki/Hex_Web_Rune
  'hex web': entry({
    name: 'Hex Web Rune',
    wikiTitle: 'Hex_Web_Rune',
    slotType: 'accessory',
    stats: { hexBoost: 10 },
    perks: [],
    verified: true,
    note: 'Base rank. Cooldown 20s. Applies Sticky on hit.',
  }),
  'hex web rune': entry({
    name: 'Hex Web Rune',
    wikiTitle: 'Hex_Web_Rune',
    slotType: 'accessory',
    stats: { hexBoost: 10 },
    perks: [],
    verified: true,
  }),

  // --- Scholar Guild ---
  // https://voxlpedia.miraheze.org/wiki/Scholar
  'scholar': entry({
    name: 'Scholar',
    wikiTitle: 'Scholar',
    slotType: 'guild',
    stats: { magicDefense: 20, warding: 10 },
    perks: [
      { name: 'Channeled Weapon', amount: 1, description: 'All damage you deal now gains slight Magic Damage Type. Additionally, reduces Weapon Art Cooldown.' },
      { name: 'Quickcast', amount: 1, description: 'Cast most Weapon Arts much faster. Additionally, take slightly reduced Stun whilst actively using a Weapon Art.' },
      { name: 'Caster', amount: 1, description: 'Gain Rune and Weapon Art Cooldown reduction, with diminishing returns.' },
    ],
    verified: true,
  }),

  // --- High Elf Race ---
  // From https://voxlpedia.miraheze.org/wiki/Races
  'high elf': entry({
    name: 'High Elf',
    wikiTitle: 'Races',
    slotType: 'race',
    stats: { cooldownReduction: 25 },
    perks: [
      { name: 'High Elf Passive', amount: 1, description: 'Gain 25% Weapon Art cooldown reduction (x0.75 multiplier, no diminishing returns).' },
    ],
    verified: true,
  }),



  // --- Divine Infantry (Armor / common infusion) ---
  // https://voxlpedia.miraheze.org/wiki/Divine_Infantry
  'divine infantry': entry({
    name: 'Divine Infantry',
    wikiTitle: 'Divine_Infantry',
    slotType: 'armor',
    stats: {
      dexterityBoost: 12,
      holyBoost: 12,
      speedBoost: 5,
      attackSpeed: 3,
      physicalDefense: 5,
    },
    perks: [
      { name: 'Mortal Will', amount: 1, description: 'Finishers gain increased Holy Scaling and Holy Damage Type.' },
    ],
    verified: true,
  }),

  // --- Cragstone (Armor / common infusion) ---
  // https://voxlpedia.miraheze.org/wiki/Cragstone
  'cragstone': entry({
    name: 'Cragstone',
    wikiTitle: 'Cragstone',
    slotType: 'armor',
    stats: {
      earthBoost: 12,
      fireBoost: 12,
      earthDefense: 20,
      fireDefense: 20,
    },
    perks: [
      { name: 'Smoldering', amount: 1, description: 'Using a Weapon Art applies Burn to yourself. While Burning, gain a Damage Boost.' },
    ],
    verified: true,
  }),



  // --- Pyre Druid (Armor set page) ---
  'pyre druid': entry({
    name: 'Pyre Druid',
    wikiTitle: 'Pyre_Druid',
    slotType: 'armor',
    stats: {
      fireBoost: 16,
      summonBoost: 16,
      attackSpeed: -5,
      earthDefense: 10,
      fireDefense: -15,
      holyDefense: 10,
    },
    perks: [
      { name: 'Pyre Bloom', amount: 1, description: 'Upon using a Weapon Art, summon a stationary Pyrebloom minion that shoots igniting fireballs at nearby opponents. Their damage counts as Weapon Art damage, and shares the same Buffs as you. Grants Burn potency.' },
    ],
    verified: true,
  }),

})

export function normalizeItemKey(name) {
  return String(name ?? '').trim().toLowerCase()
}

function tokenSet(s) {
  return new Set(normalizeItemKey(s).split(/[^a-z0-9]+/).filter(Boolean))
}

function fuzzyScore(query, candidate) {
  const q = normalizeItemKey(query)
  const c = normalizeItemKey(candidate)
  if (!q || !c) return 0
  if (q === c) return 1
  if (c.startsWith(q) || q.startsWith(c)) return 0.95
  if (c.includes(q)) return 0.9
  if (q.includes(c) && c.length >= 4) return 0.85
  const qt = tokenSet(q)
  const ct = tokenSet(c)
  if (!qt.size || !ct.size) return 0
  let inter = 0
  for (const t of qt) if (ct.has(t)) inter += 1
  const jaccard = inter / new Set([...qt, ...ct]).size
  // prefix token bonus: "galactic" vs "galactic graviturgy"
  const qFirst = [...qt][0]
  const cFirst = [...ct][0]
  const prefixBonus = qFirst && cFirst && (cFirst.startsWith(qFirst) || qFirst.startsWith(cFirst)) ? 0.15 : 0
  return Math.min(1, jaccard * 0.85 + prefixBonus)
}

/**
 * Look up an item's verified stat entry.
 * Matching order (future-proof):
 *  1. Exact scoped key `item|slot`
 *  2. Exact bare name
 *  3. Unique fuzzy/prefix match against all DB names
 *     e.g. "Galactic" → "Galactic Graviturgy" when only one candidate
 */
export function findItem(itemName, slotLabel) {
  const nameKey = normalizeItemKey(itemName)
  if (!nameKey) return null
  const scopedKey = `${nameKey}|${normalizeItemKey(slotLabel)}`
  if (ITEM_DB[scopedKey]) return ITEM_DB[scopedKey]
  if (ITEM_DB[nameKey]) return ITEM_DB[nameKey]

  // Strip armor piece suffixes so "pyre druid chestplate" hits "pyre druid"
  const stripped = nameKey
    .replace(/\s+(helmet|helm|hood|hat|mask|crown|chestplate|chest|cloak|robe|vest|leggings|legs|pants|greaves|boots|gauntlets|gloves)$/i, '')
    .trim()
  if (stripped && stripped !== nameKey) {
    if (ITEM_DB[stripped]) return ITEM_DB[stripped]
    const scoped2 = `${stripped}|${normalizeItemKey(slotLabel)}`
    if (ITEM_DB[scoped2]) return ITEM_DB[scoped2]
  }

  const queryForFuzzy = stripped || nameKey

  // Fuzzy: score every unique item name (ignore scoped keys for ranking)
  const seen = new Map()
  for (const [key, entry] of Object.entries(ITEM_DB)) {
    if (key.includes('|')) continue
    const score = fuzzyScore(queryForFuzzy, key)
    if (score < 0.72) continue
    const prev = seen.get(entry.name)
    if (!prev || score > prev.score) seen.set(entry.name, { entry, score })
  }
  const ranked = [...seen.values()].sort((a, b) => b.score - a.score)
  if (!ranked.length) return null
  if (ranked[0].score >= 0.9) return ranked[0].entry
  if (ranked.length === 1 && ranked[0].score >= 0.72) return ranked[0].entry
  if (ranked.length >= 2 && ranked[0].score - ranked[1].score >= 0.12) return ranked[0].entry
  return null
}

/** List all known item names (for UI autocomplete / debug). */
export function listKnownItemNames() {
  return Object.entries(ITEM_DB)
    .filter(([k]) => !k.includes('|'))
    .map(([, e]) => e.name)
}

