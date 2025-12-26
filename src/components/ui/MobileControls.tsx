import { useCallback } from 'react'
import { useGameStore } from '@/stores/gameStore'

type TouchInputKey = 'forward' | 'backward' | 'left' | 'right' | 'turnLeft' | 'turnRight' | 'jump' | 'zoomIn' | 'zoomOut'

interface ControlButtonProps {
  inputKey: TouchInputKey
  children: React.ReactNode
  className?: string
}

function ControlButton({ inputKey, children, className = '' }: ControlButtonProps) {
  const setTouchInput = useGameStore((state) => state.setTouchInput)

  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    setTouchInput(inputKey, true)
  }, [inputKey, setTouchInput])

  const handleTouchEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    setTouchInput(inputKey, false)
  }, [inputKey, setTouchInput])

  return (
    <button
      className={`
        select-none touch-none
        bg-black/40 hover:bg-black/60 active:bg-white/30
        border-2 border-white/30 active:border-white/60
        rounded-xl
        flex items-center justify-center
        text-white font-bold text-lg
        transition-colors duration-100
        ${className}
      `}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {children}
    </button>
  )
}

export function MobileControls() {
  const touchControlsVisible = useGameStore((state) => state.touchControlsVisible)
  const toggleTouchControls = useGameStore((state) => state.toggleTouchControls)

  // Check if any UI is open - hide controls when UI is open
  const dialogueOpen = useGameStore((state) => state.dialogueOpen)
  const shopOpen = useGameStore((state) => state.shopOpen)
  const sellDialogueOpen = useGameStore((state) => state.sellDialogueOpen)
  const sellShopOpen = useGameStore((state) => state.sellShopOpen)
  const inventoryOpen = useGameStore((state) => state.inventoryOpen)

  const anyUIOpen = dialogueOpen || shopOpen || sellDialogueOpen || sellShopOpen || inventoryOpen

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* Toggle Button - Always visible */}
      <button
        onClick={toggleTouchControls}
        className="
          pointer-events-auto
          absolute top-20 left-4
          w-12 h-12
          bg-black/40 hover:bg-black/60
          border-2 border-white/30
          rounded-xl
          flex items-center justify-center
          text-white text-xl
          transition-colors
        "
        title={touchControlsVisible ? 'Hide Controls' : 'Show Controls'}
      >
        {touchControlsVisible ? '🎮' : '👆'}
      </button>

      {/* Controls - Only show when visible and no UI is open */}
      {touchControlsVisible && !anyUIOpen && (
        <>
          {/* Left Side - Movement & Turn Controls */}
          <div className="absolute bottom-8 left-4 pointer-events-auto">
            {/* D-Pad for Movement */}
            <div className="grid grid-cols-3 gap-1 mb-3">
              {/* Top row */}
              <div className="w-14 h-14" /> {/* Empty */}
              <ControlButton inputKey="forward" className="w-14 h-14">
                ↑
              </ControlButton>
              <div className="w-14 h-14" /> {/* Empty */}

              {/* Middle row */}
              <ControlButton inputKey="left" className="w-14 h-14">
                ←
              </ControlButton>
              <ControlButton inputKey="backward" className="w-14 h-14">
                ↓
              </ControlButton>
              <ControlButton inputKey="right" className="w-14 h-14">
                →
              </ControlButton>
            </div>

            {/* Turn Buttons */}
            <div className="flex gap-2 justify-center">
              <ControlButton inputKey="turnLeft" className="w-16 h-12">
                ↶
              </ControlButton>
              <ControlButton inputKey="turnRight" className="w-16 h-12">
                ↷
              </ControlButton>
            </div>
          </div>

          {/* Right Side - Jump & Zoom Controls */}
          <div className="absolute bottom-8 right-4 pointer-events-auto flex flex-col items-center gap-2">
            {/* Zoom In */}
            <ControlButton inputKey="zoomIn" className="w-14 h-12">
              🔍+
            </ControlButton>

            {/* Jump Button - Larger */}
            <ControlButton inputKey="jump" className="w-20 h-20 text-2xl">
              ⬆
            </ControlButton>

            {/* Zoom Out */}
            <ControlButton inputKey="zoomOut" className="w-14 h-12">
              🔍-
            </ControlButton>
          </div>
        </>
      )}
    </div>
  )
}
