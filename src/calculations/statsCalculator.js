import { STAT_DEFS, getStatDef } from '../data/stats/statDefinitions'
import { findItem } from '../data/items/itemDatabase'
import { parseEnchantmentNames } from '../data/enchantments/enchantmentDatabase'
import { forgePercentForLevel } from '../data/forge'

// ============================================================
// VOXLBLADE STAT CALCULATOR
// ============================================================
// The build/loadout is the only source of truth.
//
// The important distinction from the old implementation is that a Wiki
// entry is not treated as "just a bag of numbers":
//   - percentage stats stay percentage stats
//   - Protection / Jump Boost / Tenacity / Lifesteal stay flat stats
//   - perks are NEVER converted into stats
//   - Forge scales the item's own stats, not enchantment bonuses
//   - special enchantments transform a slot's stats instead of being
//     incorrectly represented as ordinary additive bonuses
//   - multiple enchantments are independent and all contribute
//
// `wikiOverrides` is populated asynchronously by useWikiStats() for
// loadout items that do not already have a verified local record.
// ============================================================

const DEFENSE_STAT_IDS = [
  'physicalDefense', 'magicDefense', 'holyDefense', 'hexDefense',
  'fireDefense', 'waterDefense', 'earthDefense', 'airDefense',
]

const BOOST_MULTIPLIER_MAP = {
  burning: 'fireBoost',
  cursed: 'hexBoost',
  dexterous: 'dexterityBoost',
  earthen: 'earthBoost',
  enlightened: 'holyBoost',
  magical: 'magicBoost',
  strengthened: 'physicalBoost',
  "summoner's": 'summonBoost',
  wet: 'waterBoost',
  windy: 'airBoost',
}

function emptyAccumulator() {
  const acc = {}
  for (const id of Object.keys(STAT_DEFS)) {
    acc[id] = { total: 0, sources: [] }
  }
  return acc
}

function addSource(acc, statId, source) {
  if (!acc[statId] || !Number.isFinite(source.value)) return
  acc[statId].total += source.value
  acc[statId].sources.push(source)
}

function sourceSum(acc, statId, slotId) {
  return (acc[statId]?.sources || [])
    .filter((s) => s.slotId === slotId)
    .reduce((sum, s) => sum + s.value, 0)
}

function addTransformation(acc, statId, slot, label, value, verified, rule) {
  addSource(acc, statId, {
    label: `${slot.item} (${slot.label}) — ${label}`,
    value,
    kind: 'special',
    verified,
    slotId: slot.id,
    slotLabel: slot.label,
    itemName: slot.item,
    rule,
  })
}

