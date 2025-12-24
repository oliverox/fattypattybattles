import { useEffect, useState, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { useUser } from '@clerk/tanstack-react-start'
import { api } from '../../../convex/_generated/api'
import { useGameStore } from '@/stores/gameStore'

export function LuckShop() {
  const { user } = useUser()
  const shopOpen = useGameStore((state) => state.shopOpen)
  const activeShop = useGameStore((state) => state.activeShop)
  const closeAllShopUI = useGameStore((state) => state.closeAllShopUI)

  const [isPurchasing, setIsPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const boosts = useQuery(api.shop.getLuckBoosts)
  const balance = useQuery(
    api.shop.getUserBalance,
    user?.id ? { clerkId: user.id } : 'skip'
  )
  const activeBoosts = useQuery(
    api.shop.getUserLuckBoosts,
    user?.id ? { clerkId: user.id } : 'skip'
  )
  const purchaseLuckBoost = useMutation(api.shop.purchaseLuckBoost)

  const handlePurchase = useCallback(async (boostId: string) => {
    if (!user?.id || isPurchasing) return

    const boost = boosts?.find((b) => b.id === boostId)
    if (!boost || (balance ?? 0) < boost.cost) {
      setError('Insufficient Pattycoins!')
      setTimeout(() => setError(null), 2000)
      return
    }

    setIsPurchasing(true)
    setError(null)

    try {
      const result = await purchaseLuckBoost({
        clerkId: user.id,
        boostId,
      })
      const expiresIn = Math.round((result.expiresAt - Date.now()) / 60000)
      setSuccess(`${boost.name} activated! Expires in ${expiresIn} minutes`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed')
      setTimeout(() => setError(null), 2000)
    } finally {
      setIsPurchasing(false)
    }
  }, [user?.id, isPurchasing, boosts, balance, purchaseLuckBoost])

  useEffect(() => {
    if (!shopOpen || activeShop !== 'luck') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAllShopUI()
        return
      }

      const keyIndex = parseInt(e.key) - 1
      if (keyIndex >= 0 && keyIndex < (boosts?.length ?? 0) && boosts?.[keyIndex]) {
        handlePurchase(boosts[keyIndex].id)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shopOpen, activeShop, boosts, handlePurchase, closeAllShopUI])

  if (!shopOpen || activeShop !== 'luck') {
    return null
  }

  const formatTimeRemaining = (expiresAt: number) => {
    const remaining = expiresAt - Date.now()
    if (remaining <= 0) return 'Expired'
    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={closeAllShopUI}
      />

      <div className="relative bg-gray-900/95 border-2 border-purple-500 rounded-xl p-6 max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-400">Luck Shop</h2>
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg px-4 py-2">
            <span className="text-yellow-400 font-bold">
              {balance ?? 0} Pattycoins
            </span>
          </div>
        </div>

        {/* Active boosts */}
        {activeBoosts && activeBoosts.length > 0 && (
          <div className="bg-purple-500/10 border border-purple-500/50 rounded-lg p-4 mb-6">
            <h3 className="text-purple-300 font-bold mb-2">Active Boosts</h3>
            <div className="space-y-2">
              {activeBoosts.map((boost, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">{boost.type} ({boost.multiplier}x)</span>
                  <span className="text-purple-400">{formatTimeRemaining(boost.expiresAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg px-4 py-2 mb-4 text-center">
            <span className="text-red-400">{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-500/20 border border-green-500 rounded-lg px-4 py-2 mb-4 text-center">
            <span className="text-green-400">{success}</span>
          </div>
        )}

        {/* Boosts grid */}
        <div className="space-y-3 mb-6">
          {boosts?.map((boost, index) => {
            const canAfford = (balance ?? 0) >= boost.cost

            return (
              <button
                key={boost.id}
                onClick={() => handlePurchase(boost.id)}
                disabled={!canAfford || isPurchasing}
                className={`relative w-full bg-gray-800 border-2 rounded-xl p-4 text-left transition-all ${
                  canAfford
                    ? 'border-purple-400/50 hover:border-purple-400 hover:bg-gray-700'
                    : 'border-gray-600 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-purple-400 bg-purple-400/20 px-2 py-0.5 rounded font-mono text-xs">
                        {index + 1}
                      </span>
                      <h3 className="text-white font-bold">{boost.name}</h3>
                      <span className="text-purple-400 text-sm font-bold">
                        {boost.multiplier}x
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{boost.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-yellow-400 font-bold">{boost.cost}</p>
                    <p className="text-gray-500 text-xs">coins</p>
                  </div>
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
          Press <span className="text-gray-400">1-3</span> to buy or{' '}
          <span className="text-gray-400">ESC</span> to close
        </p>
      </div>
    </div>
  )
}
