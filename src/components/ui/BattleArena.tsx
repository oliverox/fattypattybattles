import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useUser } from '@clerk/tanstack-react-start'
import { api } from '../../../convex/_generated/api'
import { useGameStore } from '@/stores/gameStore'
import { Id } from '../../../convex/_generated/dataModel'

type PvpRequestId = Id<"pvpBattleRequests">

const RARITY_COLORS: Record<string, string> = {
  common: 'border-gray-400 bg-gray-900',
  uncommon: 'border-green-400 bg-green-900/30',
  rare: 'border-blue-400 bg-blue-900/30',
  legendary: 'border-purple-400 bg-purple-900/30',
  mythical: 'border-pink-400 bg-pink-900/30',
  divine: 'border-yellow-400 bg-yellow-900/30',
  prismatic: 'border-cyan-400 bg-gradient-to-br from-cyan-900/30 to-purple-900/30',
  transcendent: 'border-orange-400 bg-gradient-to-br from-orange-900/30 to-red-900/30',
  holographic: 'border-white bg-gradient-to-br from-white/20 to-black animate-pulse',
}

type BattlePhase = 'intro' | 'round' | 'coinflip' | 'result' | 'final'

interface RoundResult {
  round: number
  playerCard: { cardId: string; name: string; attack: number; defense: number; rarity: string; position: number; currentDefense: number; startingDefense: number; isSurvivor?: boolean }
  npcCard: { cardId: string; name: string; attack: number; defense: number; rarity: string; position: number; currentDefense: number; startingDefense: number; isSurvivor?: boolean }
  winner: 'player' | 'npc' | 'draw'
  damage: number
  coinFlip?: boolean
}

