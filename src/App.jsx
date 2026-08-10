import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, CATEGORY_ORDER } from './data/builds'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useBuildProgress, computeProgress } from './hooks/useBuildProgress'
import { useBuilds } from './hooks/useBuilds'

import AmbientBackground from './components/AmbientBackground'
import BuildSwitcher from './components/BuildSwitcher'
import LoadoutPanel from './components/LoadoutPanel'
import Dashboard from './components/Dashboard'
import Controls from './components/Controls'
import CategoryHeader from './components/CategoryHeader'
import RequirementCard from './components/RequirementCard'
import ItemModal from './components/ItemModal'
import ToastStack from './components/ToastStack'
import SettingsMenu from './components/SettingsMenu'
import NewBuildModal from './components/NewBuildModal'
import RenameBuildModal from './components/RenameBuildModal'
import EditBuildModal from './components/EditBuildModal'
import ConfirmModal from './components/ConfirmModal'
import StatsView from './components/Stats/StatsView'
import { downloadBuild, parseBuildFile, getPlayerId } from './utils/buildTransfer'

let toastId = 0

function App() {
  const { builds, createBuild, updateBuild, renameBuild, deleteBuild, duplicateBuild } = useBuilds()
  const playerId = useMemo(() => getPlayerId(), [])

  const [selectedBuildId, setSelectedBuildId] = useLocalStorage('selectedBuildId', builds[0]?.id ?? null)
  const build = builds.find((b) => b.id === selectedBuildId) ?? builds[0] ?? null

  // Keep the persisted selection pointed at a build that still exists
  // (e.g. after the selected build was deleted).
  useEffect(() => {
    if (builds.length === 0) return
    if (!builds.some((b) => b.id === selectedBuildId)) {
      setSelectedBuildId(builds[0].id)
    }
  }, [builds, selectedBuildId, setSelectedBuildId])

  const [progressByBuild, setProgressByBuild] = useLocalStorage('progress', {})
  const quantities = build ? progressByBuild[build.id] ?? {} : {}

  const setQuantities = (updater) => {
    if (!build) return
    setProgressByBuild((prev) => {
      const current = prev[build.id] ?? {}
      const next = typeof updater === 'function' ? updater(current) : updater
      return { ...prev, [build.id]: next }
    })
  }

  const [activeView, setActiveView] = useLocalStorage('activeView', 'tracker')
  const [search, setSearch] = useLocalStorage('search', '')
  const [activeFilter, setActiveFilter] = useLocalStorage('filter', 'all')
  const [modalItem, setModalItem] = useState(null)
  const [toasts, setToasts] = useState([])

  // build-management modal state
  const [creatingBuild, setCreatingBuild] = useState(false)
  const [renamingBuild, setRenamingBuild] = useState(null)
  const [editingBuild, setEditingBuild] = useState(null)
  const [deletingBuild, setDeletingBuild] = useState(null)

  const progress = useBuildProgress(build?.requirements ?? [], quantities)

  const pushToast = (message, type) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 200)
    }, 2400)
  }

  const setQty = (requirement, nextQty) => {
    const prevQty = Math.max(0, Math.min(requirement.qty, quantities[requirement.id] ?? 0))
    const clamped = Math.max(0, Math.min(requirement.qty, nextQty))
    if (clamped === prevQty) return

    setQuantities((current) => ({ ...current, [requirement.id]: clamped }))

    const wasComplete = prevQty >= requirement.qty
    const nowComplete = clamped >= requirement.qty
    if (nowComplete && !wasComplete) {
      pushToast(requirement.name, 'complete')
    } else if (!nowComplete && wasComplete) {
      pushToast(requirement.name, 'incomplete')
    }
  }

  const resetBuildProgress = (targetBuild) => {
    setProgressByBuild((prev) => ({ ...prev, [targetBuild.id]: {} }))
    pushToast(`${targetBuild.name} progress cleared`, 'incomplete')
  }

  // ---- build management handlers ----
  const getPercent = (b) => computeProgress(b.requirements, progressByBuild[b.id] ?? {}).percent

  const handleCreateBuild = (name, description, tags = []) => {
    const newBuild = createBuild(name, description, tags)
    setSelectedBuildId(newBuild.id)
    setCreatingBuild(false)
    pushToast(`${newBuild.name} created`, 'complete')
  }

  const handleRenameSubmit = (newName) => {
    renameBuild(renamingBuild.id, newName)
    pushToast('Build renamed', 'complete')
    setRenamingBuild(null)
  }

  const handleEditSave = (updatedBuild) => {
    updateBuild(updatedBuild.id, () => updatedBuild)
    pushToast(`${updatedBuild.name} saved`, 'complete')
    setEditingBuild(null)
  }

  const handleDuplicate = (b) => {
    const copy = duplicateBuild(b.id)
    if (copy) pushToast(`${copy.name} created`, 'complete')
  }

  const handleExportBuild = (targetBuild) => {
    if (!targetBuild) return
    downloadBuild(targetBuild)
    pushToast(`${targetBuild.name} exported`, 'complete')
  }

  const handleImportBuild = (text, errorMessage) => {
    if (!text) {
      pushToast(errorMessage || 'Invalid build file', 'incomplete')
      return
    }
    try {
      const imported = parseBuildFile(text)
      const baseName = imported.name || 'Imported Build'
      const existingNames = new Set(builds.map((b) => b.name.toLowerCase()))
      let name = baseName
      let index = 2
      while (existingNames.has(name.toLowerCase())) {
        name = `${baseName} (${index++})`
      }
      const newBuild = { ...imported, id: `build-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, name }
      // Imported builds start with fresh local progress; progress is not part of the shared build.
      setProgressByBuild((prev) => ({ ...prev, [newBuild.id]: {} }))
      // useBuilds exposes no bulk-import helper, so append through the existing create/update architecture.
      // Create a shell, then replace its contents while retaining the generated local id.
      const shell = createBuild(name, imported.description, imported.tags)
      updateBuild(shell.id, () => ({ ...newBuild, id: shell.id }))
      setSelectedBuildId(shell.id)
      setActiveView('tracker')
      pushToast(`${name} imported`, 'complete')
    } catch (error) {
      pushToast(error?.message || 'Invalid VoxlBlade build file', 'incomplete')
    }
  }

  const handleDeleteConfirmed = () => {
    if (!deletingBuild) return
    deleteBuild(deletingBuild.id)
    setProgressByBuild((prev) => {
      const next = { ...prev }
      delete next[deletingBuild.id]
      return next
    })
    pushToast(`${deletingBuild.name} deleted`, 'incomplete')
    setDeletingBuild(null)
  }

  // ---- filtering ----
  const filterCounts = useMemo(() => {
    const requirements = build?.requirements ?? []
    const counts = { all: requirements.length, incomplete: 0, complete: 0, optional: 0 }
    for (const key of CATEGORY_ORDER) counts[key] = 0

    for (const r of requirements) {
      const have = Math.max(0, Math.min(r.qty, quantities[r.id] ?? 0))
      const done = have >= r.qty
      if (done) counts.complete += 1
      else counts.incomplete += 1
      if (r.optional) counts.optional += 1
      counts[r.category] += 1
    }
    return counts
  }, [build, quantities])

  const filters = [
    { key: 'all', label: 'ALL', count: filterCounts.all },
    { key: 'incomplete', label: 'INCOMPLETE', count: filterCounts.incomplete },
    { key: 'complete', label: 'COMPLETE', count: filterCounts.complete },
    ...CATEGORY_ORDER.filter((c) => filterCounts[c] > 0).map((c) => ({
      key: c,
      label: CATEGORIES[c].label.toUpperCase(),
      count: filterCounts[c],
    })),
    { key: 'optional', label: 'OPTIONAL', count: filterCounts.optional },
  ]

  const searchLower = search.trim().toLowerCase()

  const visibleRequirements = (build?.requirements ?? []).filter((r) => {
    const have = Math.max(0, Math.min(r.qty, quantities[r.id] ?? 0))
    const done = have >= r.qty

    if (activeFilter === 'incomplete' && done) return false
    if (activeFilter === 'complete' && !done) return false
    if (activeFilter === 'optional' && !r.optional) return false
    if (CATEGORY_ORDER.includes(activeFilter) && r.category !== activeFilter) return false

    if (searchLower) {
      const haystack = `${r.name} ${CATEGORIES[r.category].label} ${r.note ?? ''}`.toLowerCase()
      if (!haystack.includes(searchLower)) return false
    }
    return true
  })

  const groupedByCategory = useMemo(() => {
    const map = {}
    for (const r of visibleRequirements) {
      if (!map[r.category]) map[r.category] = []
      map[r.category].push(r)
    }
    return map
  }, [visibleRequirements])

  useEffect(() => {
    if (build) document.title = `${build.name} — ${progress.percent}% Complete`
    else document.title = 'VoxlBlade Build Manager'
  }, [build, progress.percent])

  const isUnconfigured = build && build.loadout.length === 0 && build.requirements.length === 0

  return (
    <>
      <AmbientBackground />
      <div className="app-shell">
        <div className="top-bar">
          <div className="brand">
            <div className="brand-glyph" aria-hidden="true">⚔</div>
            <div>
              <div className="brand-text">VoxlBlade Build Manager</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {build && (
              <button
                type="button"
                className="icon-btn"
                aria-label="Edit current build"
                onClick={() => setEditingBuild(build)}
              >
                ✎
              </button>
            )}
            <SettingsMenu
              build={build}
              playerId={playerId}
              onExportBuild={handleExportBuild}
              onImportBuild={handleImportBuild}
              onReset={build ? () => resetBuildProgress(build) : undefined}
            />
          </div>
        </div>

        <BuildSwitcher
          builds={builds}
          selectedId={build?.id}
          getPercent={getPercent}
          onSelect={setSelectedBuildId}
          onCreate={() => setCreatingBuild(true)}
          onRename={setRenamingBuild}
          onEdit={setEditingBuild}
          onDuplicate={handleDuplicate}
          onReset={resetBuildProgress}
          onDelete={setDeletingBuild}
          onExport={handleExportBuild}
        />

        {!build && (
          <div className="empty-state">
            <span className="empty-title">NO BUILDS YET</span>
            Create your first build to start tracking progress.
          </div>
        )}

        {build && isUnconfigured && (
          <section className="pixel-panel empty-build-panel">
            <div className="pixel-panel-body empty-build-body">
              <span className="empty-title">BUILD NOT CONFIGURED</span>
              <p>Add your loadout and requirements to begin tracking this build.</p>
              <button type="button" className="pixel-btn pixel-btn-gold" onClick={() => setEditingBuild(build)}>
                Edit Build
              </button>
            </div>
          </section>
        )}

        {build && !isUnconfigured && (
          <div className="view-tabs" role="tablist" aria-label="Build view">
            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'tracker'}
              className={`view-tab ${activeView === 'tracker' ? 'is-active' : ''}`}
              onClick={() => setActiveView('tracker')}
            >
              ✎ Tracker
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'stats'}
              className={`view-tab ${activeView === 'stats' ? 'is-active' : ''}`}
              onClick={() => setActiveView('stats')}
            >
              ⚔ Stats
            </button>
          </div>
        )}

        {build && !isUnconfigured && activeView === 'stats' && (
          <StatsView build={build} />
        )}

        {build && !isUnconfigured && activeView === 'tracker' && (
          <>
            <LoadoutPanel build={build} />
            <Dashboard buildName={build.name} buildTags={build.tags ?? []} progress={progress} />

            <Controls
              search={search}
              onSearch={setSearch}
              filters={filters}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />

            {visibleRequirements.length === 0 ? (
              <div className="empty-state">
                <span className="empty-title">NO REQUIREMENTS FOUND</span>
                Try a different filter or search term.
              </div>
            ) : (
              CATEGORY_ORDER.filter((cat) => groupedByCategory[cat]?.length).map((cat) => {
                const items = groupedByCategory[cat]
                const complete = items.filter((r) => {
                  const have = Math.max(0, Math.min(r.qty, quantities[r.id] ?? 0))
                  return have >= r.qty
                }).length
                const allOptional = items.every((r) => r.optional)

                return (
                  <div className="category-block" key={cat}>
                    <CategoryHeader
                      icon={CATEGORIES[cat].icon}
                      label={CATEGORIES[cat].label}
                      complete={complete}
                      total={items.length}
                      optional={allOptional}
                    />
                    <div className="card-grid">
                      {items.map((r) => {
                        const qty = Math.max(0, Math.min(r.qty, quantities[r.id] ?? 0))
                        return (
                          <RequirementCard
                            key={r.id}
                            requirement={r}
                            qty={qty}
                            isComplete={qty >= r.qty}
                            onSetQty={(next) => setQty(r, next)}
                            onOpen={setModalItem}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}

            <p className="footer-note">Player ID: {playerId} · Builds and progress are saved privately in this browser.</p>
          </>
        )}
      </div>

      {modalItem && (
        <ItemModal
          requirement={modalItem}
          qty={Math.max(0, Math.min(modalItem.qty, quantities[modalItem.id] ?? 0))}
          isComplete={(quantities[modalItem.id] ?? 0) >= modalItem.qty}
          onSetQty={(next) => setQty(modalItem, next)}
          onClose={() => setModalItem(null)}
        />
      )}

      {creatingBuild && (
        <NewBuildModal onCreate={handleCreateBuild} onClose={() => setCreatingBuild(false)} />
      )}

      {renamingBuild && (
        <RenameBuildModal
          build={renamingBuild}
          onRename={handleRenameSubmit}
          onClose={() => setRenamingBuild(null)}
        />
      )}

      {editingBuild && (
        <EditBuildModal
          build={editingBuild}
          categories={CATEGORIES}
          categoryOrder={CATEGORY_ORDER}
          onSave={handleEditSave}
          onClose={() => setEditingBuild(null)}
        />
      )}

      {deletingBuild && (
        <ConfirmModal
          title="Delete Build?"
          message={`Are you sure you want to delete "${deletingBuild.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirmed}
          onClose={() => setDeletingBuild(null)}
        />
      )}

      <ToastStack toasts={toasts} />
    </>
  )
}

export default App
