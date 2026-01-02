import { useEffect, useCallback, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useGameStore } from '@/stores/gameStore'
import { PVP_BATTLE } from '@/lib/game/constants'
import { Id } from '../../../convex/_generated/dataModel'

export function PvpIncomingDialog() {
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)

  const setPvpIncomingDialogOpen = useGameStore((state) => state.setPvpIncomingDialogOpen)
  const setPvpBattleRequestId = useGameStore((state) => state.setPvpBattleRequestId)
  const setIsPvpBattle = useGameStore((state) => state.setIsPvpBattle)
  const setPvpOpponentUsername = useGameStore((state) => state.setPvpOpponentUsername)
  const setBattleCardSelectOpen = useGameStore((state) => state.setBattleCardSelectOpen)

  const incomingRequests = useQuery(api.pvpBattle.getIncomingRequests)
  const acceptRequest = useMutation(api.pvpBattle.acceptBattleRequest)
  const declineRequest = useMutation(api.pvpBattle.declineBattleRequest)

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
    if (!request || loading) return

    setLoading(true)
    try {
      await acceptRequest({ requestId: request._id as Id<"pvpBattleRequests"> })
      setPvpIncomingDialogOpen(false)
      setPvpBattleRequestId(request._id)
      setIsPvpBattle(true)
      setPvpOpponentUsername(request.challengerUsername)
      setBattleCardSelectOpen(true)
    } catch (err) {
      console.error('Failed to accept battle:', err)
    } finally {
      setLoading(false)
    }
  }, [request, loading, acceptRequest, setPvpIncomingDialogOpen, setPvpBattleRequestId, setIsPvpBattle, setPvpOpponentUsername, setBattleCardSelectOpen])

  const handleDecline = useCallback(async () => {
    if (!request || loading) return

    setLoading(true)
    try {
      await declineRequest({ requestId: request._id as Id<"pvpBattleRequests"> })
    } catch (err) {
      console.error('Failed to decline battle:', err)
    } finally {
      setLoading(false)
    }
  }, [request, loading, declineRequest])

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

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Dialogue box */}
      <div className="relative bg-gray-900/95 border-2 border-orange-500 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-orange-500/20 animate-pulse-border">
        {/* Header with timer */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-orange-400 text-xl font-bold">Battle Challenge!</h2>
            <div className={`text-lg font-mono font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-orange-400'}`}>
              {timeLeft}s
            </div>
          </div>
          <p className="text-gray-300">
            <span className="text-orange-300 font-bold">{request.challengerUsername}</span> wants to battle you!
          </p>
        </div>

        {/* Battle info */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Entry Cost:</span>
            <span className="text-green-400 font-bold">FREE</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Win Reward:</span>
            <span className="text-green-400 font-bold">{PVP_BATTLE.rewardMin}-{PVP_BATTLE.rewardMax} PattyCoins</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Pack Chance:</span>
            <span className="text-purple-400 font-bold">{Math.round(PVP_BATTLE.packChance * 100)}%+</span>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full flex items-center gap-3 bg-green-900/50 hover:bg-green-800/50 border border-green-500/50 hover:border-green-400 rounded-lg px-4 py-3 transition-all group"
          >
            <span className="text-green-400 bg-green-400/20 px-2 py-1 rounded font-mono text-sm">
              1
            </span>
            <span className="text-gray-200 group-hover:text-white">
              {loading ? 'Accepting...' : 'Accept Challenge!'}
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
        {timeLeft <= 10 && (
          <p className="text-red-400 text-sm mt-4 text-center animate-pulse">
            Challenge expires soon!
          </p>
        )}
      </div>
    </div>
  )
}
