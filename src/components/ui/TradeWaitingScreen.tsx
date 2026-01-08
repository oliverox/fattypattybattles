import { useEffect, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useUser } from '@clerk/tanstack-react-start'
import { useGameStore } from '@/stores/gameStore'
import { Id } from '../../../convex/_generated/dataModel'

export function TradeWaitingScreen() {
  const { user } = useUser()
  const [timeLeft, setTimeLeft] = useState(300)
  const [loading, setLoading] = useState(false)

  const tradeRequestId = useGameStore((state) => state.tradeRequestId)
  const tradePartner = useGameStore((state) => state.tradePartner)
  const closeTradeUI = useGameStore((state) => state.closeTradeUI)
  const setTradeNegotiationOpen = useGameStore((state) => state.setTradeNegotiationOpen)

  const tradeRequest = useQuery(
    api.trading.getTradeRequestStatus,
    tradeRequestId ? { requestId: tradeRequestId as Id<"tradeRequests"> } : 'skip'
  )

  const cancelRequest = useMutation(api.trading.cancelTradeRequest)

  // Countdown timer
  useEffect(() => {
    if (!tradeRequest) return

    const expiresAt = tradeRequest.expiresAt
    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
      setTimeLeft(remaining)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [tradeRequest])

  // Watch for status changes
  useEffect(() => {
    if (!tradeRequest) return

    if (tradeRequest.status === 'negotiating') {
      // Request accepted - open negotiation screen
      setTradeNegotiationOpen(true)
    } else if (tradeRequest.status === 'declined' || tradeRequest.status === 'expired' || tradeRequest.status === 'cancelled') {
      // Request declined/expired - close UI
      closeTradeUI()
    }
  }, [tradeRequest?.status, setTradeNegotiationOpen, closeTradeUI])

  const handleCancel = async () => {
    if (!user?.id || !tradeRequestId) return

    setLoading(true)
    try {
      await cancelRequest({
        clerkId: user.id,
        requestId: tradeRequestId as Id<"tradeRequests">,
      })
      closeTradeUI()
    } catch (err) {
      console.error('Failed to cancel:', err)
    } finally {
      setLoading(false)
    }
  }

  // ESC to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tradeRequestId, user?.id])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Don't show if no active pending request
  if (!tradeRequest || tradeRequest.status !== 'pending') {
    return null
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Dialog */}
      <div className="relative bg-gray-900/95 border-2 border-emerald-500 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-emerald-500/20 text-center">
        {/* Loading Animation */}
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <h2 className="text-emerald-400 text-xl font-bold">Waiting for Response</h2>
        </div>

        {/* Info */}
        <p className="text-gray-300 mb-4">
          Waiting for <span className="text-emerald-300 font-bold">{tradePartner?.username}</span> to accept your trade request...
        </p>

        {/* Timer */}
        <div className={`text-2xl font-mono font-bold mb-6 ${timeLeft <= 60 ? 'text-red-400' : 'text-emerald-400'}`}>
          {formatTime(timeLeft)}
        </div>

        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          disabled={loading}
          className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white px-6 py-2 rounded-lg transition-colors"
        >
          {loading ? 'Cancelling...' : 'Cancel Request'}
        </button>

        <p className="text-gray-500 text-xs mt-4">Press ESC to cancel</p>
      </div>
    </div>
  )
}
