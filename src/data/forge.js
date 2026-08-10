// ============================================================
// FORGE
// ------------------------------------------------------------
// Verified via search snippet from the community Wiki mirror
// (voxlblade-rpg.fandom.com/wiki/Forge, content is a mirror of
// the same Forge mechanics documented on voxlpedia):
//
//   "Forges are upgrade stations... used to upgrade your gear up
//   to 5 times. For every upgrade it will increase the gear's
//   stats by 10%, up to a 50% increase. However, be aware that
//   the enchanted stats bonus gained on a gear won't get
//   upgraded."
//
//   "When paired with the corrupt enchantment, reversed negative
//   stats, which are now positive, increase. (Ex. Upgrading a
//   Corrupt Iron Slayer armor piece increases the 40% Speed
//   Boost to 44%)"
//
// This means Forge must be applied ONLY to an item's base stats,
// never to stats granted by an enchantment - see
// calculations/statsCalculator.js.
// ============================================================

// Index = forge level (0-5), value = percent bonus applied to
// the item's own base stats at that level.
export const FORGE_LEVEL_PERCENT = [0, 10, 20, 30, 40, 50]
export const FORGE_MAX_LEVEL = 5

export function forgePercentForLevel(level) {
  const clamped = Math.max(0, Math.min(FORGE_MAX_LEVEL, Number(level) || 0))
  return FORGE_LEVEL_PERCENT[clamped]
}
