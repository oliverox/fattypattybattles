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

    // For cards category, we need to aggregate from inventory
    // For other categories, we can work directly from users table
    if (category === "cards") {
      // Get all inventory items and aggregate by userId
      const allInventory = await ctx.db.query("inventory").collect();

      // Aggregate card counts by userId
      const cardCounts = new Map<string, number>();
      for (const item of allInventory) {
        const current = cardCounts.get(item.userId) ?? 0;
        cardCounts.set(item.userId, current + item.quantity);
      }

      // Get usernames for users with cards (batch lookup)
      const userIds = Array.from(cardCounts.keys());
      const entries: Array<{
        rank: number;
        username: string;
        value: number;
        isCurrentUser: boolean;
      }> = [];

      // Fetch users in batches (only users with inventory)
      for (const userId of userIds) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", userId))
          .first();

        if (user?.username) {
          entries.push({
            rank: 0,
            username: user.username,
            value: cardCounts.get(userId) ?? 0,
            isCurrentUser: userId === currentUserId,
          });
        }
      }

      // Sort and limit
      entries.sort((a, b) => b.value - a.value);
      const top50 = entries.slice(0, 50).map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      // Find current user's rank if beyond top 50
      let currentUserRank: { rank: number; value: number } | null = null;
      if (currentUserId) {
        const userIndex = entries.findIndex((e) => e.isCurrentUser);
        if (userIndex >= 50) {
          currentUserRank = {
            rank: userIndex + 1,
            value: entries[userIndex]?.value ?? 0,
          };
        }
      }

      return { entries: top50, userRank: currentUserRank };
    }

    // For wins, coins, time - work from users table directly
    // Only fetch fields we need and filter valid users
    const users = await ctx.db.query("users").collect();

    const entries: Array<{
      rank: number;
      username: string;
      value: number;
      isCurrentUser: boolean;
    }> = [];

    for (const user of users) {
      if (!user.username || !user.clerkId) continue;

      let value: number;
      if (category === "wins") {
        value = user.battleWins ?? 0;
      } else if (category === "coins") {
        value = user.pattyCoins ?? 0;
      } else {
        value = user.totalPlayTime ?? 0;
      }

      entries.push({
        rank: 0,
        username: user.username,
        value,
        isCurrentUser: user.clerkId === currentUserId,
      });
    }

    // Sort by value descending
    entries.sort((a, b) => b.value - a.value);

    // Assign ranks and limit to top 50
    const top50 = entries.slice(0, 50).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    // Find current user's rank if they're beyond top 50
    let currentUserRank: { rank: number; value: number } | null = null;
    if (currentUserId) {
      const userIndex = entries.findIndex((e) => e.isCurrentUser);
      if (userIndex >= 50) {
        currentUserRank = {
          rank: userIndex + 1,
          value: entries[userIndex]?.value ?? 0,
        };
      }
    }

    return {
      entries: top50,
      userRank: currentUserRank,
    };
  },
});
