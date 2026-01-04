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

interface GameState {
  playerPosition: Vector3
  isMoving: boolean
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
  // Chat
  chatOpen: boolean
  // Leaderboard
  leaderboardOpen: boolean
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
  // Mobile Touch Controls
  touchControlsVisible: boolean
  touchInput: TouchInput
  // Setters
  setPlayerPosition: (position: Vector3) => void
  setIsMoving: (moving: boolean) => void
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
  setChatOpen: (open: boolean) => void
  setLeaderboardOpen: (open: boolean) => void
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
  // Touch Controls
  setTouchControlsVisible: (visible: boolean) => void
  toggleTouchControls: () => void
  setTouchInput: (key: keyof TouchInput, pressed: boolean) => void
}

export const useGameStore = create<GameState>((set) => ({
  playerPosition: new Vector3(0, 1, 0),
  isMoving: false,
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
  // Chat
  chatOpen: false,
  // Leaderboard
  leaderboardOpen: false,
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
  // Mobile Touch Controls
  touchControlsVisible: true,
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
  setNearNPC: (near) => set({ nearNPC: near }),
  setDialogueOpen: (open) => set({ dialogueOpen: open }),
  setShopOpen: (open) => set({ shopOpen: open }),
  setActiveShop: (shop) => set({ activeShop: shop }),
  setNearSellNPC: (near) => set({ nearSellNPC: near }),
  setSellDialogueOpen: (open) => set({ sellDialogueOpen: open }),
  setSellShopOpen: (open) => set({ sellShopOpen: open }),
  setActiveSellView: (view) => set({ activeSellView: view }),
  // Battle NPC
  setNearBattleNPC: (near) => set({ nearBattleNPC: near }),
  setBattleDialogueOpen: (open) => set({ battleDialogueOpen: open }),
  setBattleCardSelectOpen: (open) => set({ battleCardSelectOpen: open }),
  setBattleArenaOpen: (open) => set({ battleArenaOpen: open }),
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
  setInventoryOpen: (open) => set({ inventoryOpen: open }),
  setHeldCardId: (cardId) => set({ heldCardId: cardId }),
  setChatOpen: (open) => set({ chatOpen: open }),
  setLeaderboardOpen: (open) => set({ leaderboardOpen: open }),
  closeAllShopUI: () => set({ dialogueOpen: false, shopOpen: false, activeShop: null }),
  // PvP Battle
  setPvpTargetPlayer: (player) => set({ pvpTargetPlayer: player }),
  setPvpRequestDialogOpen: (open) => set({ pvpRequestDialogOpen: open }),
  setPvpIncomingDialogOpen: (open) => set({ pvpIncomingDialogOpen: open }),
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
    chatOpen: false,
    leaderboardOpen: false,
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
  }),
  // Touch Controls
  setTouchControlsVisible: (visible) => set({ touchControlsVisible: visible }),
  toggleTouchControls: () => set((state) => ({ touchControlsVisible: !state.touchControlsVisible })),
  setTouchInput: (key, pressed) => set((state) => ({
    touchInput: { ...state.touchInput, [key]: pressed }
  })),
}))
