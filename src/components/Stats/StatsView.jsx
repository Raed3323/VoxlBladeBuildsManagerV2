import { useEffect, useMemo, useState } from 'react'
import { calculateBuildStats } from '../../calculations/statsCalculator'
import { STAT_CATEGORIES, STAT_CATEGORY_ORDER } from '../../data/stats/statDefinitions'
import { useWikiStats } from '../../hooks/useWikiStats'
import StatRow from './StatRow'

function StatSection({ categoryId, stats }) {
  const meta = STAT_CATEGORIES[categoryId]
  const rows = Object.values(stats).sort((a, b) => {
    const av = Math.abs(a.total)
    const bv = Math.abs(b.total)
    return bv - av || a.label.localeCompare(b.label)
  })

  return (
    <section className={`pixel-panel stats-section stats-section-${categoryId}`}>
      <h2 className="pixel-panel-title">
        <span aria-hidden="true">{meta.icon}</span>
        {meta.label}
        <span className="stats-section-count">{rows.length}</span>
      </h2>
      <div className="pixel-panel-body stats-section-body">
        {rows.length === 0 ? (
          <div className="stats-empty-row">No verified contributions yet.</div>
        ) : (
          rows.map((stat) => <StatRow key={stat.id} stat={stat} />)
        )}
      </div>
    </section>
  )
}

