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

    // Get all users
    const users = await ctx.db.query("users").collect();

    // Build stats for each valid user
    const entries: Array<{
      rank: number;
      username: string;
      value: number;
      isCurrentUser: boolean;
    }> = [];

    let currentUserRank: { rank: number; value: number } | null = null;

    for (const user of users) {
      // Skip users without username or clerkId
      if (!user.username || !user.clerkId) continue;

      let value: number;

      if (category === "wins") {
        value = user.battleWins ?? 0;
      } else if (category === "coins") {
        value = user.pattyCoins ?? 0;
      } else if (category === "time") {
        value = user.totalPlayTime ?? 0;
      } else {
        // cards - count from inventory
        const inventory = await ctx.db
          .query("inventory")
          .withIndex("by_userId", (q) => q.eq("userId", user.clerkId as string))
          .collect();
        value = inventory.reduce((sum, item) => sum + item.quantity, 0);
      }

      entries.push({
        rank: 0, // Will set after sorting
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
    if (currentUserId) {
      const allRanked = entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
      const currentUserEntry = allRanked.find((e) => e.isCurrentUser);
      if (currentUserEntry && currentUserEntry.rank > 50) {
        currentUserRank = {
          rank: currentUserEntry.rank,
          value: currentUserEntry.value,
        };
      }
    }

    return {
      entries: top50,
      userRank: currentUserRank,
    };
  },
});
