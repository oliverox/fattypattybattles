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
import { TradeInitiateDialog } from '@/components/ui/TradeInitiateDialog'
import { TradeIncomingDialog } from '@/components/ui/TradeIncomingDialog'
import { TradeWaitingScreen } from '@/components/ui/TradeWaitingScreen'
import { TradeNegotiationScreen } from '@/components/ui/TradeNegotiationScreen'
import { TradeCompletedDialog } from '@/components/ui/TradeCompletedDialog'
import { MobileControls } from '@/components/ui/MobileControls'
import { EditAvatarModal } from '@/components/ui/EditAvatarModal'
import { ChatUI } from '@/components/ui/ChatUI'
import { Leaderboard } from '@/components/ui/Leaderboard'
import { DailyRewardPopup } from '@/components/ui/DailyRewardPopup'
import { QuestCompletePopup } from '@/components/ui/QuestCompletePopup'
import { usePlaytimeTracker } from '@/hooks/usePlaytimeTracker'
import { useGameStore } from '@/stores/gameStore'
import { MULTIPLAYER } from '@/lib/game/constants'

export const Route = createFileRoute('/game')({
  component: GamePage,
})

function GamePage() {
  const { isLoaded, isSignedIn } = useAuth()
  const currentUser = useQuery(api.users.getCurrentUser)
  const ensureStarterPack = useMutation(api.users.ensureStarterPack)
  const seedCards = useMutation(api.inventory.seedCards)
  const refreshDailyQuests = useMutation(api.dailyRewards.refreshDailyQuests)
  const initChecked = useRef(false)
  const dailyRewardChecked = useRef(false)
  const [editAvatarOpen, setEditAvatarOpen] = useState(false)

  const setDailyRewardPopupOpen = useGameStore((state) => state.setDailyRewardPopupOpen)
  const addQuestCompletion = useGameStore((state) => state.addQuestCompletion)

  // Track previous quest completion states
  const prevQuestStates = useRef<Record<string, boolean>>({})

  // Trade state
  const tradeInitiateDialogOpen = useGameStore((state) => state.tradeInitiateDialogOpen)
  const tradeNegotiationOpen = useGameStore((state) => state.tradeNegotiationOpen)
  const tradeCompletedOpen = useGameStore((state) => state.tradeCompletedOpen)
  const tradeRequestId = useGameStore((state) => state.tradeRequestId)

  // Check if daily rewards are claimable
  const claimableRewards = useQuery(
    api.dailyRewards.hasClaimableRewards,
    currentUser?.clerkId ? { clerkId: currentUser.clerkId } : 'skip'
  )

  // Get daily quests to track completion
  const dailyQuests = useQuery(
    api.dailyRewards.getDailyQuests,
    currentUser?.clerkId ? { clerkId: currentUser.clerkId } : 'skip'
  )

  // Track playtime for leaderboard
  usePlaytimeTracker()

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
      // Refresh daily quests if needed
      if (currentUser.clerkId) {
        refreshDailyQuests({ clerkId: currentUser.clerkId })
      }
    }
  }, [currentUser, ensureStarterPack, seedCards, refreshDailyQuests])

  // Auto-show daily reward popup when rewards are claimable (on load)
  useEffect(() => {
    if (claimableRewards?.hasRewards && !dailyRewardChecked.current) {
      dailyRewardChecked.current = true
      // Small delay to let the game load first
      const timer = setTimeout(() => {
        setDailyRewardPopupOpen(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [claimableRewards, setDailyRewardPopupOpen])

  // Track quest completions and queue notifications
  useEffect(() => {
    if (!dailyQuests?.quests || !dailyRewardChecked.current) return

    for (const quest of dailyQuests.quests) {
      const wasCompleted = prevQuestStates.current[quest.id] ?? false
      const isNowCompleted = quest.completed && !quest.claimed

      // If quest just became completed (wasn't before, now is)
      if (isNowCompleted && !wasCompleted) {
        addQuestCompletion({
          questName: quest.name,
          reward: quest.reward,
        })
      }

      // Update tracking
      prevQuestStates.current[quest.id] = quest.completed && !quest.claimed
    }
  }, [dailyQuests?.quests, addQuestCompletion])

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
        <button
          onClick={() => setDailyRewardPopupOpen(true)}
          className="mt-2 w-full text-xs bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-2 py-1 rounded transition-colors flex items-center justify-center gap-1"
        >
          <span>🎁</span> Daily Rewards
        </button>
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

      {/* Trade UI */}
      {tradeInitiateDialogOpen && <TradeInitiateDialog />}
      <TradeIncomingDialog />
      {tradeRequestId && !tradeNegotiationOpen && <TradeWaitingScreen />}
      {tradeNegotiationOpen && <TradeNegotiationScreen />}
      {tradeCompletedOpen && <TradeCompletedDialog />}

      <ChatUI mapId={MULTIPLAYER.defaultMapId} />
      <Leaderboard />
      <DailyRewardPopup />
      <QuestCompletePopup />

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
