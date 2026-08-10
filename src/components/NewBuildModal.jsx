import { useEffect, useRef, useState } from 'react'
import { BUILD_TAGS } from '../data/builds'

export default function NewBuildModal({ onCreate, onClose }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState([])
  const nameRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const canCreate = name.trim().length > 0

  const submit = () => {
    if (!canCreate) return
    onCreate(name.trim(), description.trim(), tags)
  }

  const toggleTag = (tag) => {
    setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="presentation"
    >
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="new-build-title">
        <div className="modal-header">
          <h2 id="new-build-title">New Build</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          <div className="edit-field">
            <label htmlFor="new-build-name">Build Name</label>
            <input
              id="new-build-name"
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
              placeholder="e.g. Sporeboss Build"
            />
          </div>

          <div className="edit-field">
            <label htmlFor="new-build-desc">Description</label>
            <textarea
              id="new-build-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes about this build"
              rows={3}
            />
          </div>

          <div className="edit-field">
            <label>Build Tags</label>
            <div className="build-tag-picker" role="group" aria-label="Build tags">
              {BUILD_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`build-tag-option ${tags.includes(tag) ? 'is-active' : ''}`}
                  aria-pressed={tags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="pixel-btn pixel-btn-block" onClick={onClose}>Cancel</button>
            <button
              type="button"
              className="pixel-btn pixel-btn-gold pixel-btn-block"
              onClick={submit}
              disabled={!canCreate}
            >
              Create Build
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
