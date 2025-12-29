import { useEffect, useCallback } from 'react'
import { useQuery } from 'convex/react'
import { useUser } from '@clerk/tanstack-react-start'
import { api } from '../../../convex/_generated/api'
import { useGameStore } from '@/stores/gameStore'
import { BATTLE_NPC } from '@/lib/game/constants'

export function BattleDialogue() {
  const { user } = useUser()
  const battleDialogueOpen = useGameStore((state) => state.battleDialogueOpen)
  const setBattleDialogueOpen = useGameStore((state) => state.setBattleDialogueOpen)
  const setBattleCardSelectOpen = useGameStore((state) => state.setBattleCardSelectOpen)

  const canBattleResult = useQuery(
    api.battle.canBattle,
    user?.id ? { clerkId: user.id } : 'skip'
  )

  const handleBattle = useCallback(() => {
    if (canBattleResult?.canBattle) {
      setBattleDialogueOpen(false)
      setBattleCardSelectOpen(true)
    }
  }, [canBattleResult, setBattleDialogueOpen, setBattleCardSelectOpen])

  const handleClose = useCallback(() => {
    setBattleDialogueOpen(false)
  }, [setBattleDialogueOpen])

  useEffect(() => {
    if (!battleDialogueOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
        return
      }

      if (e.key === '1' && canBattleResult?.canBattle) {
        handleBattle()
      } else if (e.key === '2') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [battleDialogueOpen, handleBattle, handleClose, canBattleResult])

  if (!battleDialogueOpen) {
    return null
  }

  const canBattle = canBattleResult?.canBattle ?? false
  const reason = canBattleResult?.reason
  const packChance = canBattleResult?.packChance ?? BATTLE_NPC.packChance
  const battleWins = canBattleResult?.battleWins ?? 0
  const battleLosses = canBattleResult?.battleLosses ?? 0
  const totalBattles = canBattleResult?.totalBattles ?? 0

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Dialogue box */}
      <div className="relative bg-gray-900/95 border-2 border-red-500 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-red-500/20">
        {/* NPC greeting */}
        <div className="mb-6">
          <h2 className="text-red-400 text-xl font-bold mb-2">Battle Bot</h2>
          <p className="text-gray-300">
            Ready for battle? Put your cards to the test against me!
          </p>
        </div>

        {/* Battle info */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Entry Cost:</span>
            <span className="text-yellow-400 font-bold">{BATTLE_NPC.entryCost} PattyCoins</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Cards Required:</span>
            <span className="text-cyan-400 font-bold">{BATTLE_NPC.minCards} cards</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Win Reward:</span>
            <span className="text-green-400 font-bold">{BATTLE_NPC.rewardMin}-{BATTLE_NPC.rewardMax} PattyCoins</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Pack Chance:</span>
            <span className="text-purple-400 font-bold">{Math.round(packChance * 100)}%</span>
          </div>
        </div>

        {/* Battle Stats */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
          <h3 className="text-gray-300 text-sm font-semibold mb-2">Your Battle Stats</h3>
          <div className="flex justify-between gap-4">
            <div className="flex-1 text-center">
              <div className="text-green-400 text-2xl font-bold">{battleWins}</div>
              <div className="text-gray-500 text-xs">Wins</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-red-400 text-2xl font-bold">{battleLosses}</div>
              <div className="text-gray-500 text-xs">Losses</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-cyan-400 text-2xl font-bold">{totalBattles}</div>
              <div className="text-gray-500 text-xs">Total</div>
            </div>
          </div>
        </div>

        {/* Status message */}
        {!canBattle && reason && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm text-center">{reason}</p>
          </div>
        )}

        {/* Options */}
        <div className="space-y-2">
          <button
            onClick={handleBattle}
            disabled={!canBattle}
            className={`w-full flex items-center gap-3 border rounded-lg px-4 py-3 transition-all group
              ${canBattle
                ? 'bg-red-900/50 hover:bg-red-800/50 border-red-500/50 hover:border-red-400'
                : 'bg-gray-800/50 border-gray-600 cursor-not-allowed opacity-50'
              }`}
          >
            <span className={`px-2 py-1 rounded font-mono text-sm ${canBattle ? 'text-red-400 bg-red-400/20' : 'text-gray-500 bg-gray-700'}`}>
              1
            </span>
            <span className={`${canBattle ? 'text-gray-200 group-hover:text-white' : 'text-gray-500'}`}>
              Battle!
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
              Goodbye
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
