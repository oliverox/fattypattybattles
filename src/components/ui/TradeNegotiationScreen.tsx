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
  holographic: 'border-red-400 text-red-300 animate-pulse',
}

interface SelectedCard {
  inventoryId: string
  cardId: string
  cardName: string
  rarity: string
}

export function TradeNegotiationScreen() {
  const { user } = useUser()
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([])
  const [coinAmount, setCoinAmount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tradeRequestId = useGameStore((state) => state.tradeRequestId)
  const tradePartner = useGameStore((state) => state.tradePartner)
  const closeTradeUI = useGameStore((state) => state.closeTradeUI)
  const setTradeCompletedOpen = useGameStore((state) => state.setTradeCompletedOpen)
  const setTradeNegotiationOpen = useGameStore((state) => state.setTradeNegotiationOpen)
  const setTradeResult = useGameStore((state) => state.setTradeResult)

  const tradeRequest = useQuery(
    api.trading.getTradeRequestStatus,
    tradeRequestId ? { requestId: tradeRequestId as Id<"tradeRequests"> } : 'skip'
  )

  const inventory = useQuery(
    api.inventory.getUserInventory,
    user?.id ? { clerkId: user.id } : 'skip'
  )

  const userCoins = useQuery(
    api.trading.getUserCoins,
    user?.id ? { clerkId: user.id } : 'skip'
  )

  const updateOffer = useMutation(api.trading.updateOffer)
  const confirmTrade = useMutation(api.trading.confirmTrade)
  const unconfirmTrade = useMutation(api.trading.unconfirmTrade)
  const declineTrade = useMutation(api.trading.declineTradeRequest)

  const isSender = tradeRequest?.senderId === user?.id
  const myOffer = isSender ? tradeRequest?.senderOffer : tradeRequest?.receiverOffer
  const theirOffer = isSender ? tradeRequest?.receiverOffer : tradeRequest?.senderOffer
  const myConfirmed = isSender ? tradeRequest?.senderConfirmed : tradeRequest?.receiverConfirmed
  const theirConfirmed = isSender ? tradeRequest?.receiverConfirmed : tradeRequest?.senderConfirmed
  const partnerUsername = isSender ? tradeRequest?.receiverUsername : tradeRequest?.senderUsername

  // Initialize local state from server state
  useEffect(() => {
    if (myOffer) {
      setSelectedCards(myOffer.cards.map((c) => ({
        inventoryId: c.inventoryId,
        cardId: c.cardId,
        cardName: c.cardName,
        rarity: c.rarity,
      })))
      setCoinAmount(myOffer.coins)
    }
  }, [myOffer?.cards.length, myOffer?.coins])

  // Check for trade completion or decline
  useEffect(() => {
    if (!tradeRequest) return

    if (tradeRequest.status === 'completed') {
      // Trade completed - show success
      setTradeResult({
        partnerUsername: partnerUsername ?? '',
        cardsGiven: (myOffer?.cards ?? []).map((c) => ({
          inventoryId: c.inventoryId,
          cardId: c.cardId,
          cardName: c.cardName,
          rarity: c.rarity,
        })),
        cardsReceived: (theirOffer?.cards ?? []).map((c) => ({
          inventoryId: c.inventoryId,
          cardId: c.cardId,
          cardName: c.cardName,
          rarity: c.rarity,
        })),
        coinsGiven: myOffer?.coins ?? 0,
        coinsReceived: theirOffer?.coins ?? 0,
      })
      setTradeNegotiationOpen(false)
      setTradeCompletedOpen(true)
    } else if (tradeRequest.status === 'declined' || tradeRequest.status === 'cancelled' || tradeRequest.status === 'expired') {
      // Trade cancelled - close UI
      closeTradeUI()
    }
  }, [tradeRequest?.status, closeTradeUI, setTradeCompletedOpen, setTradeNegotiationOpen, setTradeResult, partnerUsername, myOffer, theirOffer])

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

  const handleUpdateOffer = async () => {
    if (!user?.id || !tradeRequestId) return

    if (coinAmount > (userCoins ?? 0)) {
      setError("You don't have enough coins")
      return
    }

    setLoading(true)
    setError(null)

    try {
      await updateOffer({
        clerkId: user.id,
        requestId: tradeRequestId as Id<"tradeRequests">,
        offer: {
          cards: selectedCards.map((c) => ({
            inventoryId: c.inventoryId,
            cardId: c.cardId as Id<"cards">,
            cardName: c.cardName,
            rarity: c.rarity,
          })),
          coins: coinAmount,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update offer')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!user?.id || !tradeRequestId) return

    setLoading(true)
    setError(null)

    try {
      // First update offer to ensure it's synced
      await updateOffer({
        clerkId: user.id,
        requestId: tradeRequestId as Id<"tradeRequests">,
        offer: {
          cards: selectedCards.map((c) => ({
            inventoryId: c.inventoryId,
            cardId: c.cardId as Id<"cards">,
            cardName: c.cardName,
            rarity: c.rarity,
          })),
          coins: coinAmount,
        },
      })

      // Then confirm
      await confirmTrade({
        clerkId: user.id,
        requestId: tradeRequestId as Id<"tradeRequests">,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm trade')
    } finally {
      setLoading(false)
    }
  }

  const handleUnconfirm = async () => {
    if (!user?.id || !tradeRequestId) return

    setLoading(true)
    try {
      await unconfirmTrade({
        clerkId: user.id,
        requestId: tradeRequestId as Id<"tradeRequests">,
      })
    } catch (err) {
      console.error('Failed to unconfirm:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDecline = async () => {
    if (!user?.id || !tradeRequestId) return

    setLoading(true)
    try {
      await declineTrade({
        clerkId: user.id,
        requestId: tradeRequestId as Id<"tradeRequests">,
      })
      closeTradeUI()
    } catch (err) {
      console.error('Failed to decline:', err)
    } finally {
      setLoading(false)
    }
  }

  // Check for changes in local vs server offer
  const hasUnsavedChanges = useCallback(() => {
    if (!myOffer) return false
    if (coinAmount !== myOffer.coins) return true
    if (selectedCards.length !== myOffer.cards.length) return true
    return selectedCards.some((c) => !myOffer.cards.find((mc) => mc.inventoryId === c.inventoryId))
  }, [coinAmount, selectedCards, myOffer])

  // Time remaining
  const timeLeft = tradeRequest ? Math.max(0, Math.ceil((tradeRequest.expiresAt - Date.now()) / 1000)) : 0
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!tradeRequest || tradeRequest.status !== 'negotiating') {
    return null
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80">
      <div className="relative bg-gray-900 border-2 border-emerald-500 rounded-xl p-6 max-w-4xl w-full mx-4 shadow-2xl shadow-emerald-500/20 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-emerald-400 text-2xl font-bold">
            Trading with {partnerUsername}
          </h2>
          <div className="flex items-center gap-4">
            <div className={`text-lg font-mono font-bold ${timeLeft <= 60 ? 'text-red-400' : 'text-emerald-400'}`}>
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={handleDecline}
              disabled={loading}
              className="text-red-400 hover:text-red-300 bg-red-900/30 hover:bg-red-900/50 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel Trade
            </button>
          </div>
        </div>

        {/* Trade Area - Split View */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Your Offer */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-emerald-500/30">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-emerald-400 font-bold">Your Offer</h3>
              {myConfirmed && (
                <span className="text-green-400 text-sm bg-green-900/30 px-2 py-1 rounded">
                  Ready!
                </span>
              )}
            </div>

            {/* Coins Input */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm mb-1 block">
                Coins ({userCoins ?? 0} available)
              </label>
              <input
                type="number"
                value={coinAmount}
                onChange={(e) => setCoinAmount(Math.max(0, parseInt(e.target.value) || 0))}
                min={0}
                max={userCoins ?? 0}
                disabled={myConfirmed}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* Card Selection */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">
                Cards ({selectedCards.length} selected)
              </label>
              <div className="max-h-40 overflow-y-auto bg-gray-700/50 rounded-lg p-2 space-y-1">
                {inventory && inventory.length > 0 ? (
                  inventory.map((item) => {
                    const isSelected = selectedCards.some((c) => c.inventoryId === item.inventoryId)
                    const rarityClass = RARITY_COLORS[item.card?.rarity ?? 'common'] ?? RARITY_COLORS.common
                    return (
                      <button
                        key={item.inventoryId}
                        onClick={() => !myConfirmed && toggleCardSelection({
                          inventoryId: item.inventoryId,
                          cardId: item.cardId as unknown as string,
                          card: { name: item.card?.name ?? '', rarity: item.card?.rarity ?? 'common' },
                        })}
                        disabled={myConfirmed}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded border ${
                          isSelected
                            ? 'bg-emerald-900/50 border-emerald-500'
                            : `bg-gray-600/50 hover:bg-gray-500/50 ${rarityClass}`
                        } transition-all disabled:opacity-50`}
                      >
                        <span className="text-white text-sm">{item.card?.name}</span>
                        <span className={`text-xs ${rarityClass}`}>{item.card?.rarity}</span>
                      </button>
                    )
                  })
                ) : (
                  <p className="text-gray-500 text-center py-2 text-sm">No cards</p>
                )}
              </div>
            </div>
          </div>

          {/* Their Offer */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-purple-500/30">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-purple-400 font-bold">{partnerUsername}'s Offer</h3>
              {theirConfirmed && (
                <span className="text-green-400 text-sm bg-green-900/30 px-2 py-1 rounded">
                  Ready!
                </span>
              )}
            </div>

            {/* Their Coins */}
            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-1">Coins</p>
              <div className="bg-gray-700/50 rounded-lg px-4 py-2">
                {(theirOffer?.coins ?? 0) > 0 ? (
                  <span className="text-yellow-400 font-bold">💰 {theirOffer?.coins} PattyCoins</span>
                ) : (
                  <span className="text-gray-500">No coins offered</span>
                )}
              </div>
            </div>

            {/* Their Cards */}
            <div>
              <p className="text-gray-400 text-sm mb-2">Cards ({theirOffer?.cards.length ?? 0})</p>
              <div className="bg-gray-700/50 rounded-lg p-2 min-h-[100px]">
                {theirOffer && theirOffer.cards.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {theirOffer.cards.map((card, i) => {
                      const rarityClass = RARITY_COLORS[card.rarity] ?? RARITY_COLORS.common
                      return (
                        <span
                          key={i}
                          className={`text-xs px-2 py-1 rounded border ${rarityClass}`}
                        >
                          {card.cardName}
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4 text-sm">No cards offered yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {hasUnsavedChanges() && !myConfirmed && (
            <button
              onClick={handleUpdateOffer}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white font-bold px-6 py-3 rounded-lg transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          )}

          {myConfirmed ? (
            <button
              onClick={handleUnconfirm}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 text-white font-bold px-6 py-3 rounded-lg transition-colors"
            >
              {loading ? 'Unconfirming...' : 'Edit Offer'}
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={loading || hasUnsavedChanges()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 text-white font-bold px-8 py-3 rounded-lg transition-colors"
            >
              {loading ? 'Confirming...' : "I'm Ready!"}
            </button>
          )}
        </div>

        {/* Status Info */}
        <div className="mt-4 text-center">
          {myConfirmed && theirConfirmed ? (
            <p className="text-green-400 animate-pulse">Both players ready! Completing trade...</p>
          ) : myConfirmed && !theirConfirmed ? (
            <p className="text-yellow-400">Waiting for {partnerUsername} to confirm...</p>
          ) : !myConfirmed && theirConfirmed ? (
            <p className="text-cyan-400">{partnerUsername} is ready! Confirm when you're satisfied.</p>
          ) : (
            <p className="text-gray-400">Both players must click "I'm Ready" to complete the trade</p>
          )}
        </div>
      </div>
    </div>
  )
}