function BuildSummary({ build, calc, wikiLoading }) {
  const equipped = calc.equippedSummary
  const enchantments = calc.enchantmentBreakdown

  return (
    <section className="pixel-panel stats-build-summary">
      <h2 className="pixel-panel-title">
        <span aria-hidden="true">⚔</span>
        Current Build
        <span className={`stats-sync-status ${wikiLoading ? 'is-loading' : 'is-ready'}`}>
          {wikiLoading ? 'WIKI SYNC' : 'CALCULATED'}
        </span>
      </h2>

      <div className="pixel-panel-body">
        {equipped.length === 0 ? (
          <p className="build-editor-empty">No loadout configured yet.</p>
        ) : (
          <div className="stats-summary-grid">
            {equipped.map((slot) => (
              <div
                key={slot.slotId}
                className={`stats-summary-chip ${slot.matched ? 'is-matched' : 'is-unmatched'} ${slot.optional ? 'is-optional' : ''}`}
              >
                <span className="stats-summary-slot-label">{slot.slotLabel}</span>
                <span className="stats-summary-item-name">{slot.itemName}</span>
                {slot.isWeaponPart && slot.tier != null && (
                  <span className="stats-summary-tier">TIER {slot.tier}{slot.shrineMultiplier != null && slot.shrineMultiplier !== 1 ? ` · SOB ×${slot.shrineMultiplier}` : ''}</span>
                )}
                <span className="stats-summary-chip-bottom">
                  {slot.matched ? 'Wiki verified' : 'Waiting for Wiki data'}
                  {slot.wikiUrl && (
                    <a href={slot.wikiUrl} target="_blank" rel="noreferrer" className="stats-mini-wiki">
                      WIKI ↗
                    </a>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        {enchantments.length > 0 && (
          <>
            <div className="pixel-divider" />
            <div className="stats-summary-label">Active Enchantments — calculated separately</div>
            <div className="stats-summary-tags">
              {enchantments.map((e, i) => (
                <span className={`build-tag-chip ${e.verified ? '' : 'is-unverified'}`} key={`${e.slotId}-${e.name}-${i}`}>
                  {e.name}
                  <span className="stats-summary-slot-hint">({e.slotLabel})</span>
                </span>
              ))}
            </div>
          </>
        )}

        {build.loadout?.some((s) => (Number(s.forgeLevel) || 0) > 0) && (
          <>
            <div className="pixel-divider" />
            <div className="stats-summary-label">Forge</div>
            <div className="stats-summary-tags">
              {build.loadout
                .filter((s) => (Number(s.forgeLevel) || 0) > 0)
                .map((slot) => (
                  <span className="build-tag-chip" key={slot.id}>
                    {slot.label} +{slot.forgeLevel}
                  </span>
                ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function ShrineBalanceControl({ enabled, onToggle, calc }) {
  const affected = (calc.equippedSummary || []).filter((slot) => slot.isWeaponPart)
  const active = affected.filter((slot) => slot.shrineMultiplier != null && slot.shrineMultiplier !== 1)
  const missingTier = enabled && affected.some((slot) => slot.shrineMultiplier == null)

  return (
    <section className={`pixel-panel shrine-balance-panel ${enabled ? 'is-enabled' : ''}`}>
      <div className="shrine-balance-icon" aria-hidden="true">☯</div>
      <div className="shrine-balance-main">
        <div className="shrine-balance-head">
          <div>
            <div className="shrine-balance-title">Shrine of Balance</div>
            <div className="shrine-balance-subtitle">
              Weapon-part Boosts &amp; Damage Scalings are multiplied by part Tier.
            </div>
          </div>
          <button
            type="button"
            className={`shrine-toggle ${enabled ? 'is-on' : 'is-off'}`}
            onClick={onToggle}
            role="switch"
            aria-checked={enabled}
            aria-label="Toggle Shrine of Balance"
          >
            <span className="shrine-toggle-track">
              <span className="shrine-toggle-thumb" />
            </span>
            <span className="shrine-toggle-label">{enabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <div className="shrine-tier-grid">
          {[1, 2, 3, 4, 5].map((tier) => (
            <span key={tier} className="shrine-tier-chip">
              T{tier} <strong>×{calc.shrineOfBalance?.multipliers?.[tier] ?? 1}</strong>
            </span>
          ))}
        </div>

        <div className="shrine-balance-status">
          {!affected.length && 'No weapon parts detected in this build yet.'}
          {affected.length > 0 && !enabled && 'OFF — normal weapon-part stats are shown.'}
          {enabled && active.length > 0 && `${active.length} weapon part${active.length === 1 ? '' : 's'} boosted.`}
          {enabled && missingTier && ' Some weapon parts are missing verified Wiki Tier data, so no Shrine multiplier was guessed for them.'}
        </div>
      </div>
    </section>
  )
}

function PerksPanel({ perks }) {
  // The calculator already stacks identical perks across the whole loadout.
  // Keep this component presentation-only so it never accidentally hides a
  // stack or creates a second grouping rule.
  const unique = perks || []

  return (
    <section className="pixel-panel stats-section stats-perks-section">
      <h2 className="pixel-panel-title">
        <span aria-hidden="true">✦</span>
        Perks
        <span className="stats-section-count">{unique.length}</span>
      </h2>
      <div className="pixel-panel-body">
        {unique.length === 0 ? (
          <div className="stats-empty-row">No perks found in the current verified loadout.</div>
        ) : (
          <div className="perks-list">
            {unique.map((perk, i) => (
              <div className="perk-card" key={`${perk.name}-${perk.source}-${i}`}>
                <div className="perk-card-top">
                  <span className="perk-name">
                    {perk.name}
                    {perk.amount != null ? ` +${perk.amount}` : ''}
                  </span>
                  {!perk.verified && <span className="stats-summary-flag">UNVERIFIED</span>}
                </div>
                {perk.description && <p className="perk-description">{perk.description}</p>}
                {perk.stackCount > 1 ? (
                  <div className="perk-source">
                    <strong>Stacks ×{perk.stackCount}</strong> · from {perk.sources.map((entry) => entry.source).join(' · ')}
                  </div>
                ) : (
                  <div className="perk-source">from {perk.source}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function EnchantmentBreakdown({ enchantments }) {
  if (!enchantments.length) return null

  return (
    <section className="pixel-panel stats-section enchantment-breakdown-panel">
      <h2 className="pixel-panel-title">
        <span aria-hidden="true">✦</span>
        Enchantment Breakdown
      </h2>
      <div className="pixel-panel-body enchantment-breakdown-grid">
        {enchantments.map((e, i) => (
          <article className="enchantment-breakdown-card" key={`${e.slotId}-${e.name}-${i}`}>
            <div className="enchantment-breakdown-head">
              <div>
                <div className="enchantment-breakdown-name">{e.name}</div>
                <div className="enchantment-breakdown-source">{e.itemName} · {e.slotLabel}</div>
              </div>
              <span className={e.verified ? 'stats-verified-pill' : 'stats-unverified-pill'}>
                {e.verified ? 'VERIFIED' : 'UNVERIFIED'}
              </span>
            </div>
            {e.effects.length > 0 && (
              <div className="enchantment-effect-list">
                {e.effects.map((effect, j) => (
                  <div className="enchantment-effect-row" key={j}>
                    <span>{effect.stat}</span>
                    <strong>{effect.value > 0 ? '+' : ''}{effect.value}{effect.type === 'percentage' ? '%' : ''}</strong>
                  </div>
                ))}
              </div>
            )}
            {e.perks.length > 0 && (
              <div className="enchantment-perk-list">
                {e.perks.map((perk, j) => (
                  <span key={j}>PERK: {perk.name}{perk.amount != null ? ` +${perk.amount}` : ''}</span>
                ))}
              </div>
            )}
            {e.description && <p className="enchantment-breakdown-description">{e.description}</p>}
            <a href={e.wikiUrl} target="_blank" rel="noreferrer" className="stats-wiki-button">
              OPEN WIKI PAGE ↗
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}

function UnverifiedPanel({ unmatchedItems, warnings }) {
  if (unmatchedItems.length === 0 && warnings.length === 0) return null
  return (
    <section className="pixel-panel stats-section stats-warnings-panel">
      <h2 className="pixel-panel-title">
        <span aria-hidden="true">⚠</span>
        Wiki Data Status
      </h2>
      <div className="pixel-panel-body">
        {unmatchedItems.length > 0 && (
          <>
            <div className="stats-summary-label">Items still waiting for verified stat data</div>
            <ul className="stats-warning-list">
              {unmatchedItems.map((item) => (
                <li key={item.slotId}>
                  <strong>{item.itemName}</strong> ({item.slotLabel}) — {item.reason}
                  {item.wikiUrl && (
                    <a href={item.wikiUrl} target="_blank" rel="noreferrer" className="stats-wiki-link"> OPEN WIKI ↗</a>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
        {warnings.length > 0 && (
          <>
            <div className="stats-summary-label" style={{ marginTop: unmatchedItems.length ? 12 : 0 }}>Calculation notes</div>
            <ul className="stats-warning-list">
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}

export default function StatsView({ build }) {
  const { resolved, resolvedEnchantments, loading, refresh } = useWikiStats(build)
  const shrineStorageKey = `voxlblade-shrine-of-balance:${build?.id || 'current'}`
  const [shrineOfBalanceEnabled, setShrineOfBalanceEnabled] = useState(false)

  useEffect(() => {
    try {
      setShrineOfBalanceEnabled(localStorage.getItem(shrineStorageKey) === '1')
    } catch {
      setShrineOfBalanceEnabled(false)
    }
  }, [shrineStorageKey])

  useEffect(() => {
    try {
      localStorage.setItem(shrineStorageKey, shrineOfBalanceEnabled ? '1' : '0')
    } catch {
      // localStorage is optional; the toggle still works for the current session.
    }
  }, [shrineStorageKey, shrineOfBalanceEnabled])

  const calc = useMemo(
    () => calculateBuildStats(build, resolved, resolvedEnchantments, { shrineOfBalanceEnabled }),
    [build, resolved, resolvedEnchantments, shrineOfBalanceEnabled],
  )

  return (
    <div className="stats-view">
      <div className="stats-hero">
        <div>
          <div className="stats-kicker">VOXLBLADE // BUILD ANALYSIS</div>
          <h1 className="stats-hero-title">Character Stats</h1>
          <p className="stats-hero-subtitle">
            Live calculation from the selected loadout. <strong>% = stat</strong> · <strong>flat values = flat stats</strong> · <strong>+1 named effects = perks</strong>.
          </p>
        </div>
        <div className="stats-hero-badges">
          <span>{calc.equippedSummary.length} EQUIPPED</span>
          <span>{calc.enchantmentBreakdown.length} ENCHANTS</span>
          <span>{calc.perks.length} PERKS</span>
          <button type="button" className="pixel-btn pixel-btn-gold stats-refresh-btn" onClick={refresh} disabled={loading}>
            {loading ? 'SYNCING…' : '↻ RESYNC WIKI'}
          </button>
        </div>
      </div>

      <ShrineBalanceControl
        enabled={shrineOfBalanceEnabled}
        onToggle={() => setShrineOfBalanceEnabled((value) => !value)}
        calc={calc}
      />

      <BuildSummary build={build} calc={calc} wikiLoading={loading} />

      <div className="stats-section-grid">
        {STAT_CATEGORY_ORDER.map((categoryId) => (
          <StatSection key={categoryId} categoryId={categoryId} stats={calc[categoryId]} />
        ))}
      </div>

      <EnchantmentBreakdown enchantments={calc.enchantmentBreakdown} />
      <PerksPanel perks={calc.perks} />
      <UnverifiedPanel unmatchedItems={calc.unmatchedItems} warnings={calc.warnings} />
    </div>
  )
}
