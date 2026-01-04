import { query } from "./_generated/server";
import { v } from "convex/values";

export const getLeaderboard = query({
  args: {
    category: v.union(
      v.literal("wins"),
      v.literal("coins"),
      v.literal("cards"),
      v.literal("time")
    ),
  },
  handler: async (ctx, { category }) => {
    const identity = await ctx.auth.getUserIdentity();
    const currentUserId = identity?.subject;

    // Get all users with usernames and clerkIds
    const users = await ctx.db.query("users").collect();
    const usersWithProfiles = users.filter((u) => u.username && u.clerkId);

    // Calculate stats for each user
    const userStats = await Promise.all(
      usersWithProfiles.map(async (user) => {
        // Get total cards from inventory
        const clerkId = user.clerkId as string;
        const inventory = await ctx.db
          .query("inventory")
          .withIndex("by_userId", (q) => q.eq("userId", clerkId))
          .collect();
        const totalCards = inventory.reduce((sum, item) => sum + item.quantity, 0);

        return {
          clerkId: user.clerkId as string,
          username: user.username as string,
          wins: user.battleWins ?? 0,
          coins: user.pattyCoins ?? 0,
          cards: totalCards,
          time: user.totalPlayTime ?? 0,
        };
      })
    );

    // Sort by the requested category (descending)
    userStats.sort((a, b) => b[category] - a[category]);

    // Get top 50
    const top50 = userStats.slice(0, 50).map((user, index) => ({
      rank: index + 1,
      username: user.username,
      value: user[category],
      isCurrentUser: user.clerkId === currentUserId,
    }));

    // Find current user's rank if not in top 50
    let userRank: { rank: number; value: number } | null = null;
    if (currentUserId) {
      const userIndex = userStats.findIndex((u) => u.clerkId === currentUserId);
      if (userIndex >= 0) {
        const inTop50 = userIndex < 50;
        if (!inTop50) {
          userRank = {
            rank: userIndex + 1,
            value: userStats[userIndex]![category],
          };
        }
      }
    }

    return {
      entries: top50,
      userRank,
    };
  },
});
