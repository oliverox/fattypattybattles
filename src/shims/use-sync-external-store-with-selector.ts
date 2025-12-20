// Shim for React 19 compatibility
// useSyncExternalStoreWithSelector implementation for React 19
import { useSyncExternalStore, useRef, useCallback, useMemo } from 'react'

export function useSyncExternalStoreWithSelector<Snapshot, Selection>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot: undefined | null | (() => Snapshot),
  selector: (snapshot: Snapshot) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean,
): Selection {
  const instRef = useRef<{ hasValue: boolean; value: Selection } | null>(null)
  // Cache for server selection to avoid infinite loops
  const serverSelectionRef = useRef<{ hasValue: boolean; value: Selection } | null>(null)

  const getSelection = useCallback(() => {
    const nextSnapshot = getSnapshot()
    const nextSelection = selector(nextSnapshot)

    if (instRef.current !== null && isEqual !== undefined) {
      if (isEqual(instRef.current.value, nextSelection)) {
        return instRef.current.value
      }
    }

    instRef.current = { hasValue: true, value: nextSelection }
    return nextSelection
  }, [getSnapshot, selector, isEqual])

  // Memoize the server selection getter with caching
  const getServerSelection = useMemo(() => {
    if (getServerSnapshot === undefined || getServerSnapshot === null) {
      return undefined
    }
    // Return a function that caches its result
    return () => {
      if (serverSelectionRef.current !== null) {
        return serverSelectionRef.current.value
      }
      const serverSnapshot = getServerSnapshot()
      const serverSelection = selector(serverSnapshot)
      serverSelectionRef.current = { hasValue: true, value: serverSelection }
      return serverSelection
    }
  }, [getServerSnapshot, selector])

  return useSyncExternalStore(
    subscribe,
    getSelection,
    getServerSelection,
  )
}

// Default export for packages that import the whole module
export default { useSyncExternalStoreWithSelector }
