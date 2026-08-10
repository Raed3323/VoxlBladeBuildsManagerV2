import { useState } from 'react'

function formatValue(total, type) {
  const sign = total > 0 ? '+' : ''
  if (type === 'percentage') return `${sign}${total.toFixed(1)}%`
  if (type === 'multiplier') return `${sign}${total.toFixed(2)}x`
  return `${sign}${total.toFixed(total % 1 === 0 ? 0 : 1)}`
}

function formatSourceValue(value, type) {
  const sign = value > 0 ? '+' : ''
  if (type === 'percentage') return `${sign}${value.toFixed(1)}%`
  if (type === 'multiplier') return `${sign}${value.toFixed(2)}x`
  return `${sign}${value.toFixed(value % 1 === 0 ? 0 : 1)}`
}

function sourceKindLabel(kind) {
  switch (kind) {
    case 'item': return 'Item'
    case 'forge': return 'Forge'
    case 'enchantment': return 'Enchant'
    case 'special': return 'Special'
    default: return kind
  }
}

export default function StatRow({ stat }) {
  const [open, setOpen] = useState(false)
  const isNegative = stat.total < 0
  const hasUnverifiedSource = stat.sources.some((s) => !s.verified) || !stat.verified

  return (
    <div className={`stat-row-item ${isNegative ? 'is-negative' : ''}`} style={{ '--stat-color': stat.color }}>
      <button
        type="button"
        className="stat-row-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="stat-row-name">
          {stat.label}
          {!stat.verified && <span className="stat-unverified-flag" title="Wiki representation of this stat is unverified">?</span>}
        </span>
        <span className="stat-row-value-group">
          <span className={`stat-row-value ${isNegative ? 'is-negative' : ''}`}>{formatValue(stat.total, stat.type)}</span>
          <span className={`stat-row-caret ${open ? 'is-open' : ''}`} aria-hidden="true">▸</span>
        </span>
      </button>

      {open && (
        <div className="stat-row-breakdown">
          <div className="stat-breakdown-title">{stat.label.toUpperCase()}</div>
          {stat.sources.length === 0 && <div className="stat-breakdown-empty">No contributions.</div>}
          {stat.sources.map((source, i) => (
            <div className="stat-breakdown-row" key={i}>
              <span className="stat-breakdown-source">
                <span className="stat-breakdown-kind">{sourceKindLabel(source.kind)}</span>
                {source.label}
                {!source.verified && <span className="stat-unverified-flag" title="Unverified value">?</span>}
              </span>
              <span className={`stat-breakdown-amount ${source.value < 0 ? 'is-negative' : ''}`}>
                {formatSourceValue(source.value, stat.type)}
              </span>
            </div>
          ))}
          <div className="stat-breakdown-divider" />
          <div className="stat-breakdown-row stat-breakdown-final">
            <span>FINAL</span>
            <span className={isNegative ? 'is-negative' : ''}>{formatValue(stat.total, stat.type)}</span>
          </div>
          {hasUnverifiedSource && (
            <div className="stat-breakdown-note">
              Contains at least one UNVERIFIED value - not confirmed against a live Wiki fetch this session. Treat as an estimate.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
