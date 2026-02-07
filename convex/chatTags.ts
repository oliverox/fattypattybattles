import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// All valid chat tags
export const VALID_TAGS = [
  "OWNER", "DEV", "ADMIN", "INSPIRER", "VIP",
  "INVERTED", "DAILY", "1ST", "EXCLUSIVER", "SECRET FINDER",
] as const;

// Usernames that are considered owners
export const OWNER_USERNAMES = ["oliverox", "AndreMO32_ipad"];

// Grant a tag to a user (internal - called from trigger points)
export const grantTag = internalMutation({
  args: {
    clerkId: v.string(),
    tag: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { clerkId, tag }) => {
    if (!VALID_TAGS.includes(tag as any)) {
      return;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) return;

    const currentTags = user.chatTags ?? [];
    if (currentTags.includes(tag)) return; // Already has this tag

    await ctx.db.patch(user._id, {
      chatTags: [...currentTags, tag],
    });
  },
});

// Owner-only: Grant any tag (except OWNER) to another user by username
export const adminGrantTag = mutation({
  args: {
    targetUsername: v.string(),
    tag: v.string(),
  },
  returns: v.object({ success: v.boolean(), message: v.string() }),
  handler: async (ctx, { targetUsername, tag }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const clerkId = identity.subject;
    const caller = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!caller || !OWNER_USERNAMES.includes(caller.username ?? "")) {
      throw new Error("Only owners can grant tags");
    }

    if (tag === "OWNER") {
      // Only allow granting OWNER to other designated owners
      if (!OWNER_USERNAMES.includes(targetUsername)) {
        throw new Error("Cannot grant OWNER tag to non-owners");
      }
    }

    if (!VALID_TAGS.includes(tag as any)) {
      throw new Error(`Invalid tag: ${tag}`);
    }

    const target = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", targetUsername))
      .first();

    if (!target) {
      throw new Error(`User "${targetUsername}" not found`);
    }

    const currentTags = target.chatTags ?? [];
    if (currentTags.includes(tag)) {
      throw new Error(`${targetUsername} already has [${tag}]`);
    }

    await ctx.db.patch(target._id, {
      chatTags: [...currentTags, tag],
    });

    return { success: true, message: `Granted [${tag}] to ${targetUsername}` };
  },
});

// Equip or unequip a chat tag
export const equipChatTag = mutation({
  args: {
    tag: v.union(v.string(), v.null()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { tag }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const clerkId = identity.subject;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) throw new Error("User not found");

    if (tag === null) {
      // Unequip
      await ctx.db.patch(user._id, { equippedChatTag: undefined });
      return { success: true };
    }

    const currentTags = user.chatTags ?? [];
    if (!currentTags.includes(tag)) {
      throw new Error("You don't have this tag");
    }

    await ctx.db.patch(user._id, { equippedChatTag: tag });
    return { success: true };
  },
});

// Get current user's tags
export const getUserTags = query({
  args: {},
  returns: v.union(
    v.object({
      chatTags: v.array(v.string()),
      equippedChatTag: v.union(v.string(), v.null()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const clerkId = identity.subject;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) return null;

    return {
      chatTags: user.chatTags ?? [],
      equippedChatTag: user.equippedChatTag ?? null,
    };
  },
});

// Check if user is #1 on any leaderboard and grant [1ST] tag
export const checkAndGrantLeaderboardTag = internalMutation({
  args: {
    clerkId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) return;

    // Already has the tag
    if ((user.chatTags ?? []).includes("1ST")) return;

    // Check wins leaderboard
    const allUsers = await ctx.db.query("users").collect();
    const usersWithStats = allUsers.filter((u) => u.username);

    // Check if user is #1 in wins
    const topWins = usersWithStats
      .filter((u) => (u.battleWins ?? 0) > 0)
      .sort((a, b) => (b.battleWins ?? 0) - (a.battleWins ?? 0))[0];
    if (topWins && topWins.clerkId === clerkId) {
      await ctx.db.patch(user._id, {
        chatTags: [...(user.chatTags ?? []), "1ST"],
      });
      return;
    }

    // Check if user is #1 in coins
    const topCoins = usersWithStats
      .sort((a, b) => (b.pattyCoins ?? 0) - (a.pattyCoins ?? 0))[0];
    if (topCoins && topCoins.clerkId === clerkId) {
      await ctx.db.patch(user._id, {
        chatTags: [...(user.chatTags ?? []), "1ST"],
      });
      return;
    }

    // Check if user is #1 in playtime
    const topTime = usersWithStats
      .sort((a, b) => (b.totalPlayTime ?? 0) - (a.totalPlayTime ?? 0))[0];
    if (topTime && topTime.clerkId === clerkId) {
      await ctx.db.patch(user._id, {
        chatTags: [...(user.chatTags ?? []), "1ST"],
      });
      return;
    }

    // Check if user is #1 in cards
    const allInventory = await ctx.db.query("inventory").collect();
    const cardCounts = new Map<string, number>();
    for (const item of allInventory) {
      const current = cardCounts.get(item.userId) ?? 0;
      cardCounts.set(item.userId, current + item.quantity);
    }
    let topCardUser: string | null = null;
    let topCardCount = 0;
    for (const [userId, count] of cardCounts) {
      if (count > topCardCount) {
        topCardCount = count;
        topCardUser = userId;
      }
    }
    if (topCardUser === clerkId) {
      await ctx.db.patch(user._id, {
        chatTags: [...(user.chatTags ?? []), "1ST"],
      });
    }
  },
});

// Check if user has 3+ exclusive cards and grant [EXCLUSIVER] tag
export const checkAndGrantExclusiverTag = internalMutation({
  args: {
    clerkId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) return;

    // Already has the tag
    if ((user.chatTags ?? []).includes("EXCLUSIVER")) return;

    // Count exclusive cards in inventory
    const inventoryItems = await ctx.db
      .query("inventory")
      .withIndex("by_userId", (q) => q.eq("userId", clerkId))
      .collect();

    let exclusiveTotal = 0;
    for (const item of inventoryItems) {
      const card = await ctx.db.get(item.cardId);
      if (card?.rarity === "exclusive") {
        exclusiveTotal += item.quantity;
      }
    }

    if (exclusiveTotal >= 3) {
      await ctx.db.patch(user._id, {
        chatTags: [...(user.chatTags ?? []), "EXCLUSIVER"],
      });
    }
  },
});
