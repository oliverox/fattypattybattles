import { create } from 'zustand'
import { Vector3 } from 'three'

interface TouchInput {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  turnLeft: boolean
  turnRight: boolean
  jump: boolean
  zoomIn: boolean
  zoomOut: boolean
  interact: boolean
  chat: boolean
}

interface BattleCard {
  cardId: string
  name: string
  attack: number
  defense: number
  rarity: string
  position: number
}

interface BattleData {
  playerCards: BattleCard[]
  npcCards: BattleCard[]
  battleId: string
}

interface BattleResult {
  winner: 'player' | 'npc'
  playerWins: number
  npcWins: number
  rounds: Array<{
    round: number
    playerCard: BattleCard & { currentDefense: number }
    npcCard: BattleCard & { currentDefense: number }
    winner: 'player' | 'npc' | 'draw'
    damage: number
  }>
  coinsWon: number
  packWon: string | null
  newBalance: number
}

interface PvpBattleResult {
  winnerId: string
  winnerUsername: string
  loserId: string
  loserUsername: string
  winnerRole: 'challenger' | 'target'
  challengerWins: number
  targetWins: number
  rounds: Array<{
    round: number
    challengerCard: BattleCard & { currentDefense: number }
    targetCard: BattleCard & { currentDefense: number }
    winner: 'challenger' | 'target' | 'draw'
    damage: number
  }>
  coinsWon: number
  packWon: string | null
  winnerNewBalance: number
}

interface PvpTargetPlayer {
  userId: string
  username: string
}

interface TradePartner {
  clerkId: string
  username: string
}

interface TradeCardOffer {
  inventoryId: string
  cardId: string
  cardName: string
  rarity: string
}

interface TradeResult {
  partnerUsername: string
  cardsGiven: TradeCardOffer[]
  cardsReceived: TradeCardOffer[]
  coinsGiven: number
  coinsReceived: number
}

interface QuestCompletionNotification {
  questName: string
  reward: number
}

