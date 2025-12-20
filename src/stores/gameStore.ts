import { create } from 'zustand'
import { Vector3 } from 'three'

interface GameState {
  playerPosition: Vector3
  isMoving: boolean
  setPlayerPosition: (position: Vector3) => void
  setIsMoving: (moving: boolean) => void
}

export const useGameStore = create<GameState>((set) => ({
  playerPosition: new Vector3(0, 1, 0),
  isMoving: false,
  setPlayerPosition: (position) => set({ playerPosition: position }),
  setIsMoving: (moving) => set({ isMoving: moving }),
}))
