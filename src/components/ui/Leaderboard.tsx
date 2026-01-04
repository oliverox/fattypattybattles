import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useGameStore } from '@/stores/gameStore'

type LeaderboardCategory = 'wins' | 'coins' | 'cards' | 'time'

const TABS: { key: LeaderboardCategory; label: string }[] = [
  { key: 'wins', label: 'Wins' },
  { key: 'coins', label: 'Coins' },
  { key: 'cards', label: 'Cards' },
  { key: 'time', label: 'Time' },
]

function formatValue(category: LeaderboardCategory, value: number): string {
  switch (category) {
    case 'wins':
      return `${value.toLocaleString()} wins`
    case 'coins':
      return `${value.toLocaleString()} coins`
    case 'cards':
      return `${value.toLocaleString()} cards`
    case 'time': {
      const totalSeconds = value
      const days = Math.floor(totalSeconds / 86400)
      const hours = Math.floor((totalSeconds % 86400) / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)

      if (days > 0) {
        return `${days}d ${hours}h`
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`
      } else {
        return `${minutes}m`
      }
    }
    default:
      return value.toLocaleString()
  }
}

function getRankDisplay(rank: number): { icon: string; className: string } {
  switch (rank) {
    case 1:
      return { icon: '🥇', className: 'text-yellow-400' }
    case 2:
      return { icon: '🥈', className: 'text-gray-300' }
    case 3:
      return { icon: '🥉', className: 'text-orange-400' }
    default:
      return { icon: `${rank}.`, className: 'text-gray-400' }
  }
}

export function Leaderboard() {
  const leaderboardOpen = useGameStore((state) => state.leaderboardOpen)
  const setLeaderboardOpen = useGameStore((state) => state.setLeaderboardOpen)

  const [activeTab, setActiveTab] = useState<LeaderboardCategory>('wins')

  const leaderboardData = useQuery(
    api.leaderboard.getLeaderboard,
    leaderboardOpen ? { category: activeTab } : 'skip'
  )

  // Handle ESC key to close
  useEffect(() => {
    if (!leaderboardOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLeaderboardOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [leaderboardOpen, setLeaderboardOpen])

  if (!leaderboardOpen) {
    return null
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={() => setLeaderboardOpen(false)}
      />

      {/* Modal */}
      <div className="relative bg-gray-900/95 border-2 border-yellow-500 rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col shadow-2xl shadow-yellow-500/20">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
            <span>🏆</span>
            <span>Leaderboard</span>
          </h2>
          <button
            onClick={() => setLeaderboardOpen(false)}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-3 py-2 rounded-lg font-bold transition-colors ${
                activeTab === tab.key
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {leaderboardData === undefined ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">Loading...</div>
            </div>
          ) : leaderboardData.entries.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">No entries yet</div>
            </div>
          ) : (
            <div className="space-y-1">
              {leaderboardData.entries.map((entry: { rank: number; username: string; value: number; isCurrentUser: boolean }) => {
                const rankInfo = getRankDisplay(entry.rank)
                return (
                  <div
                    key={`${entry.rank}-${entry.username}`}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                      entry.isCurrentUser
                        ? 'bg-yellow-500/20 border border-yellow-500/50'
                        : 'bg-gray-800/50 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 text-center font-bold ${rankInfo.className}`}>
                        {rankInfo.icon}
                      </span>
                      <span className={`font-medium ${entry.isCurrentUser ? 'text-yellow-400' : 'text-white'}`}>
                        {entry.username}
                        {entry.isCurrentUser && <span className="text-xs ml-1 text-yellow-500">(You)</span>}
                      </span>
                    </div>
                    <span className="text-gray-300 font-mono">
                      {formatValue(activeTab, entry.value)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* User's rank if not in top 50 */}
        {leaderboardData?.userRank && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-center gap-3">
                <span className="w-8 text-center font-bold text-gray-400">
                  #{leaderboardData.userRank.rank}
                </span>
                <span className="font-medium text-yellow-400">Your Rank</span>
              </div>
              <span className="text-gray-300 font-mono">
                {formatValue(activeTab, leaderboardData.userRank.value)}
              </span>
            </div>
          </div>
        )}

        {/* Close hint */}
        <p className="text-gray-500 text-sm mt-4 text-center">
          Press <span className="text-gray-400">ESC</span> to close
        </p>
      </div>
    </div>
  )
}