interface GameState {
  playerPosition: Vector3
  isMoving: boolean
  // Respawn flag (set when returning to tab)
  shouldRespawn: boolean
  // Last movement timestamp for idle detection
  lastMovementTime: number
  // Shop NPC
  nearNPC: boolean
  dialogueOpen: boolean
  shopOpen: boolean
  activeShop: 'packs' | 'luck' | null
  // Sell NPC
  nearSellNPC: boolean
  sellDialogueOpen: boolean
  sellShopOpen: boolean
  activeSellView: 'appraise' | 'sell' | null
  // Battle NPC
  nearBattleNPC: boolean
  battleDialogueOpen: boolean
  battleCardSelectOpen: boolean
  battleArenaOpen: boolean
  selectedBattleCards: Array<{ cardId: string; position: number }>
  battleData: BattleData | null
  battleResult: BattleResult | null
  // Inventory
  inventoryOpen: boolean
  heldCardId: string | null
  // Pack Results (when pack is opened and showing cards)
  packResultsOpen: boolean
  // Chat
  chatOpen: boolean
  // Leaderboard
  leaderboardOpen: boolean
  // Daily Rewards
  dailyRewardPopupOpen: boolean
  // PvP Battle
  pvpTargetPlayer: PvpTargetPlayer | null
  pvpRequestDialogOpen: boolean
  pvpIncomingDialogOpen: boolean
  pvpIncomingRequestId: string | null
  pvpWaitingForOpponent: boolean
  pvpBattleRequestId: string | null
  isPvpBattle: boolean
  pvpOpponentUsername: string | null
  pvpBattleResult: PvpBattleResult | null
  // Trading
  tradeInitiateDialogOpen: boolean
  tradeIncomingDialogOpen: boolean
  tradeNegotiationOpen: boolean
  tradeCompletedOpen: boolean
  tradeRequestId: string | null
  tradePartner: TradePartner | null
  tradeResult: TradeResult | null
  // Mobile Touch Controls
  touchControlsVisible: boolean
  touchInput: TouchInput
  // Quest Completion Notifications
  pendingQuestCompletions: QuestCompletionNotification[]
  questCompletionPopupOpen: boolean
  currentQuestCompletion: QuestCompletionNotification | null
  // Setters
  setPlayerPosition: (position: Vector3) => void
  setIsMoving: (moving: boolean) => void
  setShouldRespawn: (respawn: boolean) => void
  setLastMovementTime: (time: number) => void
  setNearNPC: (near: boolean) => void
  setDialogueOpen: (open: boolean) => void
  setShopOpen: (open: boolean) => void
  setActiveShop: (shop: 'packs' | 'luck' | null) => void
  setNearSellNPC: (near: boolean) => void
  setSellDialogueOpen: (open: boolean) => void
  setSellShopOpen: (open: boolean) => void
  setActiveSellView: (view: 'appraise' | 'sell' | null) => void
  // Battle NPC
  setNearBattleNPC: (near: boolean) => void
  setBattleDialogueOpen: (open: boolean) => void
  setBattleCardSelectOpen: (open: boolean) => void
  setBattleArenaOpen: (open: boolean) => void
  setSelectedBattleCards: (cards: Array<{ cardId: string; position: number }>) => void
  setBattleData: (data: BattleData | null) => void
  setBattleResult: (result: BattleResult | null) => void
  closeBattleUI: () => void
  setInventoryOpen: (open: boolean) => void
  setHeldCardId: (cardId: string | null) => void
  setPackResultsOpen: (open: boolean) => void
  setChatOpen: (open: boolean) => void
  setLeaderboardOpen: (open: boolean) => void
  setDailyRewardPopupOpen: (open: boolean) => void
  closeAllShopUI: () => void
  closeAllUI: () => void
  // PvP Battle
  setPvpTargetPlayer: (player: PvpTargetPlayer | null) => void
  setPvpRequestDialogOpen: (open: boolean) => void
  setPvpIncomingDialogOpen: (open: boolean) => void
  setPvpIncomingRequestId: (id: string | null) => void
  setPvpWaitingForOpponent: (waiting: boolean) => void
  setPvpBattleRequestId: (id: string | null) => void
  setIsPvpBattle: (isPvp: boolean) => void
  setPvpOpponentUsername: (username: string | null) => void
  setPvpBattleResult: (result: PvpBattleResult | null) => void
  closePvpUI: () => void
  // Trading
  setTradeInitiateDialogOpen: (open: boolean) => void
  setTradeIncomingDialogOpen: (open: boolean) => void
  setTradeNegotiationOpen: (open: boolean) => void
  setTradeCompletedOpen: (open: boolean) => void
  setTradeRequestId: (id: string | null) => void
  setTradePartner: (partner: TradePartner | null) => void
  setTradeResult: (result: TradeResult | null) => void
  closeTradeUI: () => void
  // Touch Controls
  setTouchControlsVisible: (visible: boolean) => void
  toggleTouchControls: () => void
  setTouchInput: (key: keyof TouchInput, pressed: boolean) => void
  // Quest Completion
  addQuestCompletion: (notification: QuestCompletionNotification) => void
  showNextQuestCompletion: () => void
  dismissQuestCompletion: () => void
  isAnyUIOpen: () => boolean
}