function applySlotTransformation(acc, slot, ruleId, verified = true) {
  if (!ruleId) return

  if (ruleId === 'boostMultiplier20') {
    let statId = BOOST_MULTIPLIER_MAP[slot.__activeEnchantName]
    if (!statId && Array.isArray(slot.__activeEnchant?.multipliers)) {
      const hit = slot.__activeEnchant.multipliers.find((m) =>
        /(?:air|earth|fire|hex|holy|magic|physical|water|dexterity|summon)\s*boost/i.test(String(m.label || '')),
      )
      if (hit) {
        const label = String(hit.label || '').toLowerCase()
        const pair = Object.entries(STAT_DEFS).find(([, def]) =>
          def.label.toLowerCase() === label || def.label.toLowerCase().replace(/\s*boost$/, '') === label.replace(/\s*boost$/, ''),
        )
        if (pair) statId = pair[0]
      }
    }
    if (!statId) return
    const before = sourceSum(acc, statId, slot.id)
    if (before !== 0) {
      addTransformation(acc, statId, slot, `${slot.__activeEnchantName} multiplier +20%`, before * 0.20, verified, ruleId)
    }
    return
  }

  if (ruleId === 'defenseMultiplier50') {
    for (const statId of DEFENSE_STAT_IDS) {
      const before = sourceSum(acc, statId, slot.id)
      if (before !== 0) {
        addTransformation(acc, statId, slot, 'Tanky defense multiplier +50%', before * 0.50, verified, ruleId)
      }
    }
    return
  }

  if (ruleId === 'defenseMultiplier20') {
    for (const statId of DEFENSE_STAT_IDS) {
      const before = sourceSum(acc, statId, slot.id)
      if (before !== 0) {
        addTransformation(acc, statId, slot, "Turtle King's defense multiplier +20%", before * 0.20, verified, ruleId)
      }
    }
    return
  }

  if (ruleId === 'berserking') {
    const physical = sourceSum(acc, 'physicalBoost', slot.id)
    if (physical !== 0) {
      addTransformation(acc, 'physicalBoost', slot, 'Berserking Physical Boost multiplier +20%', physical * 0.20, verified, ruleId)
    }
    for (const statId of DEFENSE_STAT_IDS) {
      const before = sourceSum(acc, statId, slot.id)
      if (before > 0) addTransformation(acc, statId, slot, 'Berserking halves positive defense', -before * 0.50, verified, ruleId)
      if (before < 0) addTransformation(acc, statId, slot, 'Berserking doubles negative defense', before, verified, ruleId)
    }
    return
  }

  if (ruleId === 'sacrificial') {
    const summon = sourceSum(acc, 'summonBoost', slot.id)
    if (summon !== 0) {
      addTransformation(acc, 'summonBoost', slot, 'Sacrificial Summon Boost multiplier +10%', summon * 0.10, verified, ruleId)
    }
    return
  }

  if (ruleId === 'restored') {
    // Restored: negative stats become positive. We keep the transformation
    // explicit in the breakdown instead of silently replacing the source.
    for (const statId of Object.keys(STAT_DEFS)) {
      const before = sourceSum(acc, statId, slot.id)
      if (before < 0) {
        addTransformation(acc, statId, slot, 'Restored reverses negative stat', -before * 2, verified, ruleId)
      }
    }
    return
  }

  if (ruleId === 'corrupt') {
    // Corrupt: remove positives; reverse negatives and double them.
    // Since sources are already present, turn every slot-positive contribution
    // into a negative correction and every slot-negative contribution into a
    // +3x correction (old negative +3x = +2x final).
    for (const statId of Object.keys(STAT_DEFS)) {
      const before = sourceSum(acc, statId, slot.id)
      if (before > 0) addTransformation(acc, statId, slot, 'Corrupt removes positive stat', -before, verified, ruleId)
      if (before < 0) addTransformation(acc, statId, slot, 'Corrupt reverses and doubles negative stat', -before * 3, verified, ruleId)
    }
    return
  }

  if (ruleId === 'worthless') {
    for (const statId of Object.keys(STAT_DEFS)) {
      const before = sourceSum(acc, statId, slot.id)
      if (before > 0) addTransformation(acc, statId, slot, 'Worthless halves positive stat', -before * 0.50, verified, ruleId)
      if (before < 0) addTransformation(acc, statId, slot, 'Worthless doubles negative stat', before, verified, ruleId)
    }
    return
  }

  if (ruleId === 'refined') {
    for (const statId of Object.keys(STAT_DEFS)) {
      const before = sourceSum(acc, statId, slot.id)
      if (before < 0) addTransformation(acc, statId, slot, 'Refined halves negative stat', -before * 0.50, verified, ruleId)
      if (before > 0) addTransformation(acc, statId, slot, 'Refined overall stat increase +20%', before * 0.20, verified, ruleId)
    }
  }

  if (ruleId === 'overallPositiveMultiplier') {
    for (const statId of Object.keys(STAT_DEFS)) {
      const before = sourceSum(acc, statId, slot.id)
      if (before > 0) addTransformation(acc, statId, slot, 'Legendary overall positive stat increase +50%', before * 0.50, verified, ruleId)
    }
  }
}

function normalizeWikiItem(item) {
  if (!item) return null
  return {
    name: item.name,
    stats: item.stats || {},
    perks: item.perks || [],
    multipliers: item.multipliers || [],
    wikiUrl: item.wikiUrl || null,
    verified: item.verified !== false,
    note: item.note || '',
    source: item.source || 'Voxlblade Wiki',
  }
}

