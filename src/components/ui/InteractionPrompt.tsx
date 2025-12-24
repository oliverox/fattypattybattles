import { useGameStore } from '@/stores/gameStore'

export function InteractionPrompt() {
  const nearNPC = useGameStore((state) => state.nearNPC)
  const nearSellNPC = useGameStore((state) => state.nearSellNPC)
  const dialogueOpen = useGameStore((state) => state.dialogueOpen)
  const shopOpen = useGameStore((state) => state.shopOpen)
  const sellDialogueOpen = useGameStore((state) => state.sellDialogueOpen)
  const sellShopOpen = useGameStore((state) => state.sellShopOpen)
  const inventoryOpen = useGameStore((state) => state.inventoryOpen)

  const anyUIOpen = dialogueOpen || shopOpen || sellDialogueOpen || sellShopOpen || inventoryOpen

  if (anyUIOpen) {
    return null
  }

  if (nearNPC) {
    return (
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-black/80 border-2 border-cyan-400 rounded-lg px-6 py-3 shadow-lg shadow-cyan-400/20">
          <p className="text-cyan-400 text-lg font-bold tracking-wide">
            Press <span className="text-pink-400 bg-pink-400/20 px-2 py-1 rounded mx-1">T</span> to talk to Shopkeeper
          </p>
        </div>
      </div>
    )
  }

  if (nearSellNPC) {
    return (
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-black/80 border-2 border-orange-400 rounded-lg px-6 py-3 shadow-lg shadow-orange-400/20">
          <p className="text-orange-400 text-lg font-bold tracking-wide">
            Press <span className="text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded mx-1">T</span> to talk to Merchant
          </p>
        </div>
      </div>
    )
  }

  return null
}
