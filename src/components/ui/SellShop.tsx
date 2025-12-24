import { useEffect, useState, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { useUser } from '@clerk/tanstack-react-start'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { useGameStore } from '@/stores/gameStore'

const rarityColors: Record<string, string> = {
  common: 'text-gray-400 border-gray-400',
  uncommon: 'text-green-400 border-green-400',
  rare: 'text-blue-400 border-blue-400',
  legendary: 'text-purple-400 border-purple-400',
  mythical: 'text-pink-400 border-pink-400',
  divine: 'text-yellow-400 border-yellow-400',
  prismatic: 'text-cyan-400 border-cyan-400',
  transcendent: 'text-red-400 border-red-400',
  secret: 'text-white border-white',
}

export function SellShop() {
  const { user } = useUser()
  const sellShopOpen = useGameStore((state) => state.sellShopOpen)
  const setSellShopOpen = useGameStore((state) => state.setSellShopOpen)
  const activeSellView = useGameStore((state) => state.activeSellView)
  const setActiveSellView = useGameStore((state) => state.setActiveSellView)

  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())
  const [isSelling, setIsSelling] = useState(false)

  const appraisedCards = useQuery(
    api.inventory.appraiseCards,
    user?.id ? { clerkId: user.id } : 'skip'
  )
  const sellCards = useMutation(api.inventory.sellCards)

  const handleClose = useCallback(() => {
    setSellShopOpen(false)
    setActiveSellView(null)
    setSelectedCards(new Set())
  }, [setSellShopOpen, setActiveSellView])

  const toggleCardSelection = useCallback((inventoryId: string) => {
    setSelectedCards(prev => {
      const next = new Set(prev)
      if (next.has(inventoryId)) {
        next.delete(inventoryId)
      } else {
        next.add(inventoryId)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    if (!appraisedCards) return
    setSelectedCards(new Set(appraisedCards.map(card => card.inventoryId)))
  }, [appraisedCards])

  const deselectAll = useCallback(() => {
    setSelectedCards(new Set())
  }, [])

  const calculateTotal = useCallback(() => {
    if (!appraisedCards) return 0
    return appraisedCards
      .filter(card => selectedCards.has(card.inventoryId))
      .reduce((sum, card) => sum + card.sellPrice, 0)
  }, [appraisedCards, selectedCards])

  const handleSell = useCallback(async () => {
    if (!user?.id || selectedCards.size === 0 || isSelling) return

    setIsSelling(true)
    try {
      await sellCards({
        clerkId: user.id,
        inventoryIds: Array.from(selectedCards) as Id<"inventory">[],
      })
      setSelectedCards(new Set())
    } catch (err) {
      console.error('Failed to sell cards:', err)
    } finally {
      setIsSelling(false)
    }
  }, [user?.id, selectedCards, isSelling, sellCards])

  useEffect(() => {
    if (!sellShopOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sellShopOpen, handleClose])

  if (!sellShopOpen) {
    return null
  }

  const isAppraise = activeSellView === 'appraise'
  const title = isAppraise ? 'Card Appraisal' : 'Sell Cards'
  const subtitle = isAppraise
    ? 'View the value of your cards'
    : 'Select cards to sell for Pattycoins'

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />

      <div className="relative bg-gray-900/95 border-2 border-orange-500 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-orange-400">{title}</h2>
            <p className="text-gray-400 text-sm">{subtitle}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Cards Grid */}
        <div className="flex-1 overflow-y-auto">
          {(!appraisedCards || appraisedCards.length === 0) ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No cards to appraise</p>
              <p className="text-gray-600 text-sm mt-2">
                Open some packs from your inventory to get cards!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {appraisedCards.map((item) => (
                <div
                  key={item.inventoryId}
                  onClick={() => !isAppraise && toggleCardSelection(item.inventoryId)}
                  className={`border-2 rounded-lg p-3 transition-all ${
                    rarityColors[item.rarity] || 'border-gray-600'
                  } ${
                    !isAppraise ? 'cursor-pointer hover:scale-105' : ''
                  } ${
                    selectedCards.has(item.inventoryId)
                      ? 'ring-2 ring-yellow-400 bg-yellow-400/10'
                      : 'bg-gray-800/50'
                  }`}
                >
                  <p className="font-bold truncate text-sm text-white">
                    {item.name}
                  </p>
                  <p className={`text-xs capitalize ${rarityColors[item.rarity]?.split(' ')[0]}`}>
                    {item.rarity}
                  </p>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>ATK: {item.attack}</span>
                    <span>DEF: {item.defense}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <p className="text-yellow-400 font-bold text-sm">
                      {item.sellPrice} PC
                    </p>
                  </div>
                  {!isAppraise && (
                    <div className="mt-2">
                      <div className={`w-full h-6 rounded border-2 flex items-center justify-center text-xs font-bold ${
                        selectedCards.has(item.inventoryId)
                          ? 'border-yellow-400 bg-yellow-400 text-black'
                          : 'border-gray-600 text-gray-500'
                      }`}>
                        {selectedCards.has(item.inventoryId) ? 'Selected' : 'Click to select'}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isAppraise && appraisedCards && appraisedCards.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">
                Selected: <span className="text-white">{selectedCards.size} / {appraisedCards.length} cards</span>
              </p>
              <p className="text-yellow-400 font-bold text-lg">
                Total: {calculateTotal()} Pattycoins
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectedCards.size === appraisedCards.length ? deselectAll : selectAll}
                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                {selectedCards.size === appraisedCards.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handleSell}
                disabled={selectedCards.size === 0 || isSelling}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-colors"
              >
                {isSelling ? 'Selling...' : `Sell ${selectedCards.size} Card${selectedCards.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}

        <p className="text-gray-500 text-sm mt-4 text-center">
          Press <span className="text-gray-400">ESC</span> to close
        </p>
      </div>
    </div>
  )
}
