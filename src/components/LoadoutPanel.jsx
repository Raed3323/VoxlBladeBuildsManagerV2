export default function LoadoutPanel({ build }) {
  const loadout = build.loadout ?? []
  if (loadout.length === 0) return null

  return (
    <section className="pixel-panel loadout-panel">
      <div className="loadout-heading">
        <div className="build-sub">Equipped Build</div>
        <div className="build-name">{build.name}</div>
      </div>
      <div className="loadout-grid">
        {loadout.map((slot) => (
          <div
            key={slot.id}
            className="item-slot"
            data-rarity={slot.optional ? 'optional' : slot.rarity ?? undefined}
          >
            <div className="item-slot-icon" aria-hidden="true">{slot.icon || '⚔'}</div>
            <div className="item-slot-label">{slot.label}</div>
            <div className="item-slot-value">{slot.item || '—'}</div>
            {slot.optional && <div className="item-slot-flag">Optional</div>}
            {(slot.forgeLevel ?? 0) > 0 && <div className="item-slot-forge">Forge +{slot.forgeLevel}</div>}
            {(slot.enchantments || []).length > 0 && (
              <div className="item-slot-enchants">{slot.enchantments.join(' · ')}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
