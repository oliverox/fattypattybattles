import { useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'

const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-300 border-gray-400',
  uncommon: 'text-green-300 border-green-400',
  rare: 'text-blue-300 border-blue-400',
  legendary: 'text-purple-300 border-purple-400',
  mythical: 'text-pink-300 border-pink-400',
  divine: 'text-yellow-300 border-yellow-400',
  prismatic: 'text-cyan-300 border-cyan-400',
  transcendent: 'text-orange-300 border-orange-400',
  holographic: 'text-white border-white bg-white/10 animate-pulse',
  exclusive: 'text-pink-300 border-pink-300 bg-pink-300/10 animate-pulse',
}

export function TradeCompletedDialog() {
  const tradeResult = useGameStore((state) => state.tradeResult)
  const closeTradeUI = useGameStore((state) => state.closeTradeUI)

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        closeTradeUI()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeTradeUI])

  if (!tradeResult) {
    return null
  }

  const hasGiven = tradeResult.cardsGiven.length > 0 || tradeResult.coinsGiven > 0
  const hasReceived = tradeResult.cardsReceived.length > 0 || tradeResult.coinsReceived > 0

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={closeTradeUI} />

      {/* Dialog */}
      <div className="relative bg-gray-900/95 border-2 border-emerald-500 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-emerald-500/20">
        {/* Success Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🤝</div>
          <h2 className="text-emerald-400 text-2xl font-bold">Trade Complete!</h2>
          <p className="text-gray-400 mt-1">
            Trade with <span className="text-emerald-300 font-bold">{tradeResult.partnerUsername}</span> successful
          </p>
        </div>

        {/* Trade Summary */}
        <div className="space-y-4 mb-6">
          {/* What you gave */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 font-medium mb-2">You gave:</p>
            {hasGiven ? (
              <div className="space-y-2">
                {tradeResult.coinsGiven > 0 && (
                  <p className="text-yellow-400">💰 {tradeResult.coinsGiven} PattyCoins</p>
                )}
                {tradeResult.cardsGiven.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tradeResult.cardsGiven.map((card, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2 py-1 rounded border ${RARITY_COLORS[card.rarity] ?? RARITY_COLORS.common}`}
                      >
                        {card.cardName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">Nothing</p>
            )}
          </div>

          {/* What you received */}
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-400 font-medium mb-2">You received:</p>
            {hasReceived ? (
              <div className="space-y-2">
                {tradeResult.coinsReceived > 0 && (
                  <p className="text-yellow-400">💰 {tradeResult.coinsReceived} PattyCoins</p>
                )}
                {tradeResult.cardsReceived.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tradeResult.cardsReceived.map((card, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2 py-1 rounded border ${RARITY_COLORS[card.rarity] ?? RARITY_COLORS.common}`}
                      >
                        {card.cardName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">Nothing (gift)</p>
            )}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={closeTradeUI}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors"
        >
          Close
        </button>

        <p className="text-gray-500 text-xs text-center mt-3">Press ESC or Enter to close</p>
      </div>
    </div>
  )
}
