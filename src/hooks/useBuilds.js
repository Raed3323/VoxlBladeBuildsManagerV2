import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { DEFAULT_BUILDS } from '../data/builds'
import { makeId } from '../utils/id'

/**
 * Builds are plain data, persisted as a single array under one
 * localStorage key. The UI never branches on a build's id or
 * contents - it just reads/writes this list.
 */
export function useBuilds() {
  const [builds, setBuilds] = useLocalStorage('builds', DEFAULT_BUILDS)

  const createBuild = useCallback(
    (name, description = '', tags = []) => {
      const newBuild = {
        id: makeId('build'),
        name: name?.trim() || 'New Build',
        description: description?.trim() || '',
        tags: Array.isArray(tags) ? [...tags] : [],
        loadout: [],
        requirements: [],
      }
      setBuilds((prev) => [...prev, newBuild])
      return newBuild
    },
    [setBuilds]
  )

  const updateBuild = useCallback(
    (id, updater) => {
      setBuilds((prev) =>
        prev.map((b) => {
          if (b.id !== id) return b
          const next = typeof updater === 'function' ? updater(b) : updater
          return { ...b, ...next, id: b.id }
        })
      )
    },
    [setBuilds]
  )

  const renameBuild = useCallback(
    (id, name) => {
      updateBuild(id, (b) => ({ ...b, name: name?.trim() || b.name }))
    },
    [updateBuild]
  )

  const deleteBuild = useCallback(
    (id) => {
      setBuilds((prev) => prev.filter((b) => b.id !== id))
    },
    [setBuilds]
  )

  const duplicateBuild = useCallback(
    (id) => {
      const source = builds.find((b) => b.id === id)
      if (!source) return null

      const copy = {
        ...source,
        id: makeId('build'),
        name: `${source.name} Copy`,
        loadout: source.loadout.map((slot) => ({ ...slot, id: makeId('slot') })),
        requirements: source.requirements.map((req) => ({ ...req, id: makeId('req') })),
      }
      setBuilds((prev) => [...prev, copy])
      return copy
    },
    [builds, setBuilds]
  )

  return { builds, createBuild, updateBuild, renameBuild, deleteBuild, duplicateBuild }
}
