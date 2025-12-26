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
  // Inventory
  inventoryOpen: boolean
  heldCardId: string | null
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
  setInventoryOpen: (open: boolean) => void
  setHeldCardId: (cardId: string | null) => void
  closeAllShopUI: () => void
  closeAllUI: () => void
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
  // Inventory
  inventoryOpen: false,
  heldCardId: null,
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
  setInventoryOpen: (open) => set({ inventoryOpen: open }),
  setHeldCardId: (cardId) => set({ heldCardId: cardId }),
  closeAllShopUI: () => set({ dialogueOpen: false, shopOpen: false, activeShop: null }),
  closeAllUI: () => set({
    dialogueOpen: false,
    shopOpen: false,
    activeShop: null,
    sellDialogueOpen: false,
    sellShopOpen: false,
    activeSellView: null,
    inventoryOpen: false,
  }),
  // Touch Controls
  setTouchControlsVisible: (visible) => set({ touchControlsVisible: visible }),
  toggleTouchControls: () => set((state) => ({ touchControlsVisible: !state.touchControlsVisible })),
  setTouchInput: (key, pressed) => set((state) => ({
    touchInput: { ...state.touchInput, [key]: pressed }
  })),
}))
