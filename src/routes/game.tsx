import { createFileRoute } from '@tanstack/react-router'
import { UserButton, useAuth } from '@clerk/tanstack-react-start'
import { useQuery, useMutation } from 'convex/react'
import { useEffect, useRef, useState } from 'react'
import { api } from '../../convex/_generated/api'
import { GameCanvas } from '@/components/game/GameCanvas'
import { InteractionPrompt } from '@/components/ui/InteractionPrompt'
import { ShopDialogue } from '@/components/ui/ShopDialogue'
import { PacksShop } from '@/components/ui/PacksShop'
import { LuckShop } from '@/components/ui/LuckShop'
import { Inventory } from '@/components/ui/Inventory'
import { SellDialogue } from '@/components/ui/SellDialogue'
import { SellShop } from '@/components/ui/SellShop'
import { BattleDialogue } from '@/components/ui/BattleDialogue'
import { BattleCardSelect } from '@/components/ui/BattleCardSelect'
import { BattleArena } from '@/components/ui/BattleArena'
import { PvpRequestDialog } from '@/components/ui/PvpRequestDialog'
import { PvpIncomingDialog } from '@/components/ui/PvpIncomingDialog'
import { PvpWaitingScreen } from '@/components/ui/PvpWaitingScreen'
import { MobileControls } from '@/components/ui/MobileControls'
import { EditAvatarModal } from '@/components/ui/EditAvatarModal'
import { ChatUI } from '@/components/ui/ChatUI'
import { MULTIPLAYER } from '@/lib/game/constants'

export const Route = createFileRoute('/game')({
  component: GamePage,
})

function GamePage() {
  const { isLoaded, isSignedIn } = useAuth()
  const currentUser = useQuery(api.users.getCurrentUser)
  const ensureStarterPack = useMutation(api.users.ensureStarterPack)
  const seedCards = useMutation(api.inventory.seedCards)
  const initChecked = useRef(false)
  const [editAvatarOpen, setEditAvatarOpen] = useState(false)

  // Seed cards and ensure existing users get their starter pack
  useEffect(() => {
    if (currentUser && !initChecked.current) {
      initChecked.current = true
      // First seed the cards database
      seedCards().then((result) => {
        if (result.seeded) {
          console.log(`Seeded ${result.count} cards!`)
        }
      })
      // Then ensure user has starter pack
      ensureStarterPack().then((result) => {
        if (result.granted) {
          console.log('Starter pack granted!')
        }
      })
    }
  }, [currentUser, ensureStarterPack, seedCards])

  // Wait for auth to load
  if (!isLoaded) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    if (typeof window !== 'undefined') {
      window.location.href = '/sign-in'
    }
    return null
  }

  if (currentUser === undefined) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading game...</div>
      </div>
    )
  }

  if (currentUser === null) {
    // Redirect to profile creation if no profile
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
    return null
  }

  return (
    <div className="w-screen h-screen relative">
      <div className="absolute top-4 right-4 z-50">
        <UserButton />
      </div>
      <div className="absolute top-4 left-4 z-50 text-white bg-black/50 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <p className="font-bold">{currentUser.username}</p>
          <button
            onClick={() => setEditAvatarOpen(true)}
            className="text-xs bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded transition-colors"
          >
            Edit Avatar
          </button>
        </div>
        <p className="text-sm">PattyCoins: {currentUser.pattyCoins}</p>
      </div>
      <GameCanvas avatarConfig={currentUser.avatarConfig} />

      {/* UI overlays */}
      <InteractionPrompt />
      <Inventory />
      <ShopDialogue />
      <PacksShop />
      <LuckShop />
      <SellDialogue />
      <SellShop />
      <BattleDialogue />
      <BattleCardSelect />
      <BattleArena />
      <PvpRequestDialog />
      <PvpIncomingDialog />
      <PvpWaitingScreen />
      <ChatUI mapId={MULTIPLAYER.defaultMapId} />

      {/* Mobile touch controls */}
      <MobileControls />

      {/* Edit Avatar Modal */}
      <EditAvatarModal
        isOpen={editAvatarOpen}
        onClose={() => setEditAvatarOpen(false)}
        currentConfig={currentUser.avatarConfig}
      />
    </div>
  )
}
