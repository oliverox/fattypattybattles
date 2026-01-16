import { useEffect, useCallback } from 'react'
import { useGameStore } from '@/stores/gameStore'

export function QuestCompletePopup() {
  const pendingQuestCompletions = useGameStore((state) => state.pendingQuestCompletions)
  const questCompletionPopupOpen = useGameStore((state) => state.questCompletionPopupOpen)
  const currentQuestCompletion = useGameStore((state) => state.currentQuestCompletion)
  const showNextQuestCompletion = useGameStore((state) => state.showNextQuestCompletion)
  const dismissQuestCompletion = useGameStore((state) => state.dismissQuestCompletion)
  const isAnyUIOpen = useGameStore((state) => state.isAnyUIOpen)

  // Check all UI states to determine if any UI is open
  const dialogueOpen = useGameStore((state) => state.dialogueOpen)
  const shopOpen = useGameStore((state) => state.shopOpen)
  const sellDialogueOpen = useGameStore((state) => state.sellDialogueOpen)
  const sellShopOpen = useGameStore((state) => state.sellShopOpen)
  const battleDialogueOpen = useGameStore((state) => state.battleDialogueOpen)
  const battleCardSelectOpen = useGameStore((state) => state.battleCardSelectOpen)
  const battleArenaOpen = useGameStore((state) => state.battleArenaOpen)
  const inventoryOpen = useGameStore((state) => state.inventoryOpen)
  const chatOpen = useGameStore((state) => state.chatOpen)
  const leaderboardOpen = useGameStore((state) => state.leaderboardOpen)
  const dailyRewardPopupOpen = useGameStore((state) => state.dailyRewardPopupOpen)
  const pvpRequestDialogOpen = useGameStore((state) => state.pvpRequestDialogOpen)
  const pvpIncomingDialogOpen = useGameStore((state) => state.pvpIncomingDialogOpen)
  const pvpWaitingForOpponent = useGameStore((state) => state.pvpWaitingForOpponent)
  const tradeInitiateDialogOpen = useGameStore((state) => state.tradeInitiateDialogOpen)
  const tradeIncomingDialogOpen = useGameStore((state) => state.tradeIncomingDialogOpen)
  const tradeNegotiationOpen = useGameStore((state) => state.tradeNegotiationOpen)
  const tradeCompletedOpen = useGameStore((state) => state.tradeCompletedOpen)

  const anyUIOpen = dialogueOpen ||
    shopOpen ||
    sellDialogueOpen ||
    sellShopOpen ||
    battleDialogueOpen ||
    battleCardSelectOpen ||
    battleArenaOpen ||
    inventoryOpen ||
    chatOpen ||
    leaderboardOpen ||
    dailyRewardPopupOpen ||
    pvpRequestDialogOpen ||
    pvpIncomingDialogOpen ||
    pvpWaitingForOpponent ||
    tradeInitiateDialogOpen ||
    tradeIncomingDialogOpen ||
    tradeNegotiationOpen ||
    tradeCompletedOpen

  // Show pending quest completion when all UIs are closed
  useEffect(() => {
    if (!anyUIOpen && !questCompletionPopupOpen && pendingQuestCompletions.length > 0) {
      showNextQuestCompletion()
    }
  }, [anyUIOpen, questCompletionPopupOpen, pendingQuestCompletions.length, showNextQuestCompletion])

  const handleDismiss = useCallback(() => {
    dismissQuestCompletion()
  }, [dismissQuestCompletion])

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    if (questCompletionPopupOpen && currentQuestCompletion) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [questCompletionPopupOpen, currentQuestCompletion, handleDismiss])

  if (!questCompletionPopupOpen || !currentQuestCompletion) return null

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
      <div
        className="bg-gradient-to-r from-green-600 to-emerald-600 border-2 border-green-400 rounded-xl px-6 py-4 shadow-2xl shadow-green-500/30 cursor-pointer"
        onClick={handleDismiss}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎉</span>
          <div>
            <p className="text-white font-bold text-lg">Quest Complete!</p>
            <p className="text-green-200 text-sm">{currentQuestCompletion.questName}</p>
          </div>
          <div className="ml-4 bg-yellow-500/20 border border-yellow-400 rounded-lg px-3 py-1">
            <span className="text-yellow-400 font-bold">+{currentQuestCompletion.reward}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