/**
 * Infer a human slot label for an infusion requirement from its note/name.
 * Examples: note "Helmet" → "Infuse Helmet"; bare "Boglord Ring" → "Infuse Ring"
 */
function inferInfusionSlotLabel(req) {
  // One label for all infusions — piece type is only a display hint, not a second source.
  // Armor set stats are identical across helmet/chest/legs on the wiki.
  return 'Infusion'
}

/**
 * Build the effective equipment list used for stats:
 *  - normal loadout slots
 *  - PLUS every requirement with category "infuse" (the Infuse tab),
 *    treated as synthetic infusion slots (½ stats + full perk)
 */
export function buildEffectiveLoadout(build) {
  const loadout = Array.isArray(build?.loadout) ? [...build.loadout] : []
  const reqs = Array.isArray(build?.requirements) ? build.requirements : []
  const seen = new Set(
    loadout
      .filter((s) => /infus/i.test(String(s.label ?? '')))
      .map((s) => String(s.item ?? '').trim().toLowerCase())
      .filter(Boolean),
  )

  for (const req of reqs) {
    if (String(req?.category ?? '').toLowerCase() !== 'infuse') continue
    const name = String(req?.name ?? '').trim()
    if (!name) continue
    const key = name.toLowerCase()
    // Avoid double-counting if the same item is already an Infuse loadout slot
    if (seen.has(key)) continue
    seen.add(key)
    const qty = Math.max(1, Number(req.qty) || 1)
    for (let i = 0; i < qty; i += 1) {
      loadout.push({
        id: `${req.id || key}-infuse-${i}`,
        label: inferInfusionSlotLabel(req),
        item: name,
        optional: !!req.optional,
        // synthetic – no forge/enchants on infusions
        forgeLevel: 0,
        enchantments: [],
        __fromRequirement: true,
        __requirementNote: req.note || '',
      })
    }
  }
  return loadout
}


function inferSpecialRuleId(enchantment) {
  if (!enchantment) return null
  if (enchantment.specialRuleId) return enchantment.specialRuleId

  const name = String(enchantment.name || '').toLowerCase()
  if (name === 'berserking') return 'berserking'
  if (name === 'tanky') return 'defenseMultiplier50'
  if (name === "turtle king's" || name === 'turtle kings') return 'defenseMultiplier20'
  if (name === 'sacrificial') return 'sacrificial'
  if (name === 'restored') return 'restored'
  if (name === 'corrupt') return 'corrupt'
  if (name === 'worthless') return 'worthless'
  if (name === 'refined') return 'refined'
  if (name === 'legendary') return 'overallPositiveMultiplier'

  const multipliers = Array.isArray(enchantment.multipliers) ? enchantment.multipliers : []
  const joined = multipliers.map((m) => `${String(m.label || '').toLowerCase()} x${m.value}`).join(' | ')

  if (/\bdefense boosts?\b.*x1\.5/.test(joined)) return 'defenseMultiplier50'
  if (/\bdefense boosts?\b.*x1\.2/.test(joined)) return 'defenseMultiplier20'
  if (/\bpositive defenses?\b.*x0\.5/.test(joined) && /\bnegative defenses?\b.*x2/.test(joined)) return 'berserking'
  if (/\boverall stat increase\b.*x1\.5/.test(joined)) return 'overallPositiveMultiplier'
  if (/\bsummon boost\b.*x1\.1/.test(joined)) return 'sacrificial'
  if (/\b(?:air|earth|fire|hex|holy|magic|physical|water|dexterity|summon) boost\b.*x1\.2/.test(joined)) {
    return 'boostMultiplier20'
  }

  return null
}

