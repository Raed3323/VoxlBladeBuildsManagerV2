import { makeId } from '../utils/id'

export default function LoadoutEditor({ loadout, onChange }) {
  const updateSlot = (id, patch) => {
    onChange(loadout.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)))
  }

  const removeSlot = (id) => {
    onChange(loadout.filter((slot) => slot.id !== id))
  }

  const addSlot = () => {
    onChange([...loadout, { id: makeId('slot'), label: '', item: '', optional: false }])
  }

  return (
    <div className="build-editor-section">
      <h3 className="build-editor-section-title">Loadout</h3>

      {loadout.length === 0 && (
        <p className="build-editor-empty">No loadout slots yet. Add one below - slots can be anything (Weapon, Helmet, Ring...).</p>
      )}

      {loadout.map((slot) => (
        <div key={slot.id} className="loadout-editor-row loadout-editor-row-full">
          <div className="loadout-editor-row-main">
            <div className="edit-field">
              <label>Slot Label</label>
              <input
                type="text"
                value={slot.label}
                onChange={(e) => updateSlot(slot.id, { label: e.target.value })}
                placeholder="e.g. Helmet"
              />
            </div>
            <div className="edit-field">
              <label>Equipped Item</label>
              <input
                type="text"
                value={slot.item}
                onChange={(e) => updateSlot(slot.id, { item: e.target.value })}
                placeholder="e.g. Dragonscale Helm"
              />
            </div>
            <label className="edit-toggle edit-toggle-compact">
              <input
                type="checkbox"
                checked={!!slot.optional}
                onChange={(e) => updateSlot(slot.id, { optional: e.target.checked })}
              />
              Optional
            </label>
            <button
              type="button"
              className="pixel-btn pixel-btn-danger"
              onClick={() => removeSlot(slot.id)}
              aria-label={`Remove ${slot.label || 'slot'}`}
            >
              ×
            </button>
          </div>
          <div className="loadout-editor-row-stats">
            <div className="edit-field">
              <label>Enchantments (comma-separated)</label>
              <input
                type="text"
                value={(slot.enchantments || []).join(', ')}
                onChange={(e) =>
                  updateSlot(slot.id, {
                    enchantments: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="e.g. Restored, Sacrificial"
              />
            </div>
            <div className="edit-field edit-field-narrow">
              <label>Forge Level</label>
              <select
                value={slot.forgeLevel ?? 0}
                onChange={(e) => updateSlot(slot.id, { forgeLevel: Number(e.target.value) })}
              >
                {[0, 1, 2, 3, 4, 5].map((lvl) => (
                  <option key={lvl} value={lvl}>+{lvl}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}

      <button type="button" className="pixel-btn pixel-btn-block" onClick={addSlot}>
        + Add Loadout Slot
      </button>
    </div>
  )
}
