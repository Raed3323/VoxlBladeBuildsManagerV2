import { useEffect, useRef, useState } from 'react'
import { CATEGORIES } from '../data/builds'
import QuantityControl from './QuantityControl'
import { findWikiItem, WIKI_BASE } from '../services/wiki'

export default function ItemModal({ requirement, qty, isComplete, onSetQty, onClose }) {
  const closeBtnRef = useRef(null)
  const [wiki, setWiki] = useState(null)
  const [wikiLoading, setWikiLoading] = useState(false)
  const [wikiError, setWikiError] = useState(false)

  useEffect(() => {
    closeBtnRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (!requirement?.name) return undefined

    const controller = new AbortController()
    setWiki(null)
    setWikiLoading(true)
    setWikiError(false)

    findWikiItem(requirement.name, controller.signal, { category: requirement.category })
      .then((result) => {
        if (!controller.signal.aborted) setWiki(result)
      })
      .catch((error) => {
        if (!controller.signal.aborted && error?.name !== 'AbortError') setWikiError(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setWikiLoading(false)
      })

    return () => controller.abort()
  }, [requirement?.id, requirement?.name, requirement?.category])

  if (!requirement) return null
  const cat = CATEGORIES[requirement.category]
  const wikiTargetUrl = wiki?.url || `${WIKI_BASE}/w/index.php?search=${encodeURIComponent(requirement.name)}`
  const specialLabel = wiki?.specialType === 'enchantment'
    ? 'ENCHANTMENTS'
    : wiki?.specialType === 'infuse'
      ? 'INFUSIONS'
      : 'WIKI PAGE'

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="presentation"
    >
      <div
        className="modal-panel modal-panel-lg item-info-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-modal-title"
      >
        <div className="modal-header">
          <div>
            <h2 id="item-modal-title">{requirement.name}</h2>
            <div className="wiki-item-subtitle">
              {cat.icon} {cat.label}{requirement.optional ? ' · Optional' : ''}
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
            ref={closeBtnRef}
          >
            ✕
          </button>
        </div>

        <div className="modal-body modal-body-scroll">
          <div className="modal-row">
            <span>Category</span>
            <strong>
              {cat.icon} {cat.label}
              {requirement.optional ? ' (Optional)' : ''}
            </strong>
          </div>

          {requirement.note && (
            <div className="modal-row">
              <span>Note</span>
              <strong>{requirement.note}</strong>
            </div>
          )}

          <div className="modal-row">
            <span>Status</span>
            <strong>{isComplete ? '✓ Obtained' : 'Not Obtained'}</strong>
          </div>

          <div className="modal-qty-row">
            <QuantityControl
              value={qty}
              max={requirement.qty}
              onChange={onSetQty}
              label={requirement.name}
            />
          </div>

          <section className="wiki-info-panel" aria-live="polite">
            <div className="wiki-info-title">
              <span>◈ WIKI INTEL</span>
              <span className="wiki-info-source">VOXLBLADE WIKI</span>
            </div>

            {wikiLoading && (
              <div className="wiki-loading">
                <span className="wiki-loading-glyph">◆</span>
                Searching VoxlBlade Wiki for <strong>{requirement.name}</strong>...
              </div>
            )}

            {!wikiLoading && wikiError && (
              <div className="wiki-state wiki-state-warning">
                <strong>WIKI CONNECTION FAILED</strong>
                <span>Use the button below to search the VoxlBlade Wiki directly.</span>
                <div className="wiki-actions-stack">
                  <a
                    className="pixel-btn pixel-btn-small"
                    href={`${WIKI_BASE}/w/index.php?search=${encodeURIComponent(requirement.name)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Search Wiki ↗
                  </a>
                </div>
              </div>
            )}

            {!wikiLoading && !wikiError && wiki?.matched && (
              <>
                <div className="wiki-match-row">
                  <div>
                    <span className="wiki-label">MATCHED WIKI PAGE</span>
                    <strong>{wiki.title}</strong>
                  </div>
                  {!wiki.specialType && (
                    <span className="wiki-match-badge">
                      {Math.round(wiki.score * 100)}% MATCH
                    </span>
                  )}
                </div>

                <div className="wiki-actions-stack">
                  <a
                    className="pixel-btn pixel-btn-gold"
                    href={wikiTargetUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {specialLabel === 'WIKI PAGE' ? 'Open Wiki Page ↗' : `Open ${specialLabel} Wiki ↗`}
                  </a>
                </div>
              </>
            )}

            {!wikiLoading && !wikiError && wiki && !wiki.matched && (
              <div className="wiki-state wiki-state-warning">
                <strong>NO CONFIDENT WIKI MATCH</strong>
                <span>The item could not be matched safely to a specific wiki page.</span>
                {wiki.suggestions?.length > 0 && (
                  <div className="wiki-suggestions">
                    <span className="wiki-label">POSSIBLE MATCHES</span>
                    <div>
                      {wiki.suggestions.map((suggestion) => (
                        <a key={suggestion.title} href={suggestion.url} target="_blank" rel="noreferrer">
                          {suggestion.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div className="wiki-actions-stack">
                  <a
                    className="pixel-btn pixel-btn-small"
                    href={wiki.directSearchUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Search Wiki ↗
                  </a>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="modal-footer">
          <button type="button" className="pixel-btn pixel-btn-block" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
