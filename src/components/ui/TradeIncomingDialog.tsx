import { useEffect, useCallback, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useUser } from '@clerk/tanstack-react-start'
import { useGameStore } from '@/stores/gameStore'
import { Id } from '../../../convex/_generated/dataModel'

const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-300',
  uncommon: 'text-green-300',
  rare: 'text-blue-300',
  legendary: 'text-purple-300',
  mythical: 'text-pink-300',
  divine: 'text-yellow-300',
  prismatic: 'text-cyan-300',
  transcendent: 'text-orange-300',
  holographic: 'text-white bg-white/10 animate-pulse',
  exclusive: 'text-pink-300 bg-pink-300/10 animate-pulse',
}

export function TradeIncomingDialog() {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes

  const setTradeIncomingDialogOpen = useGameStore((state) => state.setTradeIncomingDialogOpen)
  const setTradeRequestId = useGameStore((state) => state.setTradeRequestId)
  const setTradePartner = useGameStore((state) => state.setTradePartner)
  const setTradeNegotiationOpen = useGameStore((state) => state.setTradeNegotiationOpen)

  const incomingRequests = useQuery(
    api.trading.getIncomingTradeRequests,
    user?.id ? { clerkId: user.id } : 'skip'
  )

  const acceptRequest = useMutation(api.trading.acceptTradeRequest)
  const declineRequest = useMutation(api.trading.declineTradeRequest)

  // Get the first pending request
  const request = incomingRequests?.[0]

  // Countdown timer
  useEffect(() => {
    if (!request) return

    const expiresAt = request.expiresAt
    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
      setTimeLeft(remaining)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [request])

  const handleAccept = useCallback(async () => {
    if (!request || loading || !user?.id) return

    setLoading(true)
    try {
      await acceptRequest({
        clerkId: user.id,
        requestId: request._id as Id<"tradeRequests">,
      })
      setTradeIncomingDialogOpen(false)
      setTradeRequestId(request._id)
      setTradePartner({ clerkId: request.senderId, username: request.senderUsername })
      setTradeNegotiationOpen(true)
    } catch (err) {
      console.error('Failed to accept trade:', err)
    } finally {
      setLoading(false)
    }
  }, [request, loading, user?.id, acceptRequest, setTradeIncomingDialogOpen, setTradeRequestId, setTradePartner, setTradeNegotiationOpen])

  const handleDecline = useCallback(async () => {
    if (!request || loading || !user?.id) return

    setLoading(true)
    try {
      await declineRequest({
        clerkId: user.id,
        requestId: request._id as Id<"tradeRequests">,
      })
    } catch (err) {
      console.error('Failed to decline trade:', err)
    } finally {
      setLoading(false)
    }
  }, [request, loading, user?.id, declineRequest])

  // Keyboard shortcuts
  useEffect(() => {
    if (!request) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') {
        handleAccept()
      } else if (e.key === '2' || e.key === 'Escape') {
        handleDecline()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [request, handleAccept, handleDecline])

  if (!request) {
    return null
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const hasOffer = request.senderOffer.cards.length > 0 || request.senderOffer.coins > 0

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Dialog */}
      <div className="relative bg-gray-900/95 border-2 border-emerald-500 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-emerald-500/20 animate-pulse-border">
        {/* Header with timer */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-emerald-400 text-xl font-bold">Trade Request!</h2>
            <div className={`text-lg font-mono font-bold ${timeLeft <= 30 ? 'text-red-400' : 'text-emerald-400'}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
          <p className="text-gray-300">
            <span className="text-emerald-300 font-bold">{request.senderUsername}</span> wants to trade with you!
          </p>
        </div>

        {/* Offer preview */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
          <p className="text-gray-400 text-sm mb-2">Their initial offer:</p>
          {hasOffer ? (
            <div className="space-y-2">
              {request.senderOffer.coins > 0 && (
                <p className="text-yellow-400">💰 {request.senderOffer.coins} PattyCoins</p>
              )}
              {request.senderOffer.cards.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {request.senderOffer.cards.map((card, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2 py-1 rounded bg-gray-700 ${RARITY_COLORS[card.rarity] ?? RARITY_COLORS.common}`}
                    >
                      {card.cardName}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic">No items offered - they want to request something from you</p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full flex items-center gap-3 bg-emerald-900/50 hover:bg-emerald-800/50 border border-emerald-500/50 hover:border-emerald-400 rounded-lg px-4 py-3 transition-all group"
          >
            <span className="text-emerald-400 bg-emerald-400/20 px-2 py-1 rounded font-mono text-sm">
              1
            </span>
            <span className="text-gray-200 group-hover:text-white">
              {loading ? 'Accepting...' : 'Open Trade'}
            </span>
          </button>

          <button
            onClick={handleDecline}
            disabled={loading}
            className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-500/50 hover:border-gray-400 rounded-lg px-4 py-3 transition-all group"
          >
            <span className="text-gray-400 bg-gray-700 px-2 py-1 rounded font-mono text-sm">
              2
            </span>
            <span className="text-gray-200 group-hover:text-white">
              {loading ? 'Declining...' : 'Decline'}
            </span>
          </button>
        </div>

        {/* Timer warning */}
        {timeLeft <= 30 && (
          <p className="text-red-400 text-sm mt-4 text-center animate-pulse">
            Trade request expires soon!
          </p>
        )}
      </div>
    </div>
  )
}
