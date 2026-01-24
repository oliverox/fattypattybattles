import { useCallback, useEffect, useRef } from 'react'
import { useMutation } from 'convex/react'
import { Vector3 } from 'three'
import { api } from '../../convex/_generated/api'
import { MULTIPLAYER } from '@/lib/game/constants'
import { useGameStore } from '@/stores/gameStore'

export function usePositionSync(mapId: string) {
  const updatePosition = useMutation(api.multiplayer.updatePosition)
  const setOffline = useMutation(api.multiplayer.setOffline)
  const lastUpdateRef = useRef(0)
  const lastPositionRef = useRef<{ x: number; y: number; z: number } | null>(null)
  const setShouldRespawn = useGameStore((state) => state.setShouldRespawn)

  const syncPosition = useCallback(
    (position: Vector3, rotation: number) => {
      const now = Date.now()

      // Throttle updates
      if (now - lastUpdateRef.current < MULTIPLAYER.positionUpdateRate) {
        return
      }

      // Skip if position hasn't changed significantly
      if (lastPositionRef.current) {
        const dx = Math.abs(position.x - lastPositionRef.current.x)
        const dy = Math.abs(position.y - lastPositionRef.current.y)
        const dz = Math.abs(position.z - lastPositionRef.current.z)
        if (dx < 0.01 && dy < 0.01 && dz < 0.01) {
          return
        }
      }

      lastUpdateRef.current = now
      lastPositionRef.current = { x: position.x, y: position.y, z: position.z }

      updatePosition({
        x: position.x,
        y: position.y,
        z: position.z,
        rotation,
        mapId,
      }).catch((err) => {
        // Silently handle errors to avoid spamming console
        console.debug('Position update failed:', err)
      })
    },
    [updatePosition, mapId]
  )

  // Set offline on unmount
  useEffect(() => {
    return () => {
      setOffline().catch(() => {
        // Ignore errors on unmount
      })
    }
  }, [setOffline])

  // Set offline on browser close/navigate away or tab hidden
  useEffect(() => {
    const handleUnload = () => {
      // Use sendBeacon for reliable offline notification
      // Note: Convex mutations don't support sendBeacon, so we just try our best
      setOffline().catch(() => {})
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Tab hidden - immediately mark offline so others can't see us
        setOffline().catch(() => {})
      } else {
        // Tab became visible again - trigger respawn to spawn point
        setShouldRespawn(true)
        // Reset last position so syncPosition fires immediately after respawn
        lastPositionRef.current = null
      }
    }

    window.addEventListener('beforeunload', handleUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [setOffline, setShouldRespawn])

  return { syncPosition }
}
