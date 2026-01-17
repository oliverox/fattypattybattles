import { useState, useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { SignedIn, SignedOut, UserButton, useAuth } from '@clerk/tanstack-react-start'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { ProfileForm } from '@/components/auth/ProfileForm'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function LoadingScreen() {
  return (
    <div className="w-full h-full bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center p-4">
      <div className="text-white text-2xl">Loading...</div>
    </div>
  )
}

function AuthScreen() {
  return (
    <div className="w-full h-full bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        <img
          src="/logo.png?v=2"
          alt="Fatty Patty Battles"
          className="w-64 h-64 mx-auto mb-6 object-contain"
        />
        <p className="text-white/90 mb-8 text-lg">
          A multiplayer 3D card-battling game
        </p>
        <div className="space-x-4">
          <Link
            to="/sign-in"
            className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 inline-block"
          >
            Sign In
          </Link>
          <Link
            to="/sign-up"
            className="px-6 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 inline-block"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}

function GameScreen() {
  const currentUser = useQuery(api.users.getCurrentUser)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (currentUser === null) {
      const timer = setTimeout(() => setShowProfileForm(true), 500)
      return () => clearTimeout(timer)
    }
  }, [currentUser])

  // Press Enter to start playing
  useEffect(() => {
    if (!currentUser) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        navigate({ to: '/game' })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentUser, navigate])

  if (currentUser === undefined) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  if (currentUser === null) {
    if (!showProfileForm) {
      return (
        <div className="w-full h-full bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center">
          <div className="text-white text-2xl">Setting up your account...</div>
        </div>
      )
    }

    return (
      <div className="w-full h-full bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <UserButton />
        </div>
        <div className="w-full max-w-2xl">
          <h1 className="text-5xl font-bold text-white text-center mb-8">
            Create Your Character
          </h1>
          <ProfileForm />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center">
      <div className="absolute top-4 right-4">
        <UserButton />
      </div>
      <div className="text-center">
        <img
          src="/logo.png?v=2"
          alt="Fatty Patty Battles"
          className="w-48 h-48 mx-auto mb-4 object-contain"
        />
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome, {currentUser.username}!
        </h1>
        <p className="text-2xl text-white/90 mb-6">
          PattyCoins: {currentUser.pattyCoins}
        </p>
        <Link
          to="/game"
          className="px-8 py-4 bg-green-500 text-white rounded-lg font-bold text-xl hover:bg-green-600 inline-block"
        >
          Enter Game
        </Link>
        <p className="text-white/60 mt-4 text-sm">Press Enter to start</p>
      </div>
    </div>
  )
}

function HomePage() {
  const { isLoaded, isSignedIn } = useAuth()

  // Show loading screen during SSR or while auth is loading
  if (!isLoaded) {
    return (
      <div className="w-screen h-screen">
        <LoadingScreen />
      </div>
    )
  }

  return (
    <div className="w-screen h-screen">
      {isSignedIn ? <GameScreen /> : <AuthScreen />}
    </div>
  )
}
