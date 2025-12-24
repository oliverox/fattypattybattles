import { useEffect, useCallback } from 'react'
import { useGameStore } from '@/stores/gameStore'

const dialogueOptions = [
  { key: '1', label: 'Appraise my cards', action: 'appraise' as const },
  { key: '2', label: 'Sell cards', action: 'sell' as const },
  { key: '3', label: 'Goodbye', action: 'close' as const },
]

export function SellDialogue() {
  const sellDialogueOpen = useGameStore((state) => state.sellDialogueOpen)
  const setSellDialogueOpen = useGameStore((state) => state.setSellDialogueOpen)
  const setSellShopOpen = useGameStore((state) => state.setSellShopOpen)
  const setActiveSellView = useGameStore((state) => state.setActiveSellView)

  const handleOption = useCallback((action: 'appraise' | 'sell' | 'close') => {
    if (action === 'close') {
      setSellDialogueOpen(false)
    } else {
      setSellDialogueOpen(false)
      setActiveSellView(action)
      setSellShopOpen(true)
    }
  }, [setSellDialogueOpen, setActiveSellView, setSellShopOpen])

  useEffect(() => {
    if (!sellDialogueOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSellDialogueOpen(false)
        return
      }

      const option = dialogueOptions.find(opt => opt.key === e.key)
      if (option) {
        handleOption(option.action)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sellDialogueOpen, handleOption, setSellDialogueOpen])

  if (!sellDialogueOpen) {
    return null
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setSellDialogueOpen(false)}
      />

      {/* Dialogue box */}
      <div className="relative bg-gray-900/95 border-2 border-orange-500 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-orange-500/20">
        {/* NPC greeting */}
        <div className="mb-6">
          <h2 className="text-orange-400 text-xl font-bold mb-2">Merchant</h2>
          <p className="text-gray-300">
            Ah, a collector! Looking to appraise your treasures or turn them into coin?
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {dialogueOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => handleOption(option.action)}
              className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-700 border border-yellow-400/50 hover:border-yellow-400 rounded-lg px-4 py-3 transition-all group"
            >
              <span className="text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded font-mono text-sm">
                {option.key}
              </span>
              <span className="text-gray-200 group-hover:text-white">
                {option.label}
              </span>
            </button>
          ))}
        </div>

        {/* Close hint */}
        <p className="text-gray-500 text-sm mt-4 text-center">
          Press <span className="text-gray-400">ESC</span> to close
        </p>
      </div>
    </div>
  )
}
