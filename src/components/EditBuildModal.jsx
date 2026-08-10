import { useEffect, useState } from 'react'
import LoadoutEditor from './LoadoutEditor'
import RequirementsEditor from './RequirementsEditor'
import { BUILD_TAGS } from '../data/builds'

export default function EditBuildModal({ build, categories, categoryOrder, onSave, onClose }) {
  const [name, setName] = useState(build.name)
  const [description, setDescription] = useState(build.description ?? '')
  const [tags, setTags] = useState(Array.isArray(build.tags) ? build.tags : [])
  const [loadout, setLoadout] = useState(build.loadout)
  const [requirements, setRequirements] = useState(build.requirements)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const canSave = name.trim().length > 0

  const toggleTag = (tag) => {
    setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])
  }

  const save = () => {
    if (!canSave) return
    onSave({
      ...build,
      name: name.trim(),
      description: description.trim(),
      tags,
      loadout,
      requirements,
    })
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="presentation"
    >
      <div className="modal-panel modal-panel-lg" role="dialog" aria-modal="true" aria-labelledby="edit-build-title">
        <div className="modal-header">
          <h2 id="edit-build-title">Edit Build</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body modal-body-scroll">
          <div className="build-editor-section">
            <h3 className="build-editor-section-title">Details</h3>
            <div className="edit-field">
              <label htmlFor="edit-build-name">Build Name</label>
              <input
                id="edit-build-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="edit-field">
              <label htmlFor="edit-build-desc">Description</label>
              <textarea
                id="edit-build-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
          </div>

          <div className="pixel-divider" />

          <LoadoutEditor loadout={loadout} onChange={setLoadout} />

          <div className="pixel-divider" />

          <RequirementsEditor
            requirements={requirements}
            categories={categories}
            categoryOrder={categoryOrder}
            onChange={setRequirements}
          />
        </div>

        <div className="modal-footer">
          <button type="button" className="pixel-btn pixel-btn-block" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="pixel-btn pixel-btn-gold pixel-btn-block"
            onClick={save}
            disabled={!canSave}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
