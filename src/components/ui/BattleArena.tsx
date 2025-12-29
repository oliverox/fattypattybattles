import { useState, useEffect, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { useUser } from '@clerk/tanstack-react-start'
import { api } from '../../../convex/_generated/api'
import { useGameStore } from '@/stores/gameStore'
import { Id } from '../../../convex/_generated/dataModel'

const RARITY_COLORS: Record<string, string> = {
  common: 'border-gray-400 bg-gray-900',
  uncommon: 'border-green-400 bg-green-900/30',
  rare: 'border-blue-400 bg-blue-900/30',
  legendary: 'border-purple-400 bg-purple-900/30',
  mythical: 'border-pink-400 bg-pink-900/30',
  divine: 'border-yellow-400 bg-yellow-900/30',
  prismatic: 'border-cyan-400 bg-gradient-to-br from-cyan-900/30 to-purple-900/30',
  transcendent: 'border-orange-400 bg-gradient-to-br from-orange-900/30 to-red-900/30',
  secret: 'border-red-400 bg-gradient-to-br from-red-900/30 to-black',
}

type BattlePhase = 'intro' | 'round' | 'result' | 'final'

interface RoundResult {
  round: number
  playerCard: { name: string; attack: number; defense: number; currentDefense: number }
  npcCard: { name: string; attack: number; defense: number; currentDefense: number }
  winner: 'player' | 'npc' | 'draw'
  damage: number
}

export function BattleArena() {
  const { user } = useUser()
  const battleArenaOpen = useGameStore((state) => state.battleArenaOpen)
  const battleData = useGameStore((state) => state.battleData)
  const battleResult = useGameStore((state) => state.battleResult)
  const setBattleResult = useGameStore((state) => state.setBattleResult)
  const closeBattleUI = useGameStore((state) => state.closeBattleUI)

  const [phase, setPhase] = useState<BattlePhase>('intro')
  const [currentRound, setCurrentRound] = useState(0)
  const [roundResults, setRoundResults] = useState<RoundResult[]>([])
  const [isResolving, setIsResolving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolveBattle = useMutation(api.battle.resolveBattle)

  // Define resolveBattleAsync BEFORE the useEffect that uses it
  const resolveBattleAsync = useCallback(async () => {
    if (!user?.id || !battleData) {
      console.log('[Battle] resolveBattleAsync skipped - missing data:', { hasUser: !!user?.id, hasBattleData: !!battleData })
      return
    }

    console.log('[Battle] Starting resolveBattle mutation...')
    setIsResolving(true)
    setError(null)

    try {
      const mutationArgs = {
        clerkId: user.id,
        playerCards: battleData.playerCards.map((c) => ({
          cardId: c.cardId as Id<'cards'>,
          name: c.name,
          attack: c.attack,
          defense: c.defense,
          rarity: c.rarity,
          position: c.position,
        })),
        npcCards: battleData.npcCards.map((c) => ({
          cardId: c.cardId as Id<'cards'>,
          name: c.name,
          attack: c.attack,
          defense: c.defense,
          rarity: c.rarity,
          position: c.position,
        })),
      }

      console.log('[Battle] Mutation args:', JSON.stringify(mutationArgs, null, 2))

      const result = await resolveBattle(mutationArgs)

      console.log('[Battle] Mutation completed successfully!')
      console.log('[Battle] Result:', JSON.stringify(result, null, 2))

      setBattleResult(result)
      setRoundResults(result.rounds)

      // Start animation sequence
      setTimeout(() => setPhase('round'), 1500)
    } catch (err) {
      console.error('[Battle] Resolution failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Battle failed - unknown error'
      console.error('[Battle] Error message:', errorMessage)
      setError(errorMessage)
    } finally {
      setIsResolving(false)
    }
  }, [user, battleData, resolveBattle, setBattleResult])

  // Start battle resolution when arena opens
  useEffect(() => {
    if (battleArenaOpen && battleData && !battleResult && !isResolving) {
      console.log('[Battle] Arena opened, starting battle resolution...')
      console.log('[Battle] battleData:', JSON.stringify(battleData, null, 2))
      setPhase('intro')
      setCurrentRound(0)
      setRoundResults([])
      resolveBattleAsync()
    }
  }, [battleArenaOpen, battleData, battleResult, isResolving, resolveBattleAsync])

  // Advance through rounds
  useEffect(() => {
    if (phase === 'round' && roundResults.length > 0) {
      if (currentRound < roundResults.length) {
        // Show round result for 2 seconds, then advance
        const timer = setTimeout(() => {
          setPhase('result')
        }, 1500)
        return () => clearTimeout(timer)
      }
    }
  }, [phase, currentRound, roundResults])

  useEffect(() => {
    if (phase === 'result') {
      const timer = setTimeout(() => {
        if (currentRound < roundResults.length - 1) {
          setCurrentRound((r) => r + 1)
          setPhase('round')
        } else {
          setPhase('final')
        }
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [phase, currentRound, roundResults])

  const handleClose = useCallback(() => {
    closeBattleUI()
  }, [closeBattleUI])

  if (!battleArenaOpen || !battleData) {
    return null
  }

  const currentRoundData = roundResults[currentRound]
  const firstPlayerCard = battleData.playerCards[0]
  const firstNpcCard = battleData.npcCards[0]

  // Guard against empty arrays (shouldn't happen in practice)
  if (!firstPlayerCard || !firstNpcCard) {
    return null
  }

  const playerCard = phase === 'intro'
    ? firstPlayerCard
    : battleData.playerCards.find((c) => c.position === currentRound + 1) ?? firstPlayerCard
  const npcCard = phase === 'intro'
    ? firstNpcCard
    : battleData.npcCards.find((c) => c.position === currentRound + 1) ?? firstNpcCard

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Arena */}
      <div className="relative w-full max-w-4xl mx-4">
        {/* Error display */}
        {error && (
          <div className="bg-red-900/95 border-2 border-red-500 rounded-xl p-6 text-center">
            <h2 className="text-red-400 text-xl font-bold mb-2">Battle Error</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={handleClose}
              className="bg-red-600 hover:bg-red-500 text-white py-2 px-6 rounded-lg"
            >
              Close
            </button>
          </div>
        )}

        {/* Phase: Intro */}
        {phase === 'intro' && !error && (
          <div className="text-center animate-pulse">
            <h1 className="text-4xl font-bold text-red-400 mb-4">BATTLE!</h1>
            <p className="text-gray-400">Preparing for combat...</p>
          </div>
        )}

        {/* Phase: Round or Result */}
        {(phase === 'round' || phase === 'result') && currentRoundData && (
          <div className="bg-gray-900/95 border-2 border-red-500 rounded-xl p-6 shadow-2xl">
            {/* Round indicator */}
            <div className="text-center mb-6">
              <span className="text-red-400 text-xl font-bold">Round {currentRound + 1}</span>
            </div>

            {/* Battle display */}
            <div className="flex items-center justify-between gap-4">
              {/* Player card */}
              <div className={`flex-1 border-2 rounded-lg p-4 transition-all ${
                RARITY_COLORS[playerCard.rarity] || RARITY_COLORS.common
              } ${phase === 'result' && currentRoundData.winner === 'player' ? 'ring-4 ring-green-400' : ''}`}>
                <div className="text-center">
                  <span className="text-xs text-cyan-400 uppercase">Your Card</span>
                  <h3 className="text-white font-bold text-lg mt-1">{currentRoundData.playerCard.name}</h3>
                  <div className="flex justify-center gap-4 mt-3">
                    <div className="text-center">
                      <span className="text-red-400 text-2xl font-bold">{currentRoundData.playerCard.attack}</span>
                      <p className="text-xs text-gray-400">ATK</p>
                    </div>
                    <div className="text-center">
                      <span className="text-blue-400 text-2xl font-bold">
                        {phase === 'result' ? currentRoundData.playerCard.currentDefense : currentRoundData.playerCard.defense}
                      </span>
                      <p className="text-xs text-gray-400">DEF</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* VS indicator */}
              <div className="text-4xl font-bold text-yellow-400 animate-pulse">VS</div>

              {/* NPC card */}
              <div className={`flex-1 border-2 rounded-lg p-4 transition-all ${
                RARITY_COLORS[npcCard.rarity] || RARITY_COLORS.common
              } ${phase === 'result' && currentRoundData.winner === 'npc' ? 'ring-4 ring-red-500' : ''}`}>
                <div className="text-center">
                  <span className="text-xs text-red-400 uppercase">Enemy Card</span>
                  <h3 className="text-white font-bold text-lg mt-1">{currentRoundData.npcCard.name}</h3>
                  <div className="flex justify-center gap-4 mt-3">
                    <div className="text-center">
                      <span className="text-red-400 text-2xl font-bold">{currentRoundData.npcCard.attack}</span>
                      <p className="text-xs text-gray-400">ATK</p>
                    </div>
                    <div className="text-center">
                      <span className="text-blue-400 text-2xl font-bold">
                        {phase === 'result' ? currentRoundData.npcCard.currentDefense : currentRoundData.npcCard.defense}
                      </span>
                      <p className="text-xs text-gray-400">DEF</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Round result */}
            {phase === 'result' && (
              <div className={`mt-6 text-center p-4 rounded-lg ${
                currentRoundData.winner === 'player'
                  ? 'bg-green-900/50 border border-green-500'
                  : currentRoundData.winner === 'npc'
                  ? 'bg-red-900/50 border border-red-500'
                  : 'bg-yellow-900/50 border border-yellow-500'
              }`}>
                <span className={`text-xl font-bold ${
                  currentRoundData.winner === 'player'
                    ? 'text-green-400'
                    : currentRoundData.winner === 'npc'
                    ? 'text-red-400'
                    : 'text-yellow-400'
                }`}>
                  {currentRoundData.winner === 'player' ? 'You Win This Round!' :
                   currentRoundData.winner === 'npc' ? 'Enemy Wins This Round!' : 'Draw!'}
                </span>
              </div>
            )}

            {/* Score tracker */}
            <div className="mt-4 flex justify-center gap-8">
              <div className="text-center">
                <span className="text-gray-400 text-xs">You</span>
                <div className="text-2xl font-bold text-cyan-400">
                  {roundResults.slice(0, currentRound + (phase === 'result' ? 1 : 0)).filter((r) => r.winner === 'player').length}
                </div>
              </div>
              <div className="text-center">
                <span className="text-gray-400 text-xs">Enemy</span>
                <div className="text-2xl font-bold text-red-400">
                  {roundResults.slice(0, currentRound + (phase === 'result' ? 1 : 0)).filter((r) => r.winner === 'npc').length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase: Final */}
        {phase === 'final' && battleResult && (
          <div className="bg-gray-900/95 border-2 border-red-500 rounded-xl p-8 shadow-2xl text-center">
            {/* Victory/Defeat banner */}
            <div className={`mb-6 ${battleResult.winner === 'player' ? 'animate-bounce' : ''}`}>
              <h1 className={`text-5xl font-bold ${
                battleResult.winner === 'player' ? 'text-green-400' : 'text-red-400'
              }`}>
                {battleResult.winner === 'player' ? 'VICTORY!' : 'DEFEAT'}
              </h1>
            </div>

            {/* Score */}
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <span className="text-gray-400">You</span>
                <div className="text-3xl font-bold text-cyan-400">{battleResult.playerWins}</div>
              </div>
              <div className="text-4xl text-gray-600">-</div>
              <div className="text-center">
                <span className="text-gray-400">Enemy</span>
                <div className="text-3xl font-bold text-red-400">{battleResult.npcWins}</div>
              </div>
            </div>

            {/* Rewards */}
            {battleResult.winner === 'player' && (
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <h3 className="text-yellow-400 font-bold mb-3">Rewards</h3>
                <div className="flex justify-center gap-6">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-yellow-400">+{battleResult.coinsWon}</span>
                    <p className="text-gray-400 text-sm">PattyCoins</p>
                  </div>
                  {battleResult.packWon && (
                    <div className="text-center">
                      <span className="text-3xl font-bold text-purple-400">+1</span>
                      <p className="text-gray-400 text-sm capitalize">{battleResult.packWon} Pack</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {battleResult.winner === 'npc' && (
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <p className="text-gray-400">Better luck next time! You lost your entry fee.</p>
              </div>
            )}

            {/* New balance */}
            <p className="text-gray-400 mb-6">
              Current Balance: <span className="text-yellow-400 font-bold">{battleResult.newBalance} PattyCoins</span>
            </p>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="bg-red-600 hover:bg-red-500 text-white py-3 px-8 rounded-lg transition-colors font-bold text-lg"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
