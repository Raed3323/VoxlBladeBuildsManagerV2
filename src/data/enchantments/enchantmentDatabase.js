// ============================================================
// VOXLBLADE ENCHANTMENT DATABASE
// ------------------------------------------------------------
// Enchantments are DATA, never UI logic.
// Compound strings such as "Restored Sacrificial" are parsed into
// two independent enchantments.
//
// Wiki references:
//   https://voxlpedia.miraheze.org/wiki/Enchantments
//   https://voxlpedia.miraheze.org/wiki/Template:EnchantTable
//   https://voxlblade-rpg.fandom.com/wiki/Enchanted_Items
//
// The calculator treats ordinary stat bonuses as contributions and
// special enchantments (Corrupt, Restored, Refined, Worthless,
// Berserking, etc.) as transformation rules.
// ============================================================

export const ENCHANT_TIER_MULTIPLIERS = {
  default: { positive: 1, negative: 1, perks: 1, verified: true },
  legendary: { positive: 1.5, negative: 1, perks: 1, verified: true },
  mythical: { positive: 2, negative: 1.2, perks: 0, verified: true },
  refined: { positive: 1.35, negative: 0.5, perks: 1, verified: true },
  flawless: { positive: 1, negative: 0, perks: 1, verified: true, grantsPerk: 'Perfection' },
}

const WIKI_ENCHANTS = 'https://voxlpedia.miraheze.org/wiki/Enchantments'
const FANDOM_ENCHANTS = 'https://voxlblade-rpg.fandom.com/wiki/Enchanted_Items'

function enchant({ name, effects = [], specialRuleId = null, perks = [], verified = true, description = '' }) {
  return { name, wikiUrl: WIKI_ENCHANTS, effects, specialRuleId, perks, verified, description, source: FANDOM_ENCHANTS }
}

