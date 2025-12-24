import { useEffect, useCallback } from 'react'
import { useGameStore } from '@/stores/gameStore'

const dialogueOptions = [
  { key: '1', label: 'Browse Packs', action: 'packs' as const },
  { key: '2', label: 'Browse Luck Boosts', action: 'luck' as const },
  { key: '3', label: 'Goodbye', action: 'close' as const },
]

export function ShopDialogue() {
  const dialogueOpen = useGameStore((state) => state.dialogueOpen)
  const setDialogueOpen = useGameStore((state) => state.setDialogueOpen)
  const setShopOpen = useGameStore((state) => state.setShopOpen)
  const setActiveShop = useGameStore((state) => state.setActiveShop)

  const handleOption = useCallback((action: 'packs' | 'luck' | 'close') => {
    if (action === 'close') {
      setDialogueOpen(false)
    } else {
      setDialogueOpen(false)
      setActiveShop(action)
      setShopOpen(true)
    }
  }, [setDialogueOpen, setActiveShop, setShopOpen])

  useEffect(() => {
    if (!dialogueOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDialogueOpen(false)
        return
      }

      const option = dialogueOptions.find(opt => opt.key === e.key)
      if (option) {
        handleOption(option.action)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dialogueOpen, handleOption, setDialogueOpen])

  if (!dialogueOpen) {
    return null
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setDialogueOpen(false)}
      />

      {/* Dialogue box */}
      <div className="relative bg-gray-900/95 border-2 border-pink-500 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-pink-500/20">
        {/* NPC greeting */}
        <div className="mb-6">
          <h2 className="text-pink-400 text-xl font-bold mb-2">Shopkeeper</h2>
          <p className="text-gray-300">
            Welcome to my shop! What would you like to browse today?
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {dialogueOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => handleOption(option.action)}
              className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-700 border border-cyan-400/50 hover:border-cyan-400 rounded-lg px-4 py-3 transition-all group"
            >
              <span className="text-cyan-400 bg-cyan-400/20 px-2 py-1 rounded font-mono text-sm">
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