export const useGameStore = create<GameState>((set) => ({
  playerPosition: new Vector3(0, 1, 0),
  isMoving: false,
  shouldRespawn: false,
  lastMovementTime: Date.now(),
  // Shop NPC
  nearNPC: false,
  dialogueOpen: false,
  shopOpen: false,
  activeShop: null,
  // Sell NPC
  nearSellNPC: false,
  sellDialogueOpen: false,
  sellShopOpen: false,
  activeSellView: null,
  // Battle NPC
  nearBattleNPC: false,
  battleDialogueOpen: false,
  battleCardSelectOpen: false,
  battleArenaOpen: false,
  selectedBattleCards: [],
  battleData: null,
  battleResult: null,
  // Inventory
  inventoryOpen: false,
  heldCardId: null,
  // Pack Results
  packResultsOpen: false,
  // Chat
  chatOpen: false,
  // Leaderboard
  leaderboardOpen: false,
  // Daily Rewards
  dailyRewardPopupOpen: false,
  // PvP Battle
  pvpTargetPlayer: null,
  pvpRequestDialogOpen: false,
  pvpIncomingDialogOpen: false,
  pvpIncomingRequestId: null,
  pvpWaitingForOpponent: false,
  pvpBattleRequestId: null,
  isPvpBattle: false,
  pvpOpponentUsername: null,
  pvpBattleResult: null,
  // Trading
  tradeInitiateDialogOpen: false,
  tradeIncomingDialogOpen: false,
  tradeNegotiationOpen: false,
  tradeCompletedOpen: false,
  tradeRequestId: null,
  tradePartner: null,
  tradeResult: null,
  // Mobile Touch Controls
  touchControlsVisible: true,
  // Quest Completion Notifications
  pendingQuestCompletions: [],
  questCompletionPopupOpen: false,
  currentQuestCompletion: null,
  touchInput: {
    forward: false,
    backward: false,
    left: false,
    right: false,
    turnLeft: false,
    turnRight: false,
    jump: false,
    zoomIn: false,
    zoomOut: false,
    interact: false,
    chat: false,
  },
  // Setters
  setPlayerPosition: (position) => set({ playerPosition: position }),
  setIsMoving: (moving) => set({ isMoving: moving }),
  setShouldRespawn: (respawn) => set({ shouldRespawn: respawn }),
  setLastMovementTime: (time) => set({ lastMovementTime: time }),
  setNearNPC: (near) => set({ nearNPC: near }),
  setDialogueOpen: (open) => set({ dialogueOpen: open, ...(open && { lastMovementTime: Date.now() }) }),
  setShopOpen: (open) => set({ shopOpen: open, ...(open && { lastMovementTime: Date.now() }) }),
  setActiveShop: (shop) => set({ activeShop: shop }),
  setNearSellNPC: (near) => set({ nearSellNPC: near }),
  setSellDialogueOpen: (open) => set({ sellDialogueOpen: open, ...(open && { lastMovementTime: Date.now() }) }),
  setSellShopOpen: (open) => set({ sellShopOpen: open, ...(open && { lastMovementTime: Date.now() }) }),
  setActiveSellView: (view) => set({ activeSellView: view }),
  // Battle NPC
  setNearBattleNPC: (near) => set({ nearBattleNPC: near }),
  setBattleDialogueOpen: (open) => set({ battleDialogueOpen: open, ...(open && { lastMovementTime: Date.now() }) }),
  setBattleCardSelectOpen: (open) => set({ battleCardSelectOpen: open, ...(open && { lastMovementTime: Date.now() }) }),
  setBattleArenaOpen: (open) => set({ battleArenaOpen: open, ...(open && { lastMovementTime: Date.now() }) }),
  setSelectedBattleCards: (cards) => set({ selectedBattleCards: cards }),
  setBattleData: (data) => set({ battleData: data }),
  setBattleResult: (result) => set({ battleResult: result }),
  closeBattleUI: () => set({
    battleDialogueOpen: false,
    battleCardSelectOpen: false,
    battleArenaOpen: false,
    selectedBattleCards: [],
    battleData: null,
    battleResult: null,
  }),
  setInventoryOpen: (open) => set({ inventoryOpen: open, ...(open && { lastMovementTime: Date.now() }) }),
  setHeldCardId: (cardId) => set({ heldCardId: cardId }),
  setPackResultsOpen: (open) => set({ packResultsOpen: open }),
  setChatOpen: (open) => set({ chatOpen: open, ...(open && { lastMovementTime: Date.now() }) }),
  setLeaderboardOpen: (open) => set({ leaderboardOpen: open, ...(open && { lastMovementTime: Date.now() }) }),
  setDailyRewardPopupOpen: (open) => set({ dailyRewardPopupOpen: open }),
  closeAllShopUI: () => set({ dialogueOpen: false, shopOpen: false, activeShop: null, packResultsOpen: false }),
  // PvP Battle
  setPvpTargetPlayer: (player) => set({ pvpTargetPlayer: player }),
  setPvpRequestDialogOpen: (open) => set({ pvpRequestDialogOpen: open, ...(open && { lastMovementTime: Date.now() }) }),
  setPvpIncomingDialogOpen: (open) => set({ pvpIncomingDialogOpen: open, ...(open && { lastMovementTime: Date.now() }) }),
  setPvpIncomingRequestId: (id) => set({ pvpIncomingRequestId: id }),
  setPvpWaitingForOpponent: (waiting) => set({ pvpWaitingForOpponent: waiting }),
  setPvpBattleRequestId: (id) => set({ pvpBattleRequestId: id }),
  setIsPvpBattle: (isPvp) => set({ isPvpBattle: isPvp }),
  setPvpOpponentUsername: (username) => set({ pvpOpponentUsername: username }),
  setPvpBattleResult: (result) => set({ pvpBattleResult: result }),
  closePvpUI: () => set({
    pvpTargetPlayer: null,
    pvpRequestDialogOpen: false,
    pvpIncomingDialogOpen: false,
    pvpIncomingRequestId: null,
    pvpWaitingForOpponent: false,
    pvpBattleRequestId: null,
    isPvpBattle: false,
    pvpOpponentUsername: null,
    pvpBattleResult: null,
    battleCardSelectOpen: false,
    battleArenaOpen: false,
    selectedBattleCards: [],
    battleData: null,
    battleResult: null,
  }),
  // Trading
  setTradeInitiateDialogOpen: (open) => set({ tradeInitiateDialogOpen: open }),
  setTradeIncomingDialogOpen: (open) => set({ tradeIncomingDialogOpen: open }),
  setTradeNegotiationOpen: (open) => set({ tradeNegotiationOpen: open }),
  setTradeCompletedOpen: (open) => set({ tradeCompletedOpen: open }),
  setTradeRequestId: (id) => set({ tradeRequestId: id }),
  setTradePartner: (partner) => set({ tradePartner: partner }),
  setTradeResult: (result) => set({ tradeResult: result }),
  closeTradeUI: () => set({
    tradeInitiateDialogOpen: false,
    tradeIncomingDialogOpen: false,
    tradeNegotiationOpen: false,
    tradeCompletedOpen: false,
    tradeRequestId: null,
    tradePartner: null,
    tradeResult: null,
  }),
  closeAllUI: () => set({
    dialogueOpen: false,
    shopOpen: false,
    activeShop: null,
    sellDialogueOpen: false,
    sellShopOpen: false,
    activeSellView: null,
    battleDialogueOpen: false,
    battleCardSelectOpen: false,
    battleArenaOpen: false,
    selectedBattleCards: [],
    battleData: null,
    battleResult: null,
    inventoryOpen: false,
    packResultsOpen: false,
    chatOpen: false,
    leaderboardOpen: false,
    dailyRewardPopupOpen: false,
    // PvP
    pvpTargetPlayer: null,
    pvpRequestDialogOpen: false,
    pvpIncomingDialogOpen: false,
    pvpIncomingRequestId: null,
    pvpWaitingForOpponent: false,
    pvpBattleRequestId: null,
    isPvpBattle: false,
    pvpOpponentUsername: null,
    pvpBattleResult: null,
    // Trading
    tradeInitiateDialogOpen: false,
    tradeIncomingDialogOpen: false,
    tradeNegotiationOpen: false,
    tradeCompletedOpen: false,
    tradeRequestId: null,
    tradePartner: null,
    tradeResult: null,
  }),
  // Touch Controls
  setTouchControlsVisible: (visible) => set({ touchControlsVisible: visible }),
  toggleTouchControls: () => set((state) => ({ touchControlsVisible: !state.touchControlsVisible })),
  setTouchInput: (key, pressed) => set((state) => ({
    touchInput: { ...state.touchInput, [key]: pressed }
  })),
  // Quest Completion
  addQuestCompletion: (notification) => set((state) => ({
    pendingQuestCompletions: [...state.pendingQuestCompletions, notification]
  })),
  showNextQuestCompletion: () => set((state) => {
    if (state.pendingQuestCompletions.length === 0) {
      return { questCompletionPopupOpen: false, currentQuestCompletion: null }
    }
    const [next, ...rest] = state.pendingQuestCompletions
    return {
      pendingQuestCompletions: rest,
      questCompletionPopupOpen: true,
      currentQuestCompletion: next ?? null
    }
  }),
  dismissQuestCompletion: () => set((state) => {
    // After dismissing, check if there are more
    if (state.pendingQuestCompletions.length > 0) {
      const [next, ...rest] = state.pendingQuestCompletions
      return {
        pendingQuestCompletions: rest,
        currentQuestCompletion: next ?? null
      }
    }
    return {
      questCompletionPopupOpen: false,
      currentQuestCompletion: null
    }
  }),
  isAnyUIOpen: () => {
    const state = useGameStore.getState()
    return (
      state.dialogueOpen ||
      state.shopOpen ||
      state.sellDialogueOpen ||
      state.sellShopOpen ||
      state.battleDialogueOpen ||
      state.battleCardSelectOpen ||
      state.battleArenaOpen ||
      state.inventoryOpen ||
      state.packResultsOpen ||
      state.chatOpen ||
      state.leaderboardOpen ||
      state.dailyRewardPopupOpen ||
      state.pvpRequestDialogOpen ||
      state.pvpIncomingDialogOpen ||
      state.pvpWaitingForOpponent ||
      state.tradeInitiateDialogOpen ||
      state.tradeIncomingDialogOpen ||
      state.tradeNegotiationOpen ||
      state.tradeCompletedOpen
    )
  },
}))
