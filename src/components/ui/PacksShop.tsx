import { useEffect, useState, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { useUser } from '@clerk/tanstack-react-start'
import { api } from '../../../convex/_generated/api'
import { useGameStore } from '@/stores/gameStore'
import { PACK_PRICES } from '@/lib/game/constants'

interface PackResult {
  cardId: string
  name: string
  rarity: string
}

const packKeys = ['1', '2', '3', '4', '5'] as const
const packTypes = ['small', 'normal', 'big', 'premium', 'deluxe'] as const

const rarityColors: Record<string, string> = {
  common: 'text-gray-400 border-gray-400',
  uncommon: 'text-green-400 border-green-400',
  rare: 'text-blue-400 border-blue-400',
  legendary: 'text-purple-400 border-purple-400',
  mythical: 'text-pink-400 border-pink-400',
  divine: 'text-yellow-400 border-yellow-400',
  prismatic: 'text-cyan-400 border-cyan-400 animate-pulse',
  transcendent: 'text-red-400 border-red-400 animate-pulse',
  secret: 'text-white border-white animate-pulse',
}

export function PacksShop() {
  const { user } = useUser()
  const shopOpen = useGameStore((state) => state.shopOpen)
  const activeShop = useGameStore((state) => state.activeShop)
  const closeAllShopUI = useGameStore((state) => state.closeAllShopUI)

  const [purchaseResult, setPurchaseResult] = useState<PackResult[] | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoOpen, setAutoOpen] = useState(true)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  const packs = useQuery(api.shop.getShopPacks)
  const balance = useQuery(
    api.shop.getUserBalance,
    user?.id ? { clerkId: user.id } : 'skip'
  )
  const purchasePack = useMutation(api.shop.purchasePack)

  const handlePurchase = useCallback(async (packType: string) => {
    if (!user?.id || isPurchasing) return

    const pack = packs?.find((p) => p.type === packType)
    if (!pack || (balance ?? 0) < pack.cost) {
      setError('Insufficient Pattycoins!')
      setTimeout(() => setError(null), 2000)
      return
    }

    setIsPurchasing(true)
    setError(null)
    setSavedMessage(null)

    try {
      const result = await purchasePack({
        clerkId: user.id,
        packType,
        autoOpen,
      })

      if (result.savedToInventory) {
        // Pack was saved to inventory
        setSavedMessage(`${pack.name} saved to inventory!`)
        setTimeout(() => setSavedMessage(null), 2000)
      } else {
        // Pack was opened, show results
        setPurchaseResult(result.cards)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed')
      setTimeout(() => setError(null), 2000)
    } finally {
      setIsPurchasing(false)
    }
  }, [user?.id, isPurchasing, packs, balance, purchasePack, autoOpen])

  useEffect(() => {
    if (!shopOpen || activeShop !== 'packs') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (purchaseResult) {
          setPurchaseResult(null)
        } else {
          closeAllShopUI()
        }
        return
      }

      if (purchaseResult) return

      const keyIndex = packKeys.indexOf(e.key as typeof packKeys[number])
      if (keyIndex !== -1 && packTypes[keyIndex]) {
        handlePurchase(packTypes[keyIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shopOpen, activeShop, purchaseResult, handlePurchase, closeAllShopUI])

  if (!shopOpen || activeShop !== 'packs') {
    return null
  }

  // Show pack opening results
  if (purchaseResult) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative bg-gray-900/95 border-2 border-pink-500 rounded-xl p-8 max-w-2xl w-full mx-4">
          <h2 className="text-2xl font-bold text-pink-400 text-center mb-6">
            Pack Opened!
          </h2>

          <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-6">
            {purchaseResult.map((card, index) => (
              <div
                key={index}
                className={`bg-gray-800 border-2 rounded-lg p-3 text-center ${rarityColors[card.rarity] || 'border-gray-600'}`}
              >
                <p className="text-sm font-bold truncate">{card.name}</p>
                <p className={`text-xs capitalize ${rarityColors[card.rarity]?.split(' ')[0] || 'text-gray-400'}`}>
                  {card.rarity}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setPurchaseResult(null)}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Continue Shopping
          </button>

          <p className="text-gray-500 text-sm mt-3 text-center">
            Press <span className="text-gray-400">ESC</span> to continue
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={closeAllShopUI}
      />

      <div className="relative bg-gray-900/95 border-2 border-cyan-500 rounded-xl p-6 max-w-4xl w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-cyan-400">Packs Shop</h2>
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg px-4 py-2">
            <span className="text-yellow-400 font-bold">
              {balance ?? 0} Pattycoins
            </span>
          </div>
        </div>

        {/* Auto-open toggle */}
        <div className="flex items-center justify-center gap-3 mb-4 bg-gray-800/50 rounded-lg p-3">
          <span className="text-gray-400 text-sm">When purchased:</span>
          <button
            onClick={() => setAutoOpen(true)}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
              autoOpen
                ? 'bg-pink-500 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Open Now
          </button>
          <button
            onClick={() => setAutoOpen(false)}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
              !autoOpen
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Save to Inventory
          </button>
        </div>

        {/* Success message for saved packs */}
        {savedMessage && (
          <div className="bg-green-500/20 border border-green-500 rounded-lg px-4 py-2 mb-4 text-center">
            <span className="text-green-400">{savedMessage}</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg px-4 py-2 mb-4 text-center">
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Packs grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {packTypes.map((type, index) => {
            const pack = packs?.find((p) => p.type === type)
            const price = PACK_PRICES[type]
            const canAfford = (balance ?? 0) >= price

            return (
              <button
                key={type}
                onClick={() => handlePurchase(type)}
                disabled={!canAfford || isPurchasing}
                className={`relative bg-gray-800 border-2 rounded-xl p-4 transition-all ${
                  canAfford
                    ? 'border-cyan-400/50 hover:border-cyan-400 hover:bg-gray-700'
                    : 'border-gray-600 opacity-50 cursor-not-allowed'
                }`}
              >
                {/* Key shortcut */}
                <span className="absolute top-2 left-2 text-cyan-400 bg-cyan-400/20 px-2 py-1 rounded font-mono text-xs">
                  {packKeys[index]}
                </span>

                {/* Pack info */}
                <div className="mt-6">
                  <h3 className="text-white font-bold capitalize mb-1">
                    {pack?.name || `${type} Pack`}
                  </h3>
                  <p className="text-gray-400 text-xs mb-3">
                    {pack?.cardCount || (index + 1) * 2 + 1} cards
                  </p>
                  <p className="text-yellow-400 font-bold">
                    {price} coins
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Close button */}
        <div className="flex justify-center">
          <button
            onClick={closeAllShopUI}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-6 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

        <p className="text-gray-500 text-sm mt-4 text-center">
          Press <span className="text-gray-400">1-5</span> to buy or{' '}
          <span className="text-gray-400">ESC</span> to close
        </p>
      </div>
    </div>
  )
}
