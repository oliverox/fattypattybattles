import { createFileRoute } from '@tanstack/react-router'
import { UserButton, useAuth } from '@clerk/tanstack-react-start'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { GameCanvas } from '@/components/game/GameCanvas'

export const Route = createFileRoute('/game')({
  component: GamePage,
})

function GamePage() {
  const { isLoaded, isSignedIn } = useAuth()
  const currentUser = useQuery(api.users.getCurrentUser)

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
        <p className="font-bold">{currentUser.username}</p>
        <p className="text-sm">PattyCoins: {currentUser.pattyCoins}</p>
      </div>
      <GameCanvas />
    </div>
  )
}
