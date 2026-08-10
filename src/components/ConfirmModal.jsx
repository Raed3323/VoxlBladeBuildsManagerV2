import { useEffect, useRef } from 'react'

export default function ConfirmModal({ title, message, confirmLabel = 'Confirm', danger = true, onConfirm, onClose }) {
  const confirmRef = useRef(null)

  useEffect(() => {
    confirmRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="presentation"
    >
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className="modal-header">
          <h2 id="confirm-title">{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: 18, color: 'var(--text-mid)', margin: 0 }}>{message}</p>

          <div className="modal-actions">
            <button type="button" className="pixel-btn pixel-btn-block" onClick={onClose}>Cancel</button>
            <button
              type="button"
              ref={confirmRef}
              className={`pixel-btn pixel-btn-block ${danger ? 'pixel-btn-danger' : 'pixel-btn-gold'}`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
