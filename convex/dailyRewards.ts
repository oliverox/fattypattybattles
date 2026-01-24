import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Daily login bonus rewards - 7-day cycle
const DAILY_REWARDS = [
  { day: 1, coins: 10 },
  { day: 2, coins: 15 },
  { day: 3, coins: 20 },
  { day: 4, coins: 25 },
  { day: 5, coins: 30 },
  { day: 6, coins: 40 },
  { day: 7, coins: 50, bonus: "common_pack" },
];

// Quest pool - 3 random quests selected daily
const QUEST_POOL = [
  { id: "win_battle", name: "Win a Battle", target: 1, reward: 15 },
  { id: "win_battles_3", name: "Win 3 Battles", target: 3, reward: 40 },
  { id: "open_pack", name: "Open a Pack", target: 1, reward: 10 },
  { id: "open_packs_3", name: "Open 3 Packs", target: 3, reward: 25 },
  { id: "sell_cards_5", name: "Sell 5 Cards", target: 5, reward: 20 },
  { id: "pvp_battle", name: "Complete a PvP Battle", target: 1, reward: 25 },
  { id: "get_commons_3", name: "Get 3 Commons from Packs", target: 3, reward: 10 },
  { id: "get_uncommons_3", name: "Get 3 Uncommons from Packs", target: 3, reward: 20 },
  { id: "get_rares_3", name: "Get 3 Rares from Packs", target: 3, reward: 35 },
  { id: "playtime_10", name: "Play for 10 Minutes", target: 10, reward: 15 },
  { id: "playtime_20", name: "Play for 20 Minutes", target: 20, reward: 25 },
  { id: "playtime_30", name: "Play for 30 Minutes", target: 30, reward: 40 },
];

// Helper: Get start of day in UTC
function getStartOfDayUTC(timestamp: number): number {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

// Helper: Check if two timestamps are on the same day (UTC)
function isSameDay(ts1: number, ts2: number): boolean {
  return getStartOfDayUTC(ts1) === getStartOfDayUTC(ts2);
}

// Helper: Check if ts1 is the day before ts2 (UTC)
function isConsecutiveDay(ts1: number, ts2: number): boolean {
  const day1 = getStartOfDayUTC(ts1);
  const day2 = getStartOfDayUTC(ts2);
  const oneDayMs = 24 * 60 * 60 * 1000;
  return day2 - day1 === oneDayMs;
}

// Helper: Select random quests for the day
function selectRandomQuests(seed: number): typeof QUEST_POOL {
  // Use seeded random to ensure same quests for same day
  const shuffled = [...QUEST_POOL];
  let seedValue = seed;

  for (let i = shuffled.length - 1; i > 0; i--) {
    seedValue = (seedValue * 1103515245 + 12345) & 0x7fffffff;
    const j = seedValue % (i + 1);
    const temp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp;
  }

  return shuffled.slice(0, 3);
}

// Get daily reward status
export const getDailyRewardStatus = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return null;
    }

    const now = Date.now();
    const lastClaim = user.lastDailyClaimAt ?? 0;
    const currentStreak = user.dailyStreak ?? 0;

    // Check if already claimed today
    const claimedToday = lastClaim > 0 && isSameDay(lastClaim, now);

    // Check if streak will continue or reset
    let willResetStreak = false;
    if (lastClaim > 0 && !claimedToday && !isConsecutiveDay(lastClaim, now)) {
      willResetStreak = true;
    }

    // Calculate what day of the 7-day cycle the user will claim (or has claimed today)
    let streakDay: number;
    if (claimedToday) {
      // Already claimed - show the day they claimed
      streakDay = currentStreak % 7;
      if (streakDay === 0 && currentStreak > 0) streakDay = 7;
    } else if (currentStreak === 0 || willResetStreak) {
      // First time or streak reset - will claim day 1
      streakDay = 1;
    } else {
      // Consecutive day - will claim next day
      const nextStreak = currentStreak + 1;
      streakDay = nextStreak % 7;
      if (streakDay === 0) streakDay = 7;
    }

    // Get today's reward (the reward they will claim or have claimed)
    const todayReward = DAILY_REWARDS[streakDay - 1];

    return {
      canClaim: !claimedToday,
      claimedToday,
      currentStreak,
      streakDay,
      willResetStreak,
      todayReward,
      allRewards: DAILY_REWARDS,
    };
  },
});

