import { useEffect, useRef } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useGameStore } from '@/stores/gameStore'

const UPDATE_INTERVAL_MS = 60000 // Send update every 60 seconds
const IDLE_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes of no movement = idle

export function usePlaytimeTracker() {
  const updatePlayTime = useMutation(api.users.updatePlayTime)
  const accumulatedSecondsRef = useRef(0)
  const lastTickRef = useRef(Date.now())
  const isVisibleRef = useRef(true)

  useEffect(() => {
    // Track visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab became hidden - stop accumulating
        isVisibleRef.current = false
      } else {
        // Tab became visible again - reset last tick
        isVisibleRef.current = true
        lastTickRef.current = Date.now()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Accumulate time every second, but only if player is active (moved within 10 min)
    const tickInterval = setInterval(() => {
      if (isVisibleRef.current) {
        const now = Date.now()
        const lastMovementTime = useGameStore.getState().lastMovementTime
        const isIdle = now - lastMovementTime > IDLE_TIMEOUT_MS

        // Only accumulate time if player has moved within the last 10 minutes
        if (!isIdle) {
          const elapsed = Math.floor((now - lastTickRef.current) / 1000)
          if (elapsed > 0) {
            accumulatedSecondsRef.current += elapsed
          }
        }
        lastTickRef.current = now
      }
    }, 1000)

    // Send accumulated time to server periodically
    const updateInterval = setInterval(async () => {
      const seconds = accumulatedSecondsRef.current
      if (seconds > 0) {
        try {
          await updatePlayTime({ seconds })
          accumulatedSecondsRef.current = 0
        } catch (err) {
          console.error('Failed to update play time:', err)
        }
      }
    }, UPDATE_INTERVAL_MS)

    // Send any remaining time on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(tickInterval)
      clearInterval(updateInterval)

      // Send final accumulated time
      const seconds = accumulatedSecondsRef.current
      if (seconds > 0) {
        updatePlayTime({ seconds }).catch((err) => {
          console.error('Failed to send final play time:', err)
        })
      }
    }
  }, [updatePlayTime])
}