export const ENCHANT_DB = {
  restored: enchant({
    name: 'Restored',
    specialRuleId: 'restored',
    description: 'Reverses negative stats on the enchanted item (negative stats are multiplied by -1).',
  }),
  sacrificial: enchant({
    name: 'Sacrificial',
    effects: [
      { stat: 'summonBoost', type: 'percentage', value: 5 },
    ],
    specialRuleId: 'sacrificial',
    perks: [{ name: 'Minion Absorption', amount: 1, description: 'Sacrificial enchantment grants the documented minion-related effect.' }],
    description: 'Summon Boost +5% and a 1.1x Summon Boost multiplier; also grants the documented Minion Absorption effect.',
  }),
  burning: enchant({
    name: 'Burning',
    effects: [{ stat: 'fireBoost', type: 'percentage', value: 10 }],
    specialRuleId: 'boostMultiplier20',
    description: 'Fire Boost +10%; Fire Boost multiplier +20%.',
  }),
  corrupt: enchant({
    name: 'Corrupt',
    specialRuleId: 'corrupt',
    description: 'Removes positive stats other than perks, then reverses negative stats to positive and doubles them.',
  }),
  cursed: enchant({
    name: 'Cursed',
    effects: [{ stat: 'hexBoost', type: 'percentage', value: 10 }],
    specialRuleId: 'boostMultiplier20',
    description: 'Hex Boost +10%; Hex Boost multiplier +20%.',
  }),
  dexterous: enchant({
    name: 'Dexterous',
    effects: [
      { stat: 'dexterityBoost', type: 'percentage', value: 10 },
      { stat: 'jumpBoost', type: 'flat', value: 2 },
      { stat: 'speedBoost', type: 'percentage', value: 5 },
    ],
    specialRuleId: 'boostMultiplier20',
    description: 'Dexterity Boost +10%, Jump Boost +2, Speed Boost +5%; Dexterity Boost multiplier +20%.',
  }),
  earthen: enchant({
    name: 'Earthen',
    effects: [{ stat: 'earthBoost', type: 'percentage', value: 10 }],
    specialRuleId: 'boostMultiplier20',
    description: 'Earth Boost +10%; Earth Boost multiplier +20%.',
  }),
  enlightened: enchant({
    name: 'Enlightened',
    effects: [{ stat: 'holyBoost', type: 'percentage', value: 10 }],
    specialRuleId: 'boostMultiplier20',
    description: 'Holy Boost +10%; Holy Boost multiplier +20%.',
  }),
  fragile: enchant({
    name: 'Fragile',
    effects: [{ stat: 'physicalDefense', type: 'percentage', value: -20 }],
    description: 'Physical Defense -20%.',
  }),
  hardened: enchant({
    name: 'Hardened',
    effects: [{ stat: 'protection', type: 'flat', value: 7.5 }],
    description: 'Protection +7.5.',
  }),
  insulated: enchant({
    name: 'Insulated',
    effects: [
      { stat: 'coldResistance', type: 'percentage', value: 100 },
      { stat: 'heatResistance', type: 'percentage', value: 100 },
    ],
    description: 'Cold Resistance +100%; Heat Resistance +100%.',
  }),
  legendary: enchant({
    name: 'Legendary',
    specialRuleId: 'overallPositiveMultiplier',
    description: 'Overall Stat Increase +50%.',
  }),
  magical: enchant({
    name: 'Magical',
    effects: [{ stat: 'magicBoost', type: 'percentage', value: 10 }],
    specialRuleId: 'boostMultiplier20',
    description: 'Magic Boost +10%; Magic Boost multiplier +20%.',
  }),
  refined: enchant({
    name: 'Refined',
    specialRuleId: 'refined',
    description: 'Halves negative stats and applies the documented Overall Stat Increase +20%.',
  }),
  strengthened: enchant({
    name: 'Strengthened',
    effects: [{ stat: 'physicalBoost', type: 'percentage', value: 10 }],
    specialRuleId: 'boostMultiplier20',
    description: 'Physical Boost +10%; Physical Boost multiplier +20%.',
  }),
  "summoner's": enchant({
    name: "Summoner's",
    effects: [{ stat: 'summonBoost', type: 'percentage', value: 10 }],
    specialRuleId: 'boostMultiplier20',
    description: "Summon Boost +10%; Summon Boost multiplier +20%.",
  }),
  tanky: enchant({
    name: 'Tanky',
    effects: [
      { stat: 'speedBoost', type: 'percentage', value: -5 },
      { stat: 'physicalDefense', type: 'percentage', value: 10 },
    ],
    specialRuleId: 'defenseMultiplier50',
    description: 'Defense Boosts x1.5; Physical Defense +10%; Speed Boost -5%.',
  }),
  "turtle king's": enchant({
    name: "Turtle King's",
    effects: [
      { stat: 'physicalDefense', type: 'percentage', value: 5 },
      { stat: 'magicDefense', type: 'percentage', value: 5 },
    ],
    specialRuleId: 'defenseMultiplier20',
    perks: [{ name: 'Turtle', amount: 1, description: 'One-fifth chance per perk to automatically Block a non-Guardbreaking Attack.' }],
    description: "Defense Boosts x1.2; Physical Defense +5%; Magic Defense +5%; Turtle +1 (one-fifth chance per perk to automatically Block a non-Guardbreaking Attack).",
  }),
  tenacious: enchant({
    name: 'Tenacious',
    effects: [{ stat: 'tenacity', type: 'flat', value: 0.1 }],
    description: 'Tenacity +0.1.',
  }),
  thirsty: enchant({
    name: 'Thirsty',
    effects: [{ stat: 'physicalDefense', type: 'percentage', value: -5 }],
    description: 'Physical Defense -5%.',
  }),
  vampiric: enchant({
    name: 'Vampiric',
    effects: [
      { stat: 'holyDefense', type: 'percentage', value: -40 },
      { stat: 'lifesteal', type: 'flat', value: 0.1 },
    ],
    description: 'Holy Defense -40%; Lifesteal +0.1.',
  }),
  warded: enchant({
    name: 'Warded',
    effects: [{ stat: 'warding', type: 'percentage', value: 30 }],
    description: 'Warding +30%.',
  }),
  wet: enchant({
    name: 'Wet',
    effects: [{ stat: 'waterBoost', type: 'percentage', value: 10 }],
    specialRuleId: 'boostMultiplier20',
    description: 'Water Boost +10%; Water Boost multiplier +20%.',
  }),
  windy: enchant({
    name: 'Windy',
    effects: [{ stat: 'airBoost', type: 'percentage', value: 10 }],
    specialRuleId: 'boostMultiplier20',
    description: 'Air Boost +10%; Air Boost multiplier +20%.',
  }),
  worthless: enchant({
    name: 'Worthless',
    specialRuleId: 'worthless',
    description: 'Halves all positive stats and doubles all negative stats.',
  }),
  berserking: enchant({
    name: 'Berserking',
    effects: [
      { stat: 'protection', type: 'flat', value: -10 },
      { stat: 'physicalBoost', type: 'percentage', value: 20 },
    ],
    specialRuleId: 'berserking',
    description: 'Physical Boost x1.2; Physical Boost +20%; Protection -10; Positive Defenses x0.5; Negative Defenses x2.',
  }),
  frenzied: enchant({
    name: 'Frenzied',
    effects: [
      { stat: 'protection', type: 'flat', value: -2 },
    ],
    perks: [{ name: 'Frenzy', amount: 1, description: 'Rage grants a Movement Speed and universal Damage Multiplier, but cuts healing received in half and also multiplies Damage taken.' }],
    description: 'Protection -2; Frenzy +1 (Rage grants a Movement Speed and universal Damage Multiplier, but cuts healing received in half and also multiplies Damage taken).',
  }),
  contained: enchant({
    name: 'Contained',
    effects: [
      { stat: 'coldResistance', type: 'percentage', value: 20 },
      { stat: 'heatResistance', type: 'percentage', value: 20 },
    ],
    perks: [{ name: 'Contained', amount: 1, description: 'Both Debuff and Buff durations on self are increased. Does not affect neutral statuses.' }],
    description: 'Cold Resistance +20%; Heat Resistance +20%; Contained +1 (Both Debuff and Buff durations on self are increased. Does not affect neutral statuses).',
  }),
  quick: enchant({
    name: 'Quick',
    effects: [
      { stat: 'attackSpeed', type: 'percentage', value: 10 },
      { stat: 'jumpBoost', type: 'flat', value: 2 },
      { stat: 'speedBoost', type: 'percentage', value: 5 },
    ],
    description: 'Attack Speed +10%; Jump Boost +2; Speed Boost +5%.',
  }),
  piercing: enchant({
    name: 'Piercing',
    effects: [
      { stat: 'armorPenetration', type: 'flat', value: 10 },
    ],
    description: 'Armor Penetration +10.',
  }),
}

