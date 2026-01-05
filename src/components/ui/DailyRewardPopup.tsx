import { useEffect, useCallback, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { useUser } from '@clerk/tanstack-react-start'
import { api } from '../../../convex/_generated/api'
import { useGameStore } from '@/stores/gameStore'

export function DailyRewardPopup() {
  const { user } = useUser()
  const dailyRewardPopupOpen = useGameStore((state) => state.dailyRewardPopupOpen)
  const setDailyRewardPopupOpen = useGameStore((state) => state.setDailyRewardPopupOpen)

  const [claimingDaily, setClaimingDaily] = useState(false)
  const [claimingQuest, setClaimingQuest] = useState<string | null>(null)
  const [claimResult, setClaimResult] = useState<{
    type: 'daily' | 'quest'
    coins: number
    bonusPack?: string | null
  } | null>(null)

  const dailyStatus = useQuery(
    api.dailyRewards.getDailyRewardStatus,
    user?.id ? { clerkId: user.id } : 'skip'
  )

  const dailyQuests = useQuery(
    api.dailyRewards.getDailyQuests,
    user?.id ? { clerkId: user.id } : 'skip'
  )

  const claimDailyReward = useMutation(api.dailyRewards.claimDailyReward)
  const claimQuestReward = useMutation(api.dailyRewards.claimQuestReward)
  const refreshQuests = useMutation(api.dailyRewards.refreshDailyQuests)

  // Refresh quests if needed
  useEffect(() => {
    if (dailyQuests?.needsRefresh && user?.id) {
      refreshQuests({ clerkId: user.id })
    }
  }, [dailyQuests?.needsRefresh, user?.id, refreshQuests])

  const handleClose = useCallback(() => {
    setDailyRewardPopupOpen(false)
    setClaimResult(null)
  }, [setDailyRewardPopupOpen])

  const handleClaimDaily = useCallback(async () => {
    if (!user?.id || claimingDaily) return

    setClaimingDaily(true)
    try {
      const result = await claimDailyReward({ clerkId: user.id })
      setClaimResult({
        type: 'daily',
        coins: result.coinsAwarded,
        bonusPack: result.bonusPack,
      })
    } catch (err) {
      console.error('Failed to claim daily reward:', err)
    } finally {
      setClaimingDaily(false)
    }
  }, [user?.id, claimingDaily, claimDailyReward])

  const handleClaimQuest = useCallback(async (questId: string) => {
    if (!user?.id || claimingQuest) return

    setClaimingQuest(questId)
    try {
      const result = await claimQuestReward({ clerkId: user.id, questId })
      setClaimResult({
        type: 'quest',
        coins: result.coinsAwarded,
      })
    } catch (err) {
      console.error('Failed to claim quest reward:', err)
    } finally {
      setClaimingQuest(null)
    }
  }, [user?.id, claimingQuest, claimQuestReward])

  useEffect(() => {
    if (!dailyRewardPopupOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dailyRewardPopupOpen, handleClose])

  if (!dailyRewardPopupOpen) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-gray-900/95 border-2 border-yellow-500 rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl shadow-yellow-500/20">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
            <span className="text-3xl">🎁</span> Daily Rewards
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Claim Result Animation */}
        {claimResult && (
          <div className="mb-4 p-4 bg-yellow-500/20 border border-yellow-500 rounded-lg text-center animate-pulse">
            <p className="text-yellow-400 font-bold text-lg">
              +{claimResult.coins} PattyCoins!
            </p>
            {claimResult.bonusPack && (
              <p className="text-green-400 mt-1">+ 1 Common Pack!</p>
            )}
          </div>
        )}

        {/* Daily Login Bonus Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white">Login Bonus</h3>
            {dailyStatus && (
              <span className="text-orange-400 text-sm flex items-center gap-1">
                🔥 {dailyStatus.currentStreak} day streak
              </span>
            )}
          </div>

          {/* 7-day calendar */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dailyStatus?.allRewards.map((reward: { day: number; coins: number; bonus?: string }, index: number) => {
              const day = index + 1
              const isPast = dailyStatus.claimedToday
                ? day <= dailyStatus.streakDay
                : day < dailyStatus.streakDay
              const isCurrent = dailyStatus.claimedToday
                ? false
                : day === dailyStatus.streakDay
              const isFuture = dailyStatus.claimedToday
                ? day > dailyStatus.streakDay
                : day > dailyStatus.streakDay

              return (
                <div
                  key={day}
                  className={`relative p-2 rounded-lg text-center border-2 transition-all ${
                    isCurrent
                      ? 'border-yellow-400 bg-yellow-500/20 scale-105'
                      : isPast
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-gray-600 bg-gray-800/50'
                  }`}
                >
                  <p className="text-xs text-gray-400 mb-1">Day {day}</p>
                  <p className={`font-bold text-sm ${isCurrent ? 'text-yellow-400' : isPast ? 'text-green-400' : 'text-gray-400'}`}>
                    {reward.coins}
                  </p>
                  {reward.bonus && (
                    <p className="text-xs mt-1">📦</p>
                  )}
                  {isPast && !isCurrent && (
                    <span className="absolute top-1 right-1 text-green-400 text-xs">✓</span>
                  )}
                  {isCurrent && (
                    <span className="absolute top-1 right-1 text-yellow-400 text-xs">⭐</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Claim button */}
          {dailyStatus?.canClaim ? (
            <button
              onClick={handleClaimDaily}
              disabled={claimingDaily}
              className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 text-black font-bold py-3 px-4 rounded-lg transition-colors"
            >
              {claimingDaily ? 'Claiming...' : `Claim ${dailyStatus.todayReward?.coins ?? 0} Coins${dailyStatus.todayReward?.bonus ? ' + Pack' : ''}`}
            </button>
          ) : (
            <div className="w-full bg-gray-700 text-gray-400 font-bold py-3 px-4 rounded-lg text-center">
              ✓ Already claimed today
            </div>
          )}

          {dailyStatus?.willResetStreak && (
            <p className="text-red-400 text-xs mt-2 text-center">
              Your streak has reset because you missed a day
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-4" />

        {/* Daily Quests Section */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3">Daily Quests</h3>

          {dailyQuests?.quests && dailyQuests.quests.length > 0 ? (
            <div className="space-y-3">
              {dailyQuests.quests.map((quest: { id: string; name: string; target: number; reward: number; progress: number; completed: boolean; claimed: boolean }) => {
                const progressPercent = Math.min(100, (quest.progress / quest.target) * 100)

                return (
                  <div
                    key={quest.id}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      quest.claimed
                        ? 'border-gray-600 bg-gray-800/30 opacity-60'
                        : quest.completed
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-cyan-500/50 bg-cyan-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-medium ${quest.claimed ? 'text-gray-500' : 'text-white'}`}>
                        {quest.name}
                      </span>
                      <span className={`text-sm font-bold ${quest.claimed ? 'text-gray-500' : 'text-yellow-400'}`}>
                        +{quest.reward}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full transition-all ${
                          quest.completed ? 'bg-green-500' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {quest.progress}/{quest.target}
                      </span>

                      {quest.completed && !quest.claimed && (
                        <button
                          onClick={() => handleClaimQuest(quest.id)}
                          disabled={claimingQuest === quest.id}
                          className="bg-green-500 hover:bg-green-400 disabled:bg-gray-600 text-black text-xs font-bold py-1 px-3 rounded transition-colors"
                        >
                          {claimingQuest === quest.id ? '...' : 'Claim'}
                        </button>
                      )}

                      {quest.claimed && (
                        <span className="text-green-400 text-xs">✓ Claimed</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Loading quests...</p>
          )}
        </div>

        {/* Close hint */}
        <p className="text-gray-500 text-sm mt-4 text-center">
          Press <span className="text-gray-400">ESC</span> to close
        </p>
      </div>
    </div>
  )
}
