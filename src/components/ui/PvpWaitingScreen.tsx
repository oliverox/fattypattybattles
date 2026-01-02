import { useEffect, useCallback, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useGameStore } from '@/stores/gameStore'
import { Id } from '../../../convex/_generated/dataModel'

export function PvpWaitingScreen() {
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)

  const pvpWaitingForOpponent = useGameStore((state) => state.pvpWaitingForOpponent)
  const pvpBattleRequestId = useGameStore((state) => state.pvpBattleRequestId)
  const setPvpWaitingForOpponent = useGameStore((state) => state.setPvpWaitingForOpponent)
  const setPvpBattleRequestId = useGameStore((state) => state.setPvpBattleRequestId)
  const setIsPvpBattle = useGameStore((state) => state.setIsPvpBattle)
  const setPvpOpponentUsername = useGameStore((state) => state.setPvpOpponentUsername)
  const setBattleCardSelectOpen = useGameStore((state) => state.setBattleCardSelectOpen)
  const closePvpUI = useGameStore((state) => state.closePvpUI)

  const requestStatus = useQuery(
    api.pvpBattle.getBattleRequestStatus,
    pvpBattleRequestId ? { requestId: pvpBattleRequestId as Id<"pvpBattleRequests"> } : 'skip'
  )

  const cancelRequest = useMutation(api.pvpBattle.cancelBattleRequest)

  // Handle status changes
  useEffect(() => {
    if (!requestStatus || !pvpWaitingForOpponent) return

    // Request was accepted - open card selection
    if (requestStatus.status === 'accepted') {
      setPvpWaitingForOpponent(false)
      setIsPvpBattle(true)
      setPvpOpponentUsername(requestStatus.targetUsername)
      setBattleCardSelectOpen(true)
    }

    // Request was declined or expired
    if (requestStatus.status === 'declined' || requestStatus.status === 'expired' || requestStatus.status === 'cancelled') {
      closePvpUI()
    }
  }, [requestStatus, pvpWaitingForOpponent, setPvpWaitingForOpponent, setIsPvpBattle, setPvpOpponentUsername, setBattleCardSelectOpen, closePvpUI])

  // Countdown timer
  useEffect(() => {
    if (!requestStatus || !pvpWaitingForOpponent) return

    const expiresAt = requestStatus.expiresAt
    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
      setTimeLeft(remaining)

      // Auto-close when expired
      if (remaining <= 0) {
        closePvpUI()
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [requestStatus, pvpWaitingForOpponent, closePvpUI])

  const handleCancel = useCallback(async () => {
    if (!pvpBattleRequestId || loading) return

    setLoading(true)
    try {
      await cancelRequest({ requestId: pvpBattleRequestId as Id<"pvpBattleRequests"> })
      closePvpUI()
    } catch (err) {
      console.error('Failed to cancel request:', err)
      closePvpUI()
    } finally {
      setLoading(false)
    }
  }, [pvpBattleRequestId, loading, cancelRequest, closePvpUI])

  useEffect(() => {
    if (!pvpWaitingForOpponent) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pvpWaitingForOpponent, handleCancel])

  if (!pvpWaitingForOpponent || !requestStatus) {
    return null
  }

  const targetUsername = requestStatus.targetUsername

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Dialogue box */}
      <div className="relative bg-gray-900/95 border-2 border-cyan-500 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-cyan-500/20">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-cyan-400 text-xl font-bold mb-2">Waiting for Response</h2>
          <p className="text-gray-300">
            Challenging <span className="text-cyan-300 font-bold">{targetUsername}</span>...
          </p>
        </div>

        {/* Animated waiting indicator */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-cyan-500/30 rounded-full" />
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>

        {/* Timer */}
        <div className="text-center mb-6">
          <div className={`text-3xl font-mono font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-cyan-400'}`}>
            {timeLeft}s
          </div>
          <p className="text-gray-500 text-sm">until timeout</p>
        </div>

        {/* Cancel button */}
        <button
          onClick={handleCancel}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-500/50 hover:border-gray-400 rounded-lg px-4 py-3 transition-all"
        >
          <span className="text-gray-200">
            {loading ? 'Cancelling...' : 'Cancel Challenge'}
          </span>
        </button>

        {/* ESC hint */}
        <p className="text-gray-500 text-sm mt-4 text-center">
          Press <span className="text-gray-400">ESC</span> to cancel
        </p>
      </div>
    </div>
  )
}
