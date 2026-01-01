import type { KeyboardControlsEntry } from '@react-three/drei'

export enum Controls {
  forward = 'forward',
  backward = 'backward',
  left = 'left',
  right = 'right',
  jump = 'jump',
  rotateLeft = 'rotateLeft',
  rotateRight = 'rotateRight',
  zoomIn = 'zoomIn',
  zoomOut = 'zoomOut',
  interact = 'interact',
  inventory = 'inventory',
  chat = 'chat',
}

export const controlsMap: KeyboardControlsEntry<Controls>[] = [
  { name: Controls.forward, keys: ['KeyW', 'ArrowUp'] },
  { name: Controls.backward, keys: ['KeyS', 'ArrowDown'] },
  { name: Controls.left, keys: ['KeyA', 'ArrowLeft'] },
  { name: Controls.right, keys: ['KeyD', 'ArrowRight'] },
  { name: Controls.jump, keys: ['Space'] },
  { name: Controls.rotateLeft, keys: ['KeyQ'] },
  { name: Controls.rotateRight, keys: ['KeyE'] },
  { name: Controls.zoomIn, keys: ['KeyI'] },
  { name: Controls.zoomOut, keys: ['KeyO'] },
  { name: Controls.interact, keys: ['KeyT'] },
  { name: Controls.inventory, keys: ['KeyB'] },
  { name: Controls.chat, keys: ['KeyC'] },
]
