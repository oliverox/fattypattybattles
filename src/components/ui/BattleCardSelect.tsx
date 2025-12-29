import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
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

interface SelectedCard {
  cardId: string
  position: number
}

export function BattleCardSelect() {
  const { user } = useUser()
  const battleCardSelectOpen = useGameStore((state) => state.battleCardSelectOpen)
  const setBattleCardSelectOpen = useGameStore((state) => state.setBattleCardSelectOpen)
  const setBattleArenaOpen = useGameStore((state) => state.setBattleArenaOpen)
  const setBattleData = useGameStore((state) => state.setBattleData)
  const closeBattleUI = useGameStore((state) => state.closeBattleUI)

  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([])
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState('')

  const playerCards = useQuery(
    api.battle.getPlayerCards,
    user?.id ? { clerkId: user.id } : 'skip'
  )

  const startBattle = useMutation(api.battle.startBattle)

  // Reset selection when modal opens
  useEffect(() => {
    if (battleCardSelectOpen) {
      setSelectedCards([])
      setError('')
      setIsStarting(false)
    }
  }, [battleCardSelectOpen])

  const handleSelectCard = useCallback((cardId: string) => {
    setSelectedCards((prev) => {
      // If card is already selected, remove it
      const existing = prev.find((c) => c.cardId === cardId)
      if (existing) {
        // Remove and reorder positions
        return prev
          .filter((c) => c.cardId !== cardId)
          .map((c, i) => ({ ...c, position: i + 1 }))
      }

      // If we have 3 cards, don't add more
      if (prev.length >= 3) {
        return prev
      }

      // Add with next position
      return [...prev, { cardId, position: prev.length + 1 }]
    })
  }, [])

  const handleStrongest = useCallback(() => {
    if (!playerCards) return

    // Sort by attack + defense and pick top 3
    const sorted = [...playerCards].sort(
      (a, b) => (b.attack + b.defense) - (a.attack + a.defense)
    )
    const top3 = sorted.slice(0, 3).map((card, i) => ({
      cardId: card.cardId,
      position: i + 1,
    }))
    setSelectedCards(top3)
  }, [playerCards])

  const handleRandom = useCallback(() => {
    if (!playerCards || playerCards.length < 3) return

    // Shuffle and pick 3
    const shuffled = [...playerCards].sort(() => Math.random() - 0.5)
    const random3 = shuffled.slice(0, 3).map((card, i) => ({
      cardId: card.cardId,
      position: i + 1,
    }))
    setSelectedCards(random3)
  }, [playerCards])

  const handleStartBattle = useCallback(async () => {
    if (!user?.id || selectedCards.length !== 3) return

    setIsStarting(true)
    setError('')

    try {
      const result = await startBattle({
        clerkId: user.id,
        selectedCards: selectedCards.map((c) => ({
          cardId: c.cardId as Id<'cards'>,
          position: c.position,
        })),
      })

      setBattleData({
        playerCards: result.playerCards.map((c) => ({
          ...c,
          cardId: c.cardId as string,
        })),
        npcCards: result.npcCards.map((c) => ({
          ...c,
          cardId: c.cardId as string,
        })),
        battleId: result.battleId,
      })
      setBattleCardSelectOpen(false)
      setBattleArenaOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start battle')
      setIsStarting(false)
    }
  }, [user, selectedCards, startBattle, setBattleData, setBattleCardSelectOpen, setBattleArenaOpen])

  const handleClose = useCallback(() => {
    closeBattleUI()
  }, [closeBattleUI])

  useEffect(() => {
    if (!battleCardSelectOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [battleCardSelectOpen, handleClose])

  if (!battleCardSelectOpen) {
    return null
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-gray-900/95 border-2 border-red-500 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl shadow-red-500/20 flex flex-col">
        <h2 className="text-red-400 text-2xl font-bold mb-4">Select Your Battle Cards</h2>

        {/* Selection slots */}
        <div className="flex gap-4 mb-4">
          {[1, 2, 3].map((position) => {
            const selected = selectedCards.find((c) => c.position === position)
            const card = selected
              ? playerCards?.find((c) => c.cardId === selected.cardId)
              : null

            return (
              <div
                key={position}
                className={`flex-1 border-2 rounded-lg p-3 min-h-[120px] flex flex-col items-center justify-center
                  ${card
                    ? `${RARITY_COLORS[card.rarity] || RARITY_COLORS.common}`
                    : 'border-dashed border-gray-600 bg-gray-800/50'
                  }`}
              >
                {card ? (
                  <>
                    <span className="text-xs text-gray-400 mb-1">#{position}</span>
                    <span className="text-white font-bold text-sm text-center">{card.name}</span>
                    <div className="flex gap-2 mt-2 text-xs">
                      <span className="text-red-400">ATK: {card.attack}</span>
                      <span className="text-blue-400">DEF: {card.defense}</span>
                    </div>
                    <button
                      onClick={() => handleSelectCard(card.cardId)}
                      className="mt-2 text-xs text-gray-400 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-gray-500 text-sm">Slot {position}</span>
                    <span className="text-gray-600 text-xs">Select a card</span>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleStrongest}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded-lg transition-colors font-bold"
          >
            Strongest
          </button>
          <button
            onClick={handleRandom}
            disabled={!playerCards || playerCards.length < 3}
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors font-bold"
          >
            Random
          </button>
        </div>

        {/* Card grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <h3 className="text-gray-400 text-sm mb-2">Your Cards</h3>
          {playerCards && playerCards.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {playerCards.map((card) => {
                const isSelected = selectedCards.some((c) => c.cardId === card.cardId)
                const position = selectedCards.find((c) => c.cardId === card.cardId)?.position

                return (
                  <button
                    key={card.inventoryId}
                    onClick={() => handleSelectCard(card.cardId)}
                    className={`relative border-2 rounded-lg p-2 transition-all hover:scale-105
                      ${RARITY_COLORS[card.rarity] || RARITY_COLORS.common}
                      ${isSelected ? 'ring-2 ring-red-400 ring-offset-2 ring-offset-gray-900' : ''}
                    `}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {position}
                      </div>
                    )}
                    <div className="text-white text-xs font-bold truncate">{card.name}</div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-red-400">{card.attack}</span>
                      <span className="text-blue-400">{card.defense}</span>
                    </div>
                    <div className="text-gray-500 text-xs mt-1">x{card.quantity}</div>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No cards in inventory</p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mt-4">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Start battle button */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleStartBattle}
            disabled={selectedCards.length !== 3 || isStarting}
            className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors font-bold"
          >
            {isStarting ? 'Starting...' : `Start Battle (${selectedCards.length}/3)`}
          </button>
        </div>

        {/* Close hint */}
        <p className="text-gray-500 text-sm mt-2 text-center">
          Press <span className="text-gray-400">ESC</span> to cancel
        </p>
      </div>
    </div>
  )
}