export function BattleArena() {
  const { user } = useUser()
  const battleArenaOpen = useGameStore((state) => state.battleArenaOpen)
  const battleData = useGameStore((state) => state.battleData)
  const battleResult = useGameStore((state) => state.battleResult)
  const setBattleResult = useGameStore((state) => state.setBattleResult)
  const closeBattleUI = useGameStore((state) => state.closeBattleUI)

  // PvP state
  const isPvpBattle = useGameStore((state) => state.isPvpBattle)
  const pvpBattleRequestId = useGameStore((state) => state.pvpBattleRequestId)
  const pvpOpponentUsername = useGameStore((state) => state.pvpOpponentUsername)
  const pvpBattleResult = useGameStore((state) => state.pvpBattleResult)
  const setPvpBattleResult = useGameStore((state) => state.setPvpBattleResult)
  const closePvpUI = useGameStore((state) => state.closePvpUI)

  const [phase, setPhase] = useState<BattlePhase>('intro')
  const [currentRound, setCurrentRound] = useState(0)
  const [roundResults, setRoundResults] = useState<RoundResult[]>([])
  const [isResolving, setIsResolving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Query PvP request status to get card data
  const pvpRequestStatus = useQuery(
    api.pvpBattle.getBattleRequestStatus,
    isPvpBattle && pvpBattleRequestId
      ? { requestId: pvpBattleRequestId as PvpRequestId }
      : 'skip'
  )

  const resolveBattle = useMutation(api.battle.resolveBattle)
  const resolvePvpBattle = useMutation(api.pvpBattle.resolvePvpBattle)

  // Define resolveBattleAsync BEFORE the useEffect that uses it
  const resolveBattleAsync = useCallback(async () => {
    if (isPvpBattle) {
      // PvP battle resolution
      if (!pvpBattleRequestId) {
        console.log('[PvP Battle] skipped - missing requestId')
        return
      }

      console.log('[PvP Battle] Starting resolvePvpBattle mutation...')
      setIsResolving(true)
      setError(null)

      try {
        const result = await resolvePvpBattle({
          requestId: pvpBattleRequestId as PvpRequestId,
        })

        console.log('[PvP Battle] Mutation completed successfully!')

        setPvpBattleResult(result)

        // Convert PvP round results to standard format for display
        // Determine if current user is challenger or target
        const isChallenger = result.winnerId === user?.id
          ? result.winnerRole === 'challenger'
          : result.winnerRole === 'target'

        const convertedRounds: RoundResult[] = result.rounds.map((r) => {
          const pCard = isChallenger ? r.challengerCard : r.targetCard
          const oCard = isChallenger ? r.targetCard : r.challengerCard
          // Type assertion for startingDefense and isSurvivor which are added by the updated backend
          const pStartingDef = (pCard as { startingDefense?: number }).startingDefense ?? pCard.defense
          const oStartingDef = (oCard as { startingDefense?: number }).startingDefense ?? oCard.defense
          const pIsSurvivor = (pCard as { isSurvivor?: boolean }).isSurvivor ?? false
          const oIsSurvivor = (oCard as { isSurvivor?: boolean }).isSurvivor ?? false
          const coinFlip = (r as { coinFlip?: boolean }).coinFlip ?? false
          return {
            round: r.round,
            playerCard: { ...pCard, cardId: pCard.cardId as string, startingDefense: pStartingDef, isSurvivor: pIsSurvivor },
            npcCard: { ...oCard, cardId: oCard.cardId as string, startingDefense: oStartingDef, isSurvivor: oIsSurvivor },
            winner: r.winner === 'draw'
              ? 'draw'
              : (isChallenger
                  ? (r.winner === 'challenger' ? 'player' : 'npc')
                  : (r.winner === 'target' ? 'player' : 'npc')),
            damage: r.damage,
            coinFlip,
          }
        })

        setRoundResults(convertedRounds)

        // Also set regular battleResult for UI compatibility
        const didWin = result.winnerId === user?.id
        setBattleResult({
          winner: didWin ? 'player' : 'npc',
          playerWins: isChallenger ? result.challengerWins : result.targetWins,
          npcWins: isChallenger ? result.targetWins : result.challengerWins,
          rounds: convertedRounds,
          coinsWon: didWin ? result.coinsWon : 0,
          packWon: didWin ? result.packWon : null,
          newBalance: didWin ? result.winnerNewBalance : 0,
        })

        // Start animation sequence
        setTimeout(() => setPhase('round'), 1500)
      } catch (err) {
        console.error('[PvP Battle] Resolution failed:', err)
        const errorMessage = err instanceof Error ? err.message : 'Battle failed - unknown error'
        setError(errorMessage)
      } finally {
        setIsResolving(false)
      }
    } else {
      // NPC battle resolution
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
    }
  }, [user, battleData, isPvpBattle, pvpBattleRequestId, resolveBattle, resolvePvpBattle, setBattleResult, setPvpBattleResult])

  // Start battle resolution when arena opens
  useEffect(() => {
    // For NPC battles, we need battleData. For PvP, we need pvpRequestStatus with both cards submitted.
    const npcReady = !isPvpBattle && battleData && !battleResult && !isResolving
    const pvpReady = isPvpBattle && pvpRequestStatus?.challengerCards && pvpRequestStatus?.targetCards && !pvpBattleResult && !isResolving

    if (battleArenaOpen && (npcReady || pvpReady)) {
      console.log('[Battle] Arena opened, starting battle resolution...', { isPvpBattle, npcReady, pvpReady })
      setPhase('intro')
      setCurrentRound(0)
      setRoundResults([])
      resolveBattleAsync()
    }
  }, [battleArenaOpen, battleData, battleResult, isResolving, resolveBattleAsync, isPvpBattle, pvpRequestStatus, pvpBattleResult])

  // Advance through rounds
  useEffect(() => {
    if (phase === 'round' && roundResults.length > 0) {
      if (currentRound < roundResults.length) {
        const currentResult = roundResults[currentRound]
        // Show round for 1.5 seconds, then show coinflip if needed or result
        const timer = setTimeout(() => {
          if (currentResult?.coinFlip) {
            setPhase('coinflip')
          } else {
            setPhase('result')
          }
        }, 1500)
        return () => clearTimeout(timer)
      }
    }
  }, [phase, currentRound, roundResults])

  // Coinflip animation phase
  useEffect(() => {
    if (phase === 'coinflip') {
      // Show coinflip animation for 2 seconds, then show result
      const timer = setTimeout(() => {
        setPhase('result')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [phase])

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
    if (isPvpBattle) {
      closePvpUI()
    } else {
      closeBattleUI()
    }
  }, [isPvpBattle, closePvpUI, closeBattleUI])

  // For NPC we need battleData, for PvP we need pvpRequestStatus or pvpBattleResult
  const hasNpcData = !isPvpBattle && battleData
  const hasPvpData = isPvpBattle && (pvpRequestStatus || pvpBattleResult)

  if (!battleArenaOpen || (!hasNpcData && !hasPvpData)) {
    return null
  }

  const currentRoundData = roundResults[currentRound]

  // Get card data for display - for intro phase we show placeholder until battle starts
  let playerCard: { name: string; attack: number; defense: number; rarity: string; position: number }
  let npcCard: { name: string; attack: number; defense: number; rarity: string; position: number }

  if (isPvpBattle) {
    // PvP battle - during intro, show placeholder text; during battle show from roundResults
    if (phase === 'intro' || !currentRoundData) {
      playerCard = { name: 'Your Card', attack: 0, defense: 0, rarity: 'common', position: 1 }
      npcCard = { name: `${pvpOpponentUsername || 'Opponent'}'s Card`, attack: 0, defense: 0, rarity: 'common', position: 1 }
    } else {
      playerCard = { ...currentRoundData.playerCard, rarity: 'common', position: currentRound + 1 }
      npcCard = { ...currentRoundData.npcCard, rarity: 'common', position: currentRound + 1 }
    }
  } else {
    // NPC battle
    const firstPlayerCard = battleData!.playerCards[0]
    const firstNpcCard = battleData!.npcCards[0]

    // Guard against empty arrays (shouldn't happen in practice)
    if (!firstPlayerCard || !firstNpcCard) {
      return null
    }

    playerCard = phase === 'intro'
      ? firstPlayerCard
      : battleData!.playerCards.find((c) => c.position === currentRound + 1) ?? firstPlayerCard
    npcCard = phase === 'intro'
      ? firstNpcCard
      : battleData!.npcCards.find((c) => c.position === currentRound + 1) ?? firstNpcCard
  }

  // Theme colors - cyan for PvP, red for NPC
  const borderColor = isPvpBattle ? 'border-cyan-500' : 'border-red-500'
  const opponentName = isPvpBattle ? pvpOpponentUsername || 'Opponent' : 'Enemy'

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
            <h1 className={`text-4xl font-bold mb-4 ${isPvpBattle ? 'text-cyan-400' : 'text-red-400'}`}>
              {isPvpBattle ? `VS ${pvpOpponentUsername}` : 'BATTLE!'}
            </h1>
            <p className="text-gray-400">Preparing for combat...</p>
          </div>
        )}

        {/* Phase: Coinflip */}
        {phase === 'coinflip' && currentRoundData && (
          <div className={`bg-gray-900/95 border-2 ${borderColor} rounded-xl p-8 shadow-2xl`}>
            <div className="text-center mb-6">
              <span className={`text-xl font-bold ${isPvpBattle ? 'text-cyan-400' : 'text-red-400'}`}>Round {currentRound + 1}</span>
            </div>

            {/* Coinflip Animation */}
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-yellow-400 text-lg font-bold mb-6">50/50 Coin Flip!</p>

              {/* Coin */}
              <div className="relative w-28 h-28 perspective-1000">
                <div className={`w-full h-full ${currentRoundData.winner === 'player' ? 'animate-coin-flip-heads' : 'animate-coin-flip-tails'}`}>
                  {/* Coin front (heads - player) */}
                  <div className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 border-4 border-yellow-500 shadow-lg backface-hidden flex items-center justify-center p-2">
                    <span className="text-yellow-900 font-bold text-sm text-center truncate max-w-full">
                      {isPvpBattle ? (user?.username || user?.firstName || 'YOU') : 'YOU'}
                    </span>
                  </div>
                  {/* Coin back (tails - opponent) */}
                  <div className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-gray-300 via-gray-400 to-gray-600 border-4 border-gray-500 shadow-lg backface-hidden rotate-y-180 flex items-center justify-center p-2">
                    <span className="text-gray-900 font-bold text-sm text-center truncate max-w-full">
                      {isPvpBattle ? (pvpOpponentUsername || 'OPP') : 'NPC'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-400 mt-6 animate-pulse">Flipping...</p>
            </div>

            {/* Score tracker */}
            <div className="mt-4 flex justify-center gap-8">
              <div className="text-center">
                <span className="text-gray-400 text-xs">You</span>
                <div className="text-2xl font-bold text-cyan-400">
                  {roundResults.slice(0, currentRound).filter((r) => r.winner === 'player').length}
                </div>
              </div>
              <div className="text-center">
                <span className="text-gray-400 text-xs">{opponentName}</span>
                <div className={`text-2xl font-bold ${isPvpBattle ? 'text-orange-400' : 'text-red-400'}`}>
                  {roundResults.slice(0, currentRound).filter((r) => r.winner === 'npc').length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase: Round or Result */}
        {(phase === 'round' || phase === 'result') && currentRoundData && (
          <div className={`bg-gray-900/95 border-2 ${borderColor} rounded-xl p-6 shadow-2xl`}>
            {/* Round indicator */}
            <div className="text-center mb-6">
              <span className={`text-xl font-bold ${isPvpBattle ? 'text-cyan-400' : 'text-red-400'}`}>Round {currentRound + 1}</span>
            </div>

            {/* Battle display */}
            <div className="flex items-center justify-between gap-4">
              {/* Player card */}
              <div className={`flex-1 border-2 rounded-lg p-4 transition-all ${
                RARITY_COLORS[playerCard.rarity] || RARITY_COLORS.common
              } ${phase === 'result' && currentRoundData.winner === 'player' ? 'ring-4 ring-green-400' : ''}`}>
                <div className="text-center">
                  <span className="text-xs text-cyan-400 uppercase">
                    Your Card {currentRoundData.playerCard.isSurvivor && '(Survivor)'}
                  </span>
                  <h3 className="text-white font-bold text-lg mt-1">{currentRoundData.playerCard.name}</h3>
                  <div className="flex justify-center gap-4 mt-3">
                    <div className="text-center">
                      <span className="text-red-400 text-2xl font-bold">{currentRoundData.playerCard.attack}</span>
                      <p className="text-xs text-gray-400">ATK</p>
                    </div>
                    <div className="text-center">
                      <span className="text-blue-400 text-2xl font-bold">
                        {phase === 'result' ? currentRoundData.playerCard.currentDefense : (currentRoundData.playerCard.startingDefense ?? currentRoundData.playerCard.defense)}
                      </span>
                      <p className="text-xs text-gray-400">DEF</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* VS indicator */}
              <div className="text-4xl font-bold text-yellow-400 animate-pulse">VS</div>

              {/* Opponent card */}
              <div className={`flex-1 border-2 rounded-lg p-4 transition-all ${
                RARITY_COLORS[npcCard.rarity] || RARITY_COLORS.common
              } ${phase === 'result' && currentRoundData.winner === 'npc' ? 'ring-4 ring-red-500' : ''}`}>
                <div className="text-center">
                  <span className={`text-xs uppercase ${isPvpBattle ? 'text-orange-400' : 'text-red-400'}`}>
                    {opponentName}'s Card {currentRoundData.npcCard.isSurvivor && '(Survivor)'}
                  </span>
                  <h3 className="text-white font-bold text-lg mt-1">{currentRoundData.npcCard.name}</h3>
                  <div className="flex justify-center gap-4 mt-3">
                    <div className="text-center">
                      <span className="text-red-400 text-2xl font-bold">{currentRoundData.npcCard.attack}</span>
                      <p className="text-xs text-gray-400">ATK</p>
                    </div>
                    <div className="text-center">
                      <span className="text-blue-400 text-2xl font-bold">
                        {phase === 'result' ? currentRoundData.npcCard.currentDefense : (currentRoundData.npcCard.startingDefense ?? currentRoundData.npcCard.defense)}
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
                   currentRoundData.winner === 'npc' ? `${opponentName} Wins This Round!` : 'Draw!'}
                </span>
                {currentRoundData.coinFlip && (
                  <p className="text-yellow-300 text-sm mt-1 animate-pulse">(50/50 Coin Flip)</p>
                )}
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
                <span className="text-gray-400 text-xs">{opponentName}</span>
                <div className={`text-2xl font-bold ${isPvpBattle ? 'text-orange-400' : 'text-red-400'}`}>
                  {roundResults.slice(0, currentRound + (phase === 'result' ? 1 : 0)).filter((r) => r.winner === 'npc').length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase: Final */}
        {phase === 'final' && battleResult && (
          <div className={`bg-gray-900/95 border-2 ${borderColor} rounded-xl p-8 shadow-2xl text-center`}>
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
                <span className="text-gray-400">{opponentName}</span>
                <div className={`text-3xl font-bold ${isPvpBattle ? 'text-orange-400' : 'text-red-400'}`}>{battleResult.npcWins}</div>
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
                <p className="text-gray-400">
                  {isPvpBattle ? `Better luck next time! ${opponentName} won this battle.` : 'Better luck next time! You lost your entry fee.'}
                </p>
              </div>
            )}

            {/* New balance */}
            {battleResult.winner === 'player' && (
              <p className="text-gray-400 mb-6">
                Current Balance: <span className="text-yellow-400 font-bold">{battleResult.newBalance} PattyCoins</span>
              </p>
            )}

            {/* Close button */}
            <button
              onClick={handleClose}
              className={`${isPvpBattle ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-red-600 hover:bg-red-500'} text-white py-3 px-8 rounded-lg transition-colors font-bold text-lg`}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
