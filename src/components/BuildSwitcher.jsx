import BuildCard from './BuildCard'

export default function BuildSwitcher({
  builds,
  selectedId,
  getPercent,
  onSelect,
  onCreate,
  onRename,
  onEdit,
  onDuplicate,
  onReset,
  onDelete,
  onExport,
}) {
  return (
    <section className="pixel-panel build-switcher">
      <h2 className="pixel-panel-title">
        <span aria-hidden="true">⚔</span>
        My Builds
      </h2>
      <div className="pixel-panel-body build-switcher-body">
        <div className="build-card-row">
          {builds.map((b) => (
            <BuildCard
              key={b.id}
              build={b}
              percent={getPercent(b)}
              selected={b.id === selectedId}
              onSelect={onSelect}
              onRename={onRename}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onReset={onReset}
              onDelete={onDelete}
              onExport={onExport}
            />
          ))}

          <button type="button" className="build-card build-card-new" onClick={onCreate}>
            <span className="build-card-new-icon" aria-hidden="true">+</span>
            <span>New Build</span>
          </button>
        </div>
      </div>
    </section>
  )
}
