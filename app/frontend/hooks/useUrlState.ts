import { useState, useCallback, useEffect } from 'react'

/**
 * Synchronise a piece of state with a URL query-param.
 *
 * - Reads the initial value from `?key=…` (falls back to `defaultValue`).
 * - Updates the URL via `replaceState` when the value changes.
 * - Passing `null` or `undefined` removes the param from the URL.
 *
 * Usage:
 *   const [tab, setTab] = useUrlState('tab', 'dashboard')
 */
export function useUrlState(
  key: string,
  defaultValue: string,
): [string, (value: string | null) => void] {
  const [value, setValue] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get(key) ?? defaultValue
  })

  // Sync URL whenever value changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const current = params.get(key)

    if (value === defaultValue || value == null) {
      if (current != null) {
        params.delete(key)
        const qs = params.toString()
        window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
      }
    } else if (current !== value) {
      params.set(key, value)
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
    }
  }, [key, value, defaultValue])

  const set = useCallback((v: string | null) => {
    setValue(v ?? defaultValue)
  }, [defaultValue])

  return [value, set]
}

/**
 * Like useUrlState but uses pushState (for modals — back button closes them).
 * Listens to popstate to update when user navigates back.
 */
export function useUrlStatePush(
  key: string,
  defaultValue: string | null = null,
): [string | null, (value: string | null) => void] {
  const [value, setValue] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get(key) ?? defaultValue
  })

  // Listen for popstate (back/forward)
  useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams(window.location.search)
      setValue(params.get(key) ?? defaultValue)
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [key, defaultValue])

  const set = useCallback((v: string | null) => {
    const params = new URLSearchParams(window.location.search)
    if (v == null || v === defaultValue) {
      params.delete(key)
    } else {
      params.set(key, v)
    }
    const qs = params.toString()
    const url = `${window.location.pathname}${qs ? `?${qs}` : ''}`
    window.history.pushState({}, '', url)
    setValue(v ?? defaultValue)
  }, [key, defaultValue])

  return [value, set]
}
