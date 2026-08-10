import { useEffect, useRef, useState } from 'react'

const STORAGE_PREFIX = 'voxlblade-tracker::'

function safeParse(raw, fallback) {
  if (raw == null) return fallback
  try {
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    // Corrupted JSON - fall back silently rather than crashing the app
    return fallback
  }
}

/**
 * Persisted state backed by localStorage. Falls back gracefully if
 * localStorage is unavailable (private browsing, corrupted data, etc).
 */
export function useLocalStorage(key, initialValue) {
  const fullKey = STORAGE_PREFIX + key
  const isFirstRun = useRef(true)

  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const raw = window.localStorage.getItem(fullKey)
      return safeParse(raw, initialValue)
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    // Avoid an unnecessary write on mount when nothing changed
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    try {
      window.localStorage.setItem(fullKey, JSON.stringify(value))
    } catch {
      // Storage full or unavailable - progress just won't persist this session
    }
  }, [fullKey, value])

  return [value, setValue]
}
