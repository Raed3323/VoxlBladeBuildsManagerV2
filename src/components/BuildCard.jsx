import { useEffect, useRef, useState } from 'react'

export default function BuildCard({
  build,
  percent,
  selected,
  onSelect,
  onRename,
  onEdit,
  onDuplicate,
  onReset,
  onDelete,
  onExport,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setMenuOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const runAction = (fn) => {
    setMenuOpen(false)
    fn(build)
  }

  return (
    <div ref={rootRef} className={`build-card ${selected ? 'is-selected' : ''}`}>
      <button type="button" className="build-card-select" onClick={() => onSelect(build.id)}>
        <span className="build-card-icon" aria-hidden="true">⚔</span>
        <span className="build-card-name">{build.name}</span>
        {Array.isArray(build.tags) && build.tags.length > 0 && (
          <span className="build-card-tags">
            {build.tags.map((tag) => <span key={tag} className="build-tag-chip">{tag}</span>)}
          </span>
        )}
        <span className="build-card-percent">{percent}%</span>
      </button>

      <button
        type="button"
        className="build-card-menu-btn"
        aria-label={`Manage ${build.name}`}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
      >
        ⋮
      </button>

      {menuOpen && (
        <div className="build-card-menu pixel-panel" role="menu">
          <button type="button" role="menuitem" onClick={() => runAction(onRename)}>Rename</button>
          <button type="button" role="menuitem" onClick={() => runAction(onEdit)}>Edit Build</button>
          <button type="button" role="menuitem" onClick={() => runAction(onDuplicate)}>Duplicate</button>
          <button type="button" role="menuitem" onClick={() => runAction(onExport)}>Export Build</button>
          <button type="button" role="menuitem" onClick={() => runAction(onReset)}>Reset Progress</button>
          <button type="button" role="menuitem" className="is-danger" onClick={() => runAction(onDelete)}>Delete</button>
        </div>
      )}
    </div>
  )
}
