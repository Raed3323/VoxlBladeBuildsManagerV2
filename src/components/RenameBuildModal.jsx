import { useEffect, useRef, useState } from 'react'

export default function RenameBuildModal({ build, onRename, onClose }) {
  const [name, setName] = useState(build.name)
  const nameRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
    nameRef.current?.select()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const canSave = name.trim().length > 0

  const submit = () => {
    if (!canSave) return
    onRename(name.trim())
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="presentation"
    >
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="rename-build-title">
        <div className="modal-header">
          <h2 id="rename-build-title">Rename Build</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          <div className="edit-field">
            <label htmlFor="rename-build-name">Build Name</label>
            <input
              id="rename-build-name"
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="pixel-btn pixel-btn-block" onClick={onClose}>Cancel</button>
            <button
              type="button"
              className="pixel-btn pixel-btn-gold pixel-btn-block"
              onClick={submit}
              disabled={!canSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
