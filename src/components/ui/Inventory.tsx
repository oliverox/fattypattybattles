import { useEffect, useState, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { useUser } from '@clerk/tanstack-react-start'
import { api } from '../../../convex/_generated/api'
import { useGameStore } from '@/stores/gameStore'

interface PackOpenResult {
  cardId: string
  name: string
  rarity: string
}

const rarityColors: Record<string, string> = {
  common: 'text-gray-400 border-gray-400 bg-gray-400/10',
  uncommon: 'text-green-400 border-green-400 bg-green-400/10',
  rare: 'text-blue-400 border-blue-400 bg-blue-400/10',
  legendary: 'text-purple-400 border-purple-400 bg-purple-400/10',
  mythical: 'text-pink-400 border-pink-400 bg-pink-400/10',
  divine: 'text-yellow-400 border-yellow-400 bg-yellow-400/10',
  prismatic: 'text-cyan-400 border-cyan-400 bg-cyan-400/10 animate-pulse',
  transcendent: 'text-red-400 border-red-400 bg-red-400/10 animate-pulse',
  secret: 'text-white border-white bg-white/10 animate-pulse',
}

const packNames: Record<string, string> = {
  small: 'Small Pack',
  normal: 'Normal Pack',
  big: 'Big Pack',
  premium: 'Premium Pack',
  deluxe: 'Deluxe Pack',
}

export function Inventory() {
  const { user } = useUser()
  const inventoryOpen = useGameStore((state) => state.inventoryOpen)
  const setInventoryOpen = useGameStore((state) => state.setInventoryOpen)
  const heldCardId = useGameStore((state) => state.heldCardId)
  const setHeldCardId = useGameStore((state) => state.setHeldCardId)

  const [packOpenResult, setPackOpenResult] = useState<PackOpenResult[] | null>(null)
  const [openingPackType, setOpeningPackType] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'cards' | 'packs'>('cards')

  const inventory = useQuery(
    api.inventory.getUserInventory,
    user?.id ? { clerkId: user.id } : 'skip'
  )
  const unopenedPacks = useQuery(
    api.inventory.getUnopenedPacks,
    user?.id ? { clerkId: user.id } : 'skip'
  )
  const openPack = useMutation(api.inventory.openPack)
  const setHeldCardMutation = useMutation(api.inventory.setHeldCard)

  const handleOpenPack = useCallback(async (packType: string) => {
    if (!user?.id || openingPackType) return

    setOpeningPackType(packType)
    try {
      const result = await openPack({ clerkId: user.id, packType })
      setPackOpenResult(result.cards)
    } catch (err) {
      console.error('Failed to open pack:', err)
    } finally {
      setOpeningPackType(null)
    }
  }, [user?.id, openingPackType, openPack])

  const handleHoldCard = useCallback(async (cardId: string) => {
    if (!user?.id) return

    const newCardId = heldCardId === cardId ? null : cardId
    setHeldCardId(newCardId)
    await setHeldCardMutation({ clerkId: user.id, cardId: newCardId ?? undefined })
  }, [user?.id, heldCardId, setHeldCardId, setHeldCardMutation])

  useEffect(() => {
    if (!inventoryOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
        if (packOpenResult) {
          setPackOpenResult(null)
        } else {
          setInventoryOpen(false)
        }
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [inventoryOpen, packOpenResult, setInventoryOpen])

  if (!inventoryOpen) {
    return null
  }

  // Pack opening result view
  if (packOpenResult) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative bg-gray-900/95 border-2 border-pink-500 rounded-xl p-8 max-w-2xl w-full mx-4">
          <h2 className="text-2xl font-bold text-pink-400 text-center mb-6">
            Pack Opened!
          </h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {packOpenResult.map((card, index) => (
              <div
                key={index}
                className={`border-2 rounded-lg p-4 text-center ${rarityColors[card.rarity] || 'border-gray-600'}`}
              >
                <p className="font-bold truncate">{card.name}</p>
                <p className={`text-sm capitalize ${rarityColors[card.rarity]?.split(' ')[0] || 'text-gray-400'}`}>
                  {card.rarity}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setPackOpenResult(null)}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Continue
          </button>

          <p className="text-gray-500 text-sm mt-3 text-center">
            Press <span className="text-gray-400">ESC</span> or <span className="text-gray-400">B</span> to continue
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={() => setInventoryOpen(false)}
      />

      <div className="relative bg-gray-900/95 border-2 border-cyan-500 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-cyan-400">Inventory</h2>
          <button
            onClick={() => setInventoryOpen(false)}
            className="text-gray-400 hover:text-white text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${
              activeTab === 'cards'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Cards ({inventory?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('packs')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${
              activeTab === 'packs'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Packs ({unopenedPacks?.reduce((sum, p) => sum + p.quantity, 0) ?? 0})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'cards' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {inventory?.length === 0 && (
                <p className="text-gray-500 col-span-full text-center py-8">
                  No cards yet. Open a pack to get started!
                </p>
              )}
              {inventory?.map((item) => (
                <div
                  key={item.inventoryId}
                  className={`border-2 rounded-lg p-3 ${rarityColors[item.card?.rarity ?? 'common'] || 'border-gray-600'}`}
                >
                  <p className="font-bold truncate text-sm">{item.card?.name}</p>
                  <p className={`text-xs capitalize ${rarityColors[item.card?.rarity ?? 'common']?.split(' ')[0]}`}>
                    {item.card?.rarity}
                  </p>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>ATK: {item.card?.attack}</span>
                    <span>DEF: {item.card?.defense}</span>
                  </div>
                  <button
                    onClick={() => handleHoldCard(item.cardId as string)}
                    className={`w-full mt-2 py-1 rounded text-xs font-bold transition-colors ${
                      heldCardId === item.cardId
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {heldCardId === item.cardId ? 'Holding' : 'Hold'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'packs' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(!unopenedPacks || unopenedPacks.length === 0) && (
                <p className="text-gray-500 col-span-full text-center py-8">
                  No unopened packs. Visit the shop to buy some!
                </p>
              )}
              {unopenedPacks?.map((pack, index) => {
                const isThisPackOpening = openingPackType === pack.packType
                return (
                  <div
                    key={index}
                    className="bg-gray-800 border-2 border-purple-500 rounded-xl p-4"
                  >
                    <h3 className="text-purple-400 font-bold text-lg">
                      {packNames[pack.packType] || pack.packType}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3">
                      Quantity: {pack.quantity}
                    </p>
                    <button
                      onClick={() => handleOpenPack(pack.packType)}
                      disabled={openingPackType !== null}
                      className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white font-bold py-2 rounded-lg transition-colors"
                    >
                      {isThisPackOpening ? 'Opening...' : 'Open Pack'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-gray-500 text-sm mt-4 text-center">
          Press <span className="text-gray-400">B</span> or <span className="text-gray-400">ESC</span> to close
        </p>
      </div>
    </div>
  )
}