const ENCHANT_NAME_LOOKUP = Object.values(ENCHANT_DB).reduce((map, e) => {
  map[e.name.toLowerCase()] = e
  return map
}, {})

const NAME_ALIASES = {
  "summoners": "summoner's",
  "summoner": "summoner's",
  "quick / piercing": "quick piercing",
  "quick/piercing": "quick piercing",
}

export function parseEnchantmentNames(raw) {
  const text = String(raw ?? '').trim()
  if (!text) return { matched: [], unknown: [] }

  // Prefer exact known multi-word names first, then repeatedly consume
  // known names. This prevents "Restored Sacrificial" from becoming
  // one fake enchantment.
  const normalizedText = text.replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim()
  const names = Object.values(ENCHANT_DB)
    .map((e) => e.name)
    .sort((a, b) => b.length - a.length)

  let remaining = normalizedText
  const matched = []

  for (const name of names) {
    const re = new RegExp(`(^|[\\s,\\/+&]+)${name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}(?=$|[\\s,\\/+&]+)`, 'i')
    if (re.test(remaining)) {
      matched.push(ENCHANT_DB[name.toLowerCase()])
      remaining = remaining.replace(re, ' ').replace(/\s+/g, ' ').trim()
    }
  }

  // Handle slash-separated checklist text and common aliases.
  remaining = remaining.replace(/[|,;]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (remaining) {
    const alias = NAME_ALIASES[remaining.toLowerCase()]
    if (alias) {
      for (const token of alias.split(/\s+/)) {
        const e = findEnchantment(token)
        if (e && !matched.some((x) => x.name === e.name)) matched.push(e)
      }
      remaining = ''
    }
  }

  const unknown = remaining ? remaining.split(/\s+/).filter(Boolean) : []
  return { matched, unknown }
}

export function findEnchantment(name) {
  return ENCHANT_NAME_LOOKUP[String(name ?? '').trim().toLowerCase()] ?? null
}
