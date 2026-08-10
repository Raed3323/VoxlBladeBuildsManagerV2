import { useState } from 'react'

export default function RequirementForm({ initial, categories, categoryOrder, submitLabel, onSubmit, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState(initial?.category ?? categoryOrder[0])
  const [qty, setQty] = useState(initial?.qty ?? 1)
  const [optional, setOptional] = useState(initial?.optional ?? false)
  const [note, setNote] = useState(initial?.note ?? '')

  const canSubmit = name.trim().length > 0 && Number(qty) >= 1

  const submit = () => {
    if (!canSubmit) return
    onSubmit({
      name: name.trim(),
      category,
      qty: Math.max(1, Math.round(Number(qty) || 1)),
      optional,
      note: note.trim() || undefined,
    })
  }

  return (
    <div className="req-form">
      <div className="edit-field">
        <label>Item Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Hallowed Blade"
        />
      </div>

      <div className="edit-field-row">
        <div className="edit-field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categoryOrder.map((key) => (
              <option key={key} value={key}>
                {categories[key].label}
              </option>
            ))}
          </select>
        </div>

        <div className="edit-field edit-field-narrow">
          <label>Required Qty</label>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
      </div>

      <div className="edit-field">
        <label>Description</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note, e.g. 'Used for: Sporeboss'"
        />
      </div>

      <label className="edit-toggle">
        <input type="checkbox" checked={optional} onChange={(e) => setOptional(e.target.checked)} />
        Optional (doesn't count toward main progress)
      </label>

      <div className="modal-actions">
        <button type="button" className="pixel-btn pixel-btn-block" onClick={onCancel}>Cancel</button>
        <button
          type="button"
          className="pixel-btn pixel-btn-gold pixel-btn-block"
          onClick={submit}
          disabled={!canSubmit}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  )
}
