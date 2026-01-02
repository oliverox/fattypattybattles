import { useEffect, useCallback, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { useUser } from '@clerk/tanstack-react-start'
import { api } from '../../../convex/_generated/api'
import { useGameStore } from '@/stores/gameStore'
import { PVP_BATTLE } from '@/lib/game/constants'

export function PvpRequestDialog() {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pvpRequestDialogOpen = useGameStore((state) => state.pvpRequestDialogOpen)
  const pvpTargetPlayer = useGameStore((state) => state.pvpTargetPlayer)
  const setPvpRequestDialogOpen = useGameStore((state) => state.setPvpRequestDialogOpen)
  const setPvpTargetPlayer = useGameStore((state) => state.setPvpTargetPlayer)
  const setPvpWaitingForOpponent = useGameStore((state) => state.setPvpWaitingForOpponent)
  const setPvpBattleRequestId = useGameStore((state) => state.setPvpBattleRequestId)

  const canBattleResult = useQuery(
    api.pvpBattle.canPvpBattle,
    user?.id ? { clerkId: user.id } : 'skip'
  )

  const canTargetBattle = useQuery(
    api.pvpBattle.canTargetPvpBattle,
    pvpTargetPlayer?.userId ? { targetUserId: pvpTargetPlayer.userId } : 'skip'
  )

  const sendBattleRequest = useMutation(api.pvpBattle.sendBattleRequest)

  const handleChallenge = useCallback(async () => {
    if (!pvpTargetPlayer || loading) return

    setLoading(true)
    setError(null)

    try {
      const result = await sendBattleRequest({
        targetUserId: pvpTargetPlayer.userId,
      })
      setPvpRequestDialogOpen(false)
      setPvpBattleRequestId(result.requestId)
      setPvpWaitingForOpponent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send challenge')
    } finally {
      setLoading(false)
    }
  }, [pvpTargetPlayer, loading, sendBattleRequest, setPvpRequestDialogOpen, setPvpBattleRequestId, setPvpWaitingForOpponent])

  const handleClose = useCallback(() => {
    setPvpRequestDialogOpen(false)
    setPvpTargetPlayer(null)
    setError(null)
  }, [setPvpRequestDialogOpen, setPvpTargetPlayer])

  useEffect(() => {
    if (!pvpRequestDialogOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
        return
      }

      if (e.key === '1' && canChallenge) {
        handleChallenge()
      } else if (e.key === '2') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pvpRequestDialogOpen, handleChallenge, handleClose])

  if (!pvpRequestDialogOpen || !pvpTargetPlayer) {
    return null
  }

  const myCanBattle = canBattleResult?.canBattle ?? false
  const myReason = canBattleResult?.reason
  const targetCanBattle = canTargetBattle?.canBattle ?? false
  const targetReason = canTargetBattle?.reason

  const canChallenge = myCanBattle && targetCanBattle && !loading

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Dialogue box */}
      <div className="relative bg-gray-900/95 border-2 border-cyan-500 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-cyan-500/20">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-cyan-400 text-xl font-bold mb-2">Challenge Player</h2>
          <p className="text-gray-300">
            Challenge <span className="text-cyan-300 font-bold">{pvpTargetPlayer.username}</span> to a battle!
          </p>
        </div>

        {/* Battle info */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Entry Cost:</span>
            <span className="text-green-400 font-bold">FREE</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Cards Required:</span>
            <span className="text-cyan-400 font-bold">{PVP_BATTLE.minCards} cards each</span>
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

        {/* Status messages */}
        {!myCanBattle && myReason && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm text-center">{myReason}</p>
          </div>
        )}

        {!targetCanBattle && targetReason && (
          <div className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-3 mb-4">
            <p className="text-orange-400 text-sm text-center">{targetReason}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Options */}
        <div className="space-y-2">
          <button
            onClick={handleChallenge}
            disabled={!canChallenge}
            className={`w-full flex items-center gap-3 border rounded-lg px-4 py-3 transition-all group
              ${canChallenge
                ? 'bg-cyan-900/50 hover:bg-cyan-800/50 border-cyan-500/50 hover:border-cyan-400'
                : 'bg-gray-800/50 border-gray-600 cursor-not-allowed opacity-50'
              }`}
          >
            <span className={`px-2 py-1 rounded font-mono text-sm ${canChallenge ? 'text-cyan-400 bg-cyan-400/20' : 'text-gray-500 bg-gray-700'}`}>
              1
            </span>
            <span className={`${canChallenge ? 'text-gray-200 group-hover:text-white' : 'text-gray-500'}`}>
              {loading ? 'Sending...' : 'Challenge to Battle!'}
            </span>
          </button>

          <button
            onClick={handleClose}
            className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-500/50 hover:border-gray-400 rounded-lg px-4 py-3 transition-all group"
          >
            <span className="text-gray-400 bg-gray-700 px-2 py-1 rounded font-mono text-sm">
              2
            </span>
            <span className="text-gray-200 group-hover:text-white">
              Cancel
            </span>
          </button>
        </div>

        {/* Close hint */}
        <p className="text-gray-500 text-sm mt-4 text-center">
          Press <span className="text-gray-400">ESC</span> to close
        </p>
      </div>
    </div>
  )
}