function mergeEnchantmentData(localEnchantment, dynamicEnchantment) {
  if (!localEnchantment && !dynamicEnchantment) return null
  if (!dynamicEnchantment) return localEnchantment
  if (!localEnchantment) {
    return { ...dynamicEnchantment, specialRuleId: inferSpecialRuleId(dynamicEnchantment) }
  }

  const merged = {
    ...localEnchantment,
    ...dynamicEnchantment,
    effects: dynamicEnchantment.effects?.length ? dynamicEnchantment.effects : localEnchantment.effects,
    perks: dynamicEnchantment.perks?.length ? dynamicEnchantment.perks : localEnchantment.perks,
    description: dynamicEnchantment.description || localEnchantment.description,
    multipliers: dynamicEnchantment.multipliers?.length
      ? dynamicEnchantment.multipliers
      : (localEnchantment.multipliers || []),
    wikiUrl: dynamicEnchantment.wikiUrl || localEnchantment.wikiUrl,
    verified: dynamicEnchantment.verified !== false,
  }
  merged.specialRuleId = inferSpecialRuleId(merged)
  return merged
}

export function calculateBuildStats(build, wikiOverrides = {}, wikiEnchantmentOverrides = {}) {
  const acc = emptyAccumulator()
  const perks = []
  const warnings = []
  const unmatchedItems = []
  const equippedSummary = []
  const enchantmentBreakdown = []

  const loadout = buildEffectiveLoadout(build)

  for (const originalSlot of loadout) {
    const itemName = String(originalSlot?.item ?? '').trim()
    if (!itemName) continue

    const localItem = findItem(itemName, originalSlot.label)
    const dynamicItem = wikiOverrides[originalSlot.id]
    // Live Wiki data wins whenever it was successfully verified. Local data
    // is an offline fallback, never the authority when the Wiki resolver has
    // a confirmed page for this exact loadout entry.
    // Never throw away verified local data just because the live Wiki parser
    // only recovered part of a page. Merge the two sources field-by-field,
    // with live Wiki values taking precedence. This is especially important
    // for newly added/changed pages where one stat block may be rendered in a
    // template that the browser parser cannot see while another block is
    // already present in the local database.
    const mergedItem = dynamicItem?.verified
      ? {
          ...(localItem || {}),
          ...dynamicItem,
          stats: { ...(localItem?.stats || {}), ...(dynamicItem.stats || {}) },
          perks: dynamicItem.perks?.length ? dynamicItem.perks : (localItem?.perks || []),
          multipliers: dynamicItem.multipliers?.length ? dynamicItem.multipliers : (localItem?.multipliers || []),
          wikiUrl: dynamicItem.wikiUrl || localItem?.wikiUrl,
        }
      : localItem
    const dbItem = normalizeWikiItem(mergedItem)

    const slot = { ...originalSlot, item: itemName }
    // Infusion slots: wiki rule — half of base stats + full perk; no forge/enchants.
    // Detected by label ("Infuse …") OR synthetic slots from the Infuse requirements tab.
    const isInfusion = /infus/i.test(String(slot.label ?? '')) || !!slot.__fromRequirement

    equippedSummary.push({
      slotId: slot.id,
      slotLabel: slot.label,
      itemName,
      optional: !!slot.optional,
      matched: !!(dbItem?.verified),
      wikiUrl: dbItem?.wikiUrl || null,
      wikiMatchScore: dynamicItem?.matchScore ?? null,
      isInfusion,
    })

    if (!dbItem || !dbItem.verified) {
      unmatchedItems.push({
        slotId: slot.id,
        slotLabel: slot.label,
        itemName,
        reason: dbItem?.note || 'No verified Wiki stat/perk data was found yet.',
        wikiUrl: dbItem?.wikiUrl || null,
      })
      warnings.push(`${slot.label}: "${itemName}" is not in the verified local database and no verified Wiki extraction is available yet.`)
      continue
    }

    const slotStatIds = new Set()
    const forgeLevel = isInfusion ? 0 : Math.max(0, Math.min(5, Number(slot.forgeLevel) || 0))
    const forgePct = forgePercentForLevel(forgeLevel)
    const statScale = isInfusion ? 0.5 : 1

    // ----------------------------------------------------------
    // 1. ITEM BASE STATS
    //    Infusions contribute half of the equipment's base stats
    //    (wiki: "half of its base stats" + full perk; no upgrades/enchants).
    // ----------------------------------------------------------
    for (const [statId, rawValue] of Object.entries(dbItem.stats || {})) {
      if (!getStatDef(statId) || !Number.isFinite(Number(rawValue))) continue
      const base = Number(rawValue)
      const value = base * statScale
      slotStatIds.add(statId)

      addSource(acc, statId, {
        label: isInfusion
          ? `${dbItem.name} Infusion (½ of base ${base})`
          : `${dbItem.name} (${slot.label})`,
        value,
        kind: isInfusion ? 'infusion' : 'item',
        verified: dbItem.verified,
        slotId: slot.id,
        slotLabel: slot.label,
        itemName: dbItem.name,
      })

      // Forge applies to the item's own stat, NOT the enchantment bonus.
      // Infusions never keep forge upgrades.
      if (!isInfusion && forgePct > 0 && getStatDef(statId).id !== 'attackSpeed') {
        addSource(acc, statId, {
          label: `${dbItem.name} Forge +${forgeLevel} (+${forgePct}% of base)`,
          value: base * forgePct / 100,
          kind: 'forge',
          verified: dbItem.verified,
          slotId: slot.id,
          slotLabel: slot.label,
          itemName: dbItem.name,
        })
      }
    }

    // ----------------------------------------------------------
    // 2. PERKS FROM ITEM (full potency even on infusions)
    // ----------------------------------------------------------
    for (const perk of dbItem.perks || []) {
      perks.push({
        ...perk,
        source: isInfusion
          ? `${dbItem.name} (Infusion)`
          : `${dbItem.name} (${slot.label})`,
        verified: perk.verified !== false && dbItem.verified,
        slotId: slot.id,
        fromInfusion: isInfusion,
      })
    }

    // ----------------------------------------------------------
    // 3. EVERY ENCHANTMENT ON THE SLOT
    //    Infusions never retain enchantments (wiki rule).
    // ----------------------------------------------------------
    const rawEnchantStrings = isInfusion
      ? []
      : (Array.isArray(slot.enchantments) ? slot.enchantments.filter(Boolean) : [])

    if (isInfusion && Array.isArray(slot.enchantments) && slot.enchantments.filter(Boolean).length) {
      warnings.push(`${slot.label}: enchantments are ignored on infusions (wiki: infused pieces do not retain enchantments).`)
    }

    const activeEnchants = []
    for (const raw of rawEnchantStrings) {
      const parsed = parseEnchantmentNames(raw)
      const dynamic = Array.isArray(wikiEnchantmentOverrides[raw])
        ? wikiEnchantmentOverrides[raw]
        : []

      const dynamicByName = new Map(dynamic.map((e) => [String(e.name || '').toLowerCase(), e]))
      const merged = []
      const seen = new Set()

      for (const local of parsed.matched) {
        const key = String(local.name || '').toLowerCase()
        const enchantment = mergeEnchantmentData(local, dynamicByName.get(key))
        if (!enchantment || seen.has(key)) continue
        seen.add(key)
        merged.push(enchantment)
      }

      for (const enchantment of dynamic) {
        const key = String(enchantment.name || '').toLowerCase()
        if (!key || seen.has(key)) continue
        seen.add(key)
        merged.push(mergeEnchantmentData(null, enchantment))
      }

      for (const token of parsed.unknown) {
        if (!dynamic.some((e) => String(e.name || '').toLowerCase() === token.toLowerCase())) {
          warnings.push(`${slot.label}: enchantment token "${token}" from "${raw}" was not verified by the Wiki.`)
        }
      }

      for (const ench of merged) {
        activeEnchants.push(ench)
        const verified = ench.verified !== false
        const effects = []

        for (const effect of ench.effects || []) {
          if (!getStatDef(effect.stat) || !Number.isFinite(effect.value)) continue
          slotStatIds.add(effect.stat)
          addSource(acc, effect.stat, {
            label: `${ench.name} (enchant)`,
            value: effect.value,
            kind: 'enchantment',
            verified,
            slotId: slot.id,
            slotLabel: slot.label,
            itemName: dbItem.name,
            enchantment: ench.name,
          })
          effects.push(effect)
        }

        for (const perk of ench.perks || []) {
          perks.push({
            ...perk,
            source: `${ench.name} enchant (${slot.label})`,
            verified,
            slotId: slot.id,
          })
        }

        enchantmentBreakdown.push({
          slotId: slot.id,
          slotLabel: slot.label,
          itemName: dbItem.name,
          name: ench.name,
          verified,
          effects,
          perks: ench.perks || [],
          multipliers: ench.multipliers || [],
          description: ench.description || '',
          wikiUrl: ench.wikiUrl,
        })

        if ((ench.effects?.length || 0) === 0 && (ench.perks?.length || 0) === 0 && !inferSpecialRuleId(ench)) {
          warnings.push(`${slot.label}: "${ench.name}" has no verified numeric effect or special rule; no value was invented.`)
        }
      }
    }

    // ----------------------------------------------------------
    // 4. SPECIAL ENCHANTMENT TRANSFORMS
    // ----------------------------------------------------------
    // Multipliers are applied in the same order the enchantments are listed.
    // Each enchantment is independent; "Restored Sacrificial" therefore
    // becomes Restored + Sacrificial, not one fake enchantment.
    for (const ench of activeEnchants) {
      const ruleId = inferSpecialRuleId(ench)
      if (!ruleId) continue
      const specialSlot = {
        ...slot,
        __activeEnchantName: ench.name.toLowerCase(),
        __activeEnchant: ench,
      }
      applySlotTransformation(acc, specialSlot, ruleId, ench.verified !== false)
    }
  }

  // ------------------------------------------------------------
  // 5. CATEGORIZE / FINALIZE
  // ------------------------------------------------------------
  const result = {
    boosts: {},
    defenses: {},
    resistances: {},
    utility: {},
  }

  for (const def of Object.values(STAT_DEFS)) {
    const data = acc[def.id]
    if (!data || (data.sources.length === 0 && data.total === 0)) continue

    const total = Math.round(data.total * 10) / 10
    result[def.category][def.id] = {
      ...def,
      total,
      sources: data.sources,
      verified: data.sources.every((s) => s.verified),
    }
  }

  // ------------------------------------------------------------
  // 6. STACK DUPLICATE PERKS
  // ------------------------------------------------------------
  // VoxlBlade perks are additive when the same perk is granted multiple
  // times by the current loadout. Keep one player-facing entry per perk
  // and sum its amounts instead of rendering three separate "+1" cards.
  // Example: Heavy Gravitate +1 from three sources => Heavy Gravitate +3.
  const stackedPerkMap = new Map()
  for (const perk of perks) {
    const rawName = String(perk.name || '').trim()
    if (!rawName) continue
    const key = rawName.toLowerCase().replace(/\s+/g, ' ')
    const amount = Number(perk.amount)
    const hasNumericAmount = Number.isFinite(amount)

    if (!stackedPerkMap.has(key)) {
      stackedPerkMap.set(key, {
        ...perk,
        amount: hasNumericAmount ? amount : perk.amount,
        stackCount: 1,
        sources: [{
          source: perk.source,
          amount: hasNumericAmount ? amount : perk.amount,
          verified: perk.verified,
        }],
      })
      continue
    }

    const existing = stackedPerkMap.get(key)
    if (hasNumericAmount && Number.isFinite(Number(existing.amount))) {
      existing.amount = Number(existing.amount) + amount
    }
    existing.stackCount += 1
    existing.verified = existing.verified !== false && perk.verified !== false
    if (!existing.description && perk.description) existing.description = perk.description
    existing.sources.push({
      source: perk.source,
      amount: hasNumericAmount ? amount : perk.amount,
      verified: perk.verified,
    })
  }

  const stackedPerks = [...stackedPerkMap.values()].map((perk) => ({
    ...perk,
    amount: Number.isFinite(Number(perk.amount))
      ? Math.round(Number(perk.amount) * 100) / 100
      : perk.amount,
  }))

  return {
    ...result,
    perks: stackedPerks,
    enchantmentBreakdown,
    warnings,
    unmatchedItems,
    equippedSummary,
    isEmpty: equippedSummary.length === 0,
    wikiLoading: false,
  }
}
