import { useCallback, useEffect, useState } from 'react'

function read<T>(key: string | null, initial: T): T {
  if (!key) return initial
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : initial
  } catch {
    return initial
  }
}

/** useState persisted to localStorage under `key`. A null key means "no wallet": nothing is read or written. */
export function useStoredState<T>(key: string | null, initial: T) {
  const [state, setState] = useState(() => ({ key, value: read(key, initial) }))

  // Re-read when the key changes (wallet switch), during render so no stale frame is shown.
  if (state.key !== key) {
    setState({ key, value: read(key, initial) })
  }

  useEffect(() => {
    if (!key || state.key !== key) return
    try {
      window.localStorage.setItem(key, JSON.stringify(state.value))
    } catch {
      // Storage full or unavailable: keep working in memory.
    }
  }, [key, state])

  const set = useCallback((update: T | ((prev: T) => T)) => {
    setState((prev) => ({
      key: prev.key,
      value: typeof update === 'function' ? (update as (p: T) => T)(prev.value) : update,
    }))
  }, [])

  const value = state.key === key ? state.value : initial
  return [value, set] as const
}
