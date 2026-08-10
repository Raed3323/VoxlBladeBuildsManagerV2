import { useMemo } from 'react'

/**
 * Pure calculation, no hooks - derives every progress number from
 * a requirements list + a quantities map. Nothing here is
 * hardcoded: add, remove, or re-quantify a requirement and these
 * numbers update themselves. Exported separately (in addition to
 * the memoized hook below) so callers that need progress for many
 * builds at once - e.g. the build switcher cards - can call it
 * directly without breaking the rules of hooks.
 *
 * quantities: { [requirementId]: number }
 */
export function computeProgress(requirements, quantities) {
  const clamp = (id, req) => {
    const raw = quantities[id] ?? 0
    return Math.max(0, Math.min(req.qty, raw))
  }

  const mandatory = requirements.filter((r) => !r.optional)
  const optional = requirements.filter((r) => r.optional)

  const sum = (list, fn) => list.reduce((acc, r) => acc + fn(r), 0)

  const mandatoryHave = sum(mandatory, (r) => clamp(r.id, r))
  const mandatoryNeed = sum(mandatory, (r) => r.qty)

  const mandatoryComplete = mandatory.filter((r) => clamp(r.id, r) >= r.qty).length
  const mandatoryTotal = mandatory.length

  const optionalHave = sum(optional, (r) => clamp(r.id, r))
  const optionalNeed = sum(optional, (r) => r.qty)
  const optionalComplete = optional.filter((r) => clamp(r.id, r) >= r.qty).length
  const optionalTotal = optional.length

  const allHave = mandatoryHave + optionalHave
  const allNeed = mandatoryNeed + optionalNeed

  const percent = mandatoryNeed === 0 ? 100 : Math.round((mandatoryHave / mandatoryNeed) * 100)
  const fullPercent = allNeed === 0 ? 100 : Math.round((allHave / allNeed) * 100)

  const isItemComplete = (req) => clamp(req.id, req) >= req.qty

  return {
    percent,
    fullPercent,
    mandatoryComplete,
    mandatoryTotal,
    mandatoryRemaining: mandatoryTotal - mandatoryComplete,
    mandatoryHave,
    mandatoryNeed,
    optionalComplete,
    optionalTotal,
    optionalHave,
    optionalNeed,
    isItemComplete,
    getQty: (req) => clamp(req.id, req),
    isFullyComplete: mandatoryHave >= mandatoryNeed,
    is100: allHave >= allNeed,
  }
}

/**
 * Memoized wrapper around computeProgress for the currently
 * selected build's requirements + quantities.
 */
export function useBuildProgress(requirements, quantities) {
  return useMemo(() => computeProgress(requirements, quantities), [requirements, quantities])
}
