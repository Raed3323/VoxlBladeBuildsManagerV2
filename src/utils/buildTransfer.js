import { makeId } from './id'

const FORMAT = 'voxlblade-build'
const VERSION = 1

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function makePlayerId() {
  const existing = window.localStorage.getItem('voxlblade-tracker::playerId')
  if (existing) return existing
  const id = `VB-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  window.localStorage.setItem('voxlblade-tracker::playerId', id)
  return id
}

export function getPlayerId() {
  if (typeof window === 'undefined') return ''
  return makePlayerId()
}

function sanitizeBuild(build) {
  return {
    name: String(build?.name || 'Imported Build').trim() || 'Imported Build',
    description: String(build?.description || ''),
    tags: Array.isArray(build?.tags) ? [...build.tags] : [],
    loadout: Array.isArray(build?.loadout)
      ? build.loadout.map((slot) => ({ ...clone(slot), id: makeId('slot') }))
      : [],
    requirements: Array.isArray(build?.requirements)
      ? build.requirements.map((req) => ({ ...clone(req), id: makeId('req') }))
      : [],
  }
}

export function serializeBuild(build) {
  return JSON.stringify({
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    build: sanitizeBuild(build),
  }, null, 2)
}

export function parseBuildFile(text) {
  const payload = JSON.parse(text)
  if (!payload || payload.format !== FORMAT || payload.version !== VERSION || !payload.build) {
    throw new Error('This is not a valid VoxlBlade build file.')
  }
  return sanitizeBuild(payload.build)
}

export function downloadBuild(build) {
  const blob = new Blob([serializeBuild(build)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const safeName = (build?.name || 'VoxlBlade Build')
    .replace(/[^a-z0-9-_ ]/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'VoxlBlade-Build'
  anchor.href = url
  anchor.download = `${safeName}.voxlbuild.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
