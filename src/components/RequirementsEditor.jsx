import { useState } from 'react'
import { makeId } from '../utils/id'
import RequirementForm from './RequirementForm'

export default function RequirementsEditor({ requirements, categories, categoryOrder, onChange }) {
  const [editingId, setEditingId] = useState(null)
  const [adding, setAdding] = useState(false)

  const grouped = {}
  for (const r of requirements) {
    if (!grouped[r.category]) grouped[r.category] = []
    grouped[r.category].push(r)
  }

  const updateRequirement = (id, vals) => {
    onChange(requirements.map((r) => (r.id === id ? { ...r, ...vals } : r)))
    setEditingId(null)
  }

  const addRequirement = (vals) => {
    onChange([...requirements, { id: makeId('req'), ...vals }])
    setAdding(false)
  }

  const removeRequirement = (id) => {
    onChange(requirements.filter((r) => r.id !== id))
  }

  return (
    <div className="build-editor-section">
      <h3 className="build-editor-section-title">Build Requirements</h3>

      {requirements.length === 0 && !adding && (
        <p className="build-editor-empty">No requirements yet. Add the first one below.</p>
      )}

      {categoryOrder
        .filter((cat) => grouped[cat]?.length)
        .map((cat) => (
          <div key={cat} className="req-editor-group">
            <div className="req-editor-group-title">
              <span aria-hidden="true">{categories[cat].icon}</span>
              {categories[cat].label.toUpperCase()}
            </div>

            {grouped[cat].map((r) =>
              editingId === r.id ? (
                <div key={r.id} className="req-form-wrap">
                  <RequirementForm
                    initial={r}
                    categories={categories}
                    categoryOrder={categoryOrder}
                    submitLabel="Save"
                    onSubmit={(vals) => updateRequirement(r.id, vals)}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <div key={r.id} className="req-editor-row">
                  <span className="req-editor-row-name">
                    {r.qty > 1 ? `${r.qty}x ${r.name}` : r.name}
                    {r.optional && <span className="req-editor-optional-tag">OPTIONAL</span>}
                    {r.note && <span className="req-editor-row-note">{r.note}</span>}
                  </span>
                  <span className="req-editor-row-actions">
                    <button type="button" className="pixel-btn" onClick={() => setEditingId(r.id)}>Edit</button>
                    <button
                      type="button"
                      className="pixel-btn pixel-btn-danger"
                      onClick={() => removeRequirement(r.id)}
                      aria-label={`Remove ${r.name}`}
                    >
                      ×
                    </button>
                  </span>
                </div>
              )
            )}
          </div>
        ))}

      {adding ? (
        <div className="req-form-wrap">
          <RequirementForm
            categories={categories}
            categoryOrder={categoryOrder}
            submitLabel="Add"
            onSubmit={addRequirement}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : (
        <button type="button" className="pixel-btn pixel-btn-gold pixel-btn-block" onClick={() => setAdding(true)}>
          + Add Requirement
        </button>
      )}
    </div>
  )
}