// Claim daily login reward
export const claimDailyReward = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const lastClaim = user.lastDailyClaimAt ?? 0;
    const currentStreak = user.dailyStreak ?? 0;

    // Check if already claimed today
    if (lastClaim > 0 && isSameDay(lastClaim, now)) {
      throw new Error("Already claimed today's reward");
    }

    // Calculate new streak
    let newStreak: number;
    if (lastClaim === 0) {
      // First time claiming
      newStreak = 1;
    } else if (isConsecutiveDay(lastClaim, now)) {
      // Consecutive day - increase streak
      newStreak = currentStreak + 1;
    } else {
      // Missed a day - reset streak
      newStreak = 1;
    }

    // Get reward for the streak day (1-7 cycle)
    const streakDay = ((newStreak - 1) % 7) + 1;
    const reward = DAILY_REWARDS[streakDay - 1];

    if (!reward) {
      throw new Error("Invalid streak day");
    }

    // Award coins
    const newCoins = (user.pattyCoins ?? 0) + reward.coins;

    // Award bonus pack if day 7
    let newPacks = user.unopenedPacks ?? [];
    if (reward.bonus === "common_pack") {
      const existingPack = newPacks.find((p) => p.packType === "common");
      if (existingPack) {
        newPacks = newPacks.map((p) =>
          p.packType === "common" ? { ...p, quantity: p.quantity + 1 } : p
        );
      } else {
        newPacks = [...newPacks, { packType: "common", quantity: 1, acquiredAt: now }];
      }
    }

    // Update user
    await ctx.db.patch(user._id, {
      pattyCoins: newCoins,
      unopenedPacks: newPacks,
      lastDailyClaimAt: now,
      dailyStreak: newStreak,
    });

    // Log transaction
    await ctx.db.insert("transactions", {
      userId: args.clerkId,
      type: "daily_reward",
      amount: reward.coins,
      metadata: {
        streakDay,
        newStreak,
        bonusPack: reward.bonus ?? null,
      },
      timestamp: now,
    });

    // Check for [DAILY] tag: reach 14-day streak
    if (newStreak >= 14) {
      await ctx.scheduler.runAfter(0, internal.chatTags.grantTag, {
        clerkId: args.clerkId,
        tag: "DAILY",
      });
    }

    return {
      coinsAwarded: reward.coins,
      bonusPack: reward.bonus ?? null,
      newStreak,
      streakDay,
      newBalance: newCoins,
    };
  },
});

// Get daily quests
export const getDailyQuests = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return null;
    }

    const now = Date.now();
    const todayStart = getStartOfDayUTC(now);
    const lastReset = user.lastQuestResetAt ?? 0;

    // Check if quests need to be refreshed (new day)
    const needsRefresh = lastReset < todayStart;

    if (needsRefresh || !user.dailyQuests || user.dailyQuests.length === 0) {
      // Return what quests WOULD be if refreshed (query can't mutate)
      const todaysQuests = selectRandomQuests(todayStart);
      return {
        quests: todaysQuests.map((q) => ({
          ...q,
          progress: 0,
          completed: false,
          claimed: false,
        })),
        needsRefresh: true,
      };
    }

    // Return current quests with full info
    const questsWithInfo = user.dailyQuests.map((userQuest) => {
      const questDef = QUEST_POOL.find((q) => q.id === userQuest.questId);
      return {
        id: userQuest.questId,
        name: questDef?.name ?? "Unknown Quest",
        target: questDef?.target ?? 1,
        reward: questDef?.reward ?? 0,
        progress: userQuest.progress,
        completed: userQuest.completed,
        claimed: userQuest.claimed,
      };
    });

    return {
      quests: questsWithInfo,
      needsRefresh: false,
    };
  },
});

// Refresh daily quests (call on game load if needed)
export const refreshDailyQuests = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const todayStart = getStartOfDayUTC(now);
    const lastReset = user.lastQuestResetAt ?? 0;

    // Only refresh if new day
    if (lastReset >= todayStart) {
      return { refreshed: false };
    }

    // Select 3 random quests for today
    const todaysQuests = selectRandomQuests(todayStart);
    const newQuests = todaysQuests.map((q) => ({
      questId: q.id,
      progress: 0,
      completed: false,
      claimed: false,
    }));

    await ctx.db.patch(user._id, {
      dailyQuests: newQuests,
      lastQuestResetAt: now,
    });

    return { refreshed: true };
  },
});

