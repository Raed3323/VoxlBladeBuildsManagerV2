import { useEffect, useState, useRef } from 'react'
import { resolveWikiItemStats, resolveWikiEnchantments } from '../services/wiki'
import { buildEffectiveLoadout } from '../calculations/statsCalculator'

/**
 * Live Wiki enrichment for the current build.
 *
 * The local item/enchantment databases remain the offline fallback, but this
 * hook resolves the current loadout against Voxlblade Wiki so newly added or
 * previously unknown game objects are not silently treated as zero stats.
 *
 * Enchantments are resolved independently from equipment because the Wiki
 * stores many enchantments in aggregate pages. A compound input such as
 * "Restored Sacrificial" is returned as [Restored, Sacrificial].
 */
export function useWikiStats(build) {
  const [resolved, setResolved] = useState({})
  const [resolvedEnchantments, setResolvedEnchantments] = useState({})
  const [loading, setLoading] = useState(false)
  const [errorCount, setErrorCount] = useState(0)
  const [pendingNames, setPendingNames] = useState([])
  const [retryToken, setRetryToken] = useState(0)
  const runIdRef = useRef(0)

  const effective = buildEffectiveLoadout(build)
  const depKey = JSON.stringify(
    effective.map((slot) => ({
      id: slot.id,
      item: slot.item,
      label: slot.label,
      enchantments: Array.isArray(slot.enchantments) ? slot.enchantments : [],
    })),
  )

  useEffect(() => {
    const runId = ++runIdRef.current
    const controller = new AbortController()

    async function run() {
      const itemPending = effective.filter((slot) => String(slot?.item ?? '').trim())
      const enchantStrings = [...new Set(
        effective
          .flatMap((slot) => Array.isArray(slot?.enchantments) ? slot.enchantments : [])
          .map((value) => String(value ?? '').trim())
          .filter(Boolean),
      )]

      setPendingNames(itemPending.map((s) => s.item))
      setLoading(true)
      setErrorCount(0)

      const next = {}
      const nextEnchantments = {}
      let errors = 0

      // Resolve each item by its exact Wiki name first, then the resolver's
      // category-aware fallbacks. A small concurrency pool is intentional:
      // the old one-request-at-a-time loop was extremely slow on 8-10-slot
      // builds and made transient Wiki failures much more likely.
      const itemCache = new Map()
      let itemCursor = 0
      const worker = async () => {
        while (itemCursor < itemPending.length) {
          const index = itemCursor++
          const slot = itemPending[index]
          if (controller.signal.aborted || runId !== runIdRef.current) return

          const name = String(slot.item).trim()
          const label = String(slot.label || '')
          const lookupKey = `${name.toLowerCase()}::${label.toLowerCase()}`

          try {
            let result = itemCache.get(lookupKey)
            if (result === undefined) {
              const resolveLabel = /infus/i.test(label)
                ? 'Infusion'
                : /helmet|chest|legging|armor|hood|cloak|pants|head|leg/i.test(label)
                  ? 'Armor'
                  : label

              result = await resolveWikiItemStats(name, resolveLabel, controller.signal)
              itemCache.set(lookupKey, result || null)
            }
            if (result?.verified) next[slot.id] = result
          } catch {
            errors += 1
          }
        }
      }
      await Promise.all(Array.from({ length: Math.min(3, Math.max(1, itemPending.length)) }, () => worker()))

      // Resolve compound enchantment strings separately. This is what makes
      // Restored + Sacrificial (and other multi-enchant strings) work without
      // forcing the local database to know every enchantment in the game.
      const enchantResults = await Promise.all(enchantStrings.map(async (raw) => {
        try {
          return [raw, await resolveWikiEnchantments(raw, controller.signal)]
        } catch {
          errors += 1
          return [raw, []]
        }
      }))
      for (const [raw, results] of enchantResults) {
        if (results.length) nextEnchantments[raw] = results
      }

      if (runId !== runIdRef.current) return
      setResolved(next)
      setResolvedEnchantments(nextEnchantments)
      setErrorCount(errors)
      setLoading(false)
    }

    run()
    return () => controller.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build?.id, depKey, retryToken])

  return {
    resolved,
    resolvedEnchantments,
    loading,
    errorCount,
    pendingNames,
    refresh: () => setRetryToken((value) => value + 1),
  }
}
