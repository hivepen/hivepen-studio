import { useEffect, useState } from 'react'

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(key)
    if (stored !== null) {
      try {
        setValue(JSON.parse(stored) as T)
      } catch {
        setValue(initialValue)
      }
    }
    setReady(true)
  }, [initialValue, key])

  useEffect(() => {
    if (!ready || typeof window === 'undefined') return
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, ready, value])

  return [value, setValue, ready] as const
}
