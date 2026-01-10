import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useUser } from '@clerk/tanstack-react-start'
import { useGameStore } from '@/stores/gameStore'
import { Id } from '../../../convex/_generated/dataModel'

const RARITY_COLORS: Record<string, string> = {
  common: 'border-gray-400 text-gray-300',
  uncommon: 'border-green-400 text-green-300',
  rare: 'border-blue-400 text-blue-300',
  legendary: 'border-purple-400 text-purple-300',
  mythical: 'border-pink-400 text-pink-300',
  divine: 'border-yellow-400 text-yellow-300',
  prismatic: 'border-cyan-400 text-cyan-300',
  transcendent: 'border-orange-400 text-orange-300',
  holographic: 'border-white text-white bg-white/10 animate-pulse',
}

interface SelectedCard {
  inventoryId: string
  cardId: string
  cardName: string
  rarity: string
}

export function TradeInitiateDialog() {
  const { user } = useUser()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<{ clerkId: string; username: string } | null>(null)
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([])
  const [coinAmount, setCoinAmount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'search' | 'offer'>('search')

  const setTradeInitiateDialogOpen = useGameStore((state) => state.setTradeInitiateDialogOpen)
  const setTradeRequestId = useGameStore((state) => state.setTradeRequestId)
  const setTradePartner = useGameStore((state) => state.setTradePartner)

  const searchResults = useQuery(
    api.trading.searchUsersByUsername,
    user?.id && searchQuery.length >= 1
      ? { clerkId: user.id, searchQuery }
      : 'skip'
  )

  const inventory = useQuery(
    api.inventory.getUserInventory,
    user?.id ? { clerkId: user.id } : 'skip'
  )

  const userCoins = useQuery(
    api.trading.getUserCoins,
    user?.id ? { clerkId: user.id } : 'skip'
  )

  const sendTradeRequest = useMutation(api.trading.sendTradeRequest)

  const handleClose = useCallback(() => {
    setTradeInitiateDialogOpen(false)
  }, [setTradeInitiateDialogOpen])

  const handleSelectUser = (selectedUser: { clerkId: string; username: string }) => {
    setSelectedUser(selectedUser)
    setStep('offer')
    setSearchQuery('')
  }

  const handleBack = () => {
    setStep('search')
    setSelectedUser(null)
    setSelectedCards([])
    setCoinAmount(0)
    setError(null)
  }

  const toggleCardSelection = (card: { inventoryId: string; cardId: string; card: { name: string; rarity: string } }) => {
    const exists = selectedCards.find((c) => c.inventoryId === card.inventoryId)
    if (exists) {
      setSelectedCards(selectedCards.filter((c) => c.inventoryId !== card.inventoryId))
    } else {
      setSelectedCards([
        ...selectedCards,
        {
          inventoryId: card.inventoryId,
          cardId: card.cardId,
          cardName: card.card.name,
          rarity: card.card.rarity,
        },
      ])
    }
  }

  const handleSendRequest = async () => {
    if (!user?.id || !selectedUser) return

    // Allow sending even with empty offer (request style trade)
    if (selectedCards.length === 0 && coinAmount === 0) {
      // This is a "request" style trade where you ask for something
    }

    if (coinAmount > (userCoins ?? 0)) {
      setError("You don't have enough coins")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await sendTradeRequest({
        clerkId: user.id,
        targetClerkId: selectedUser.clerkId,
        initialOffer: {
          cards: selectedCards.map((c) => ({
            inventoryId: c.inventoryId,
            cardId: c.cardId as Id<"cards">,
            cardName: c.cardName,
            rarity: c.rarity,
          })),
          coins: coinAmount,
        },
      })

      // Success - move to waiting state
      setTradeRequestId(result.requestId)
      setTradePartner(selectedUser)
      setTradeInitiateDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send trade request')
    } finally {
      setLoading(false)
    }
  }

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (step === 'offer') {
          handleBack()
        } else {
          handleClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose, step])

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative bg-gray-900/95 border-2 border-emerald-500 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl shadow-emerald-500/20 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-emerald-400 text-xl font-bold">
              {step === 'search' ? 'Start a Trade' : `Trade with ${selectedUser?.username}`}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white text-xl"
            >
              ×
            </button>
          </div>
          {step === 'offer' && (
            <button
              onClick={handleBack}
              className="text-gray-400 hover:text-emerald-400 text-sm mt-1"
            >
              ← Back to search
            </button>
          )}
        </div>

        {step === 'search' ? (
          <>
            {/* Search Input */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm mb-1 block">Search for a player</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type a username..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                autoFocus
              />
            </div>

            {/* Search Results */}
            <div className="space-y-2">
              {searchQuery.length >= 1 && searchResults && searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <button
                    key={result.clerkId}
                    onClick={() => handleSelectUser(result)}
                    className="w-full flex items-center gap-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 hover:border-emerald-500 rounded-lg px-4 py-3 transition-all text-left"
                  >
                    <span className="text-2xl">👤</span>
                    <span className="text-white font-medium">{result.username}</span>
                  </button>
                ))
              ) : searchQuery.length >= 1 && searchResults?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No players found</p>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Start typing to search for players
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Offer Configuration */}
            <div className="space-y-4">
              {/* Coins */}
              <div>
                <label className="text-gray-400 text-sm mb-1 block">
                  Coins to offer ({userCoins ?? 0} available)
                </label>
                <input
                  type="number"
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  min={0}
                  max={userCoins ?? 0}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Cards */}
              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Cards to offer ({selectedCards.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto bg-gray-800/50 rounded-lg p-2 space-y-1">
                  {inventory && inventory.length > 0 ? (
                    inventory.map((item) => {
                      const isSelected = selectedCards.some((c) => c.inventoryId === item.inventoryId)
                      const rarityClass = RARITY_COLORS[item.card?.rarity ?? 'common'] ?? RARITY_COLORS.common
                      return (
                        <button
                          key={item.inventoryId}
                          onClick={() => toggleCardSelection({
                            inventoryId: item.inventoryId,
                            cardId: item.cardId as unknown as string,
                            card: { name: item.card?.name ?? '', rarity: item.card?.rarity ?? 'common' },
                          })}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded border ${
                            isSelected
                              ? 'bg-emerald-900/50 border-emerald-500'
                              : `bg-gray-700/50 hover:bg-gray-600/50 ${rarityClass}`
                          } transition-all`}
                        >
                          <span className="text-white text-sm">{item.card?.name}</span>
                          <span className={`text-xs ${rarityClass}`}>{item.card?.rarity}</span>
                        </button>
                      )
                    })
                  ) : (
                    <p className="text-gray-500 text-center py-4">No cards in inventory</p>
                  )}
                </div>
              </div>

              {/* Selected Cards Preview */}
              {selectedCards.length > 0 && (
                <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3">
                  <p className="text-emerald-400 text-sm font-medium mb-2">Your Offer:</p>
                  {coinAmount > 0 && (
                    <p className="text-yellow-400 text-sm">💰 {coinAmount} PattyCoins</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedCards.map((card) => (
                      <span
                        key={card.inventoryId}
                        className={`text-xs px-2 py-1 rounded border ${RARITY_COLORS[card.rarity] ?? RARITY_COLORS.common}`}
                      >
                        {card.cardName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              {/* Send Button */}
              <button
                onClick={handleSendRequest}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
              >
                {loading ? 'Sending...' : 'Send Trade Request'}
              </button>

              <p className="text-gray-500 text-xs text-center">
                You can send an empty offer to request items from {selectedUser?.username}
              </p>
            </div>
          </>
        )}

        <p className="text-gray-500 text-xs text-center mt-4">Press ESC to close</p>
      </div>
    </div>
  )
}
