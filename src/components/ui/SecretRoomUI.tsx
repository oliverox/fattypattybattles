import { useEffect, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useGameStore } from '@/stores/gameStore'

export function SecretRoomUI() {
  const secretRoomUIOpen = useGameStore((state) => state.secretRoomUIOpen)
  const exitSecretRoom = useGameStore((state) => state.exitSecretRoom)
  const [tagGranted, setTagGranted] = useState(false)
  const [alreadyHad, setAlreadyHad] = useState(false)

  const discoverSecret = useMutation(api.users.discoverSecret)

  // Grant the tag when the UI opens
  useEffect(() => {
    if (secretRoomUIOpen && !tagGranted) {
      discoverSecret()
        .then((result) => {
          setTagGranted(true)
          if (result?.alreadyDiscovered) {
            setAlreadyHad(true)
          }
        })
        .catch((err) => {
          console.error('Failed to grant secret tag:', err)
        })
    }
  }, [secretRoomUIOpen, tagGranted, discoverSecret])

  // Reset state when UI closes
  useEffect(() => {
    if (!secretRoomUIOpen) {
      setTagGranted(false)
      setAlreadyHad(false)
    }
  }, [secretRoomUIOpen])

  const handleExit = () => {
    exitSecretRoom()
  }

  if (!secretRoomUIOpen) return null

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
      {/* Compact dialog - no backdrop so you can see the room */}
      <div className="bg-gradient-to-b from-purple-900/90 to-black/90 border-2 border-purple-500 rounded-xl p-4 shadow-2xl shadow-purple-500/30">
        {/* Content */}
        <div className="text-center space-y-3">
          {/* Title with icon */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">{alreadyHad ? '🔮' : '🏆'}</span>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {alreadyHad ? 'Welcome Back!' : 'Secret Found!'}
            </h2>
          </div>

          {/* Tag reward */}
          {!alreadyHad && (
            <div className="bg-purple-500/20 border border-purple-400 rounded-lg px-3 py-2">
              <p className="text-purple-300 text-xs">Reward Unlocked</p>
              <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-3 py-1 rounded-lg text-sm mt-1">
                [SECRET FINDER]
              </div>
            </div>
          )}

          {alreadyHad && (
            <p className="text-purple-400 text-sm">
              You already have <span className="text-white font-bold">[SECRET FINDER]</span>
            </p>
          )}

          {/* Exit button */}
          <button
            onClick={handleExit}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 text-sm"
          >
            Exit Secret Room
          </button>
        </div>
      </div>
    </div>
  )
}