// Update quest progress (called internally from other mutations)
export const updateQuestProgress = internalMutation({
  args: {
    clerkId: v.string(),
    questType: v.string(), // "win_battle", "open_pack", "sell_cards", "pvp_battle"
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return;
    }

    const now = Date.now();
    const todayStart = getStartOfDayUTC(now);
    let dailyQuests = user.dailyQuests;

    // Auto-initialize quests if they don't exist or need refresh
    if (!dailyQuests || dailyQuests.length === 0 || (user.lastQuestResetAt ?? 0) < todayStart) {
      const todaysQuests = selectRandomQuests(todayStart);
      dailyQuests = todaysQuests.map((q) => ({
        questId: q.id,
        progress: 0,
        completed: false,
        claimed: false,
      }));

      await ctx.db.patch(user._id, {
        dailyQuests,
        lastQuestResetAt: now,
      });
    }

    // Map quest types to quest IDs
    const questTypeToIds: Record<string, string[]> = {
      "win_battle": ["win_battle", "win_battles_3"],
      "open_pack": ["open_pack", "open_packs_3"],
      "sell_cards": ["sell_cards_5"],
      "pvp_battle": ["pvp_battle"],
      "get_common": ["get_commons_3"],
      "get_uncommon": ["get_uncommons_3"],
      "get_rare": ["get_rares_3"],
      "playtime": ["playtime_10", "playtime_20", "playtime_30"],
    };

    const relevantQuestIds = questTypeToIds[args.questType] ?? [];
    if (relevantQuestIds.length === 0) return;

    // Update matching quests
    const updatedQuests = dailyQuests.map((quest) => {
      if (!relevantQuestIds.includes(quest.questId)) {
        return quest;
      }

      const questDef = QUEST_POOL.find((q) => q.id === quest.questId);
      if (!questDef) return quest;

      const newProgress = Math.min(quest.progress + args.amount, questDef.target);
      const completed = newProgress >= questDef.target;

      return {
        ...quest,
        progress: newProgress,
        completed,
      };
    });

    await ctx.db.patch(user._id, {
      dailyQuests: updatedQuests,
    });
  },
});

// Claim quest reward
export const claimQuestReward = mutation({
  args: {
    clerkId: v.string(),
    questId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.dailyQuests) {
      throw new Error("No quests available");
    }

    // Find the quest
    const questIndex = user.dailyQuests.findIndex((q) => q.questId === args.questId);
    if (questIndex === -1) {
      throw new Error("Quest not found");
    }

    const quest = user.dailyQuests[questIndex];

    if (!quest) {
      throw new Error("Quest not found");
    }

    if (!quest.completed) {
      throw new Error("Quest not completed");
    }

    if (quest.claimed) {
      throw new Error("Quest already claimed");
    }

    // Get reward amount
    const questDef = QUEST_POOL.find((q) => q.id === args.questId);
    if (!questDef) {
      throw new Error("Quest definition not found");
    }

    // Award coins
    const newCoins = (user.pattyCoins ?? 0) + questDef.reward;

    // Mark as claimed
    const updatedQuests = user.dailyQuests.map((q, i) =>
      i === questIndex ? { ...q, claimed: true } : q
    );

    await ctx.db.patch(user._id, {
      pattyCoins: newCoins,
      dailyQuests: updatedQuests,
    });

    // Log transaction
    await ctx.db.insert("transactions", {
      userId: args.clerkId,
      type: "quest_reward",
      amount: questDef.reward,
      metadata: { questId: args.questId, questName: questDef.name },
      timestamp: Date.now(),
    });

    return {
      coinsAwarded: questDef.reward,
      newBalance: newCoins,
    };
  },
});

// Check if any rewards are claimable (for auto-popup)
export const hasClaimableRewards = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return { hasRewards: false };
    }

    const now = Date.now();
    const lastClaim = user.lastDailyClaimAt ?? 0;

    // Check daily login bonus
    const canClaimDaily = lastClaim === 0 || !isSameDay(lastClaim, now);

    // Check quests
    const hasClaimableQuest = user.dailyQuests?.some(
      (q) => q.completed && !q.claimed
    ) ?? false;

    return {
      hasRewards: canClaimDaily || hasClaimableQuest,
      canClaimDaily,
      hasClaimableQuest,
    };
  },
});
