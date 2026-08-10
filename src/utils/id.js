let counter = 0

/**
 * Generates a reasonably-unique id scoped to this browser session.
 * Good enough for client-only, localStorage-backed data - we don't
 * need cryptographic uniqueness, just no collisions within a build.
 */
export function makeId(prefix = 'id') {
  counter += 1
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now().toString(36)}-${counter}-${rand}`
}
