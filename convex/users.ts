import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

const RESTRICTED_USERNAME_WORDS = ["owner", "admin", "dev", "developer"];

function isUsernameRestricted(username: string): boolean {
  const lower = username.toLowerCase();
  if (lower.includes("[")) return true;
  return RESTRICTED_USERNAME_WORDS.some((word) => lower.includes(word));
}

// Create or update user profile
export const createUserProfile = mutation({
  args: {
    username: v.string(),
    avatarConfig: v.object({
      skinColor: v.string(),
      hairStyle: v.string(),
      hairColor: v.string(),
      eyeColor: v.optional(v.string()),
      mouthStyle: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const clerkId = identity.subject;

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existingUser?.username) {
      throw new Error("User profile already exists");
    }

    // Check username restrictions
    if (isUsernameRestricted(args.username)) {
      throw new Error("Username contains a restricted word");
    }

    // Check if username is taken
    const usernameTaken = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (usernameTaken) {
      throw new Error("Username already taken");
    }

    const now = Date.now();
    const starterPack = [{ packType: "small", quantity: 1, acquiredAt: now }];

    // Create or update user record
    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        username: args.username,
        avatarConfig: args.avatarConfig,
        pattyCoins: 10, // Starting coins
        unopenedPacks: starterPack, // Starter pack
        createdAt: now,
        lastActiveAt: now,
      });
      return existingUser._id;
    } else {
      const userId = await ctx.db.insert("users", {
        clerkId,
        email: identity.email || "",
        username: args.username,
        avatarConfig: args.avatarConfig,
        pattyCoins: 10, // Starting coins
        unopenedPacks: starterPack, // Starter pack
        createdAt: now,
        lastActiveAt: now,
      });
      return userId;
    }
  },
});

// Check if current user has a restricted username
export const hasRestrictedUsername = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user?.username) return false;
    return isUsernameRestricted(user.username);
  },
});

// Change username (for users with restricted usernames)
export const changeUsername = mutation({
  args: {
    newUsername: v.string(),
  },
  handler: async (ctx, { newUsername }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const clerkId = identity.subject;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) throw new Error("User not found");

    // Validate new username
    if (newUsername.trim().length < 3) {
      throw new Error("Username must be at least 3 characters");
    }
    if (isUsernameRestricted(newUsername)) {
      throw new Error("Username contains a restricted word");
    }

    // Check availability
    const taken = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", newUsername))
      .first();
    if (taken && taken._id !== user._id) {
      throw new Error("Username already taken");
    }

    // Update username
    await ctx.db.patch(user._id, { username: newUsername });

    // Update cached username in playerPositions
    const position = await ctx.db
      .query("playerPositions")
      .withIndex("by_userId", (q) => q.eq("userId", clerkId))
      .first();
    if (position) {
      await ctx.db.patch(position._id, { username: newUsername });
    }

    return { success: true };
  },
});

// Get current user
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const clerkId = identity.subject;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    // Check if profile is complete (has username)
    if (!user || !user.username) {
      return null; // Profile not yet created
    }

    return user;
  },
});

// Store user on first sign-in (called automatically by Clerk webhook or on first query)
export const storeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const clerkId = identity.subject;

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    // Create basic user record (profile filled in later)
    const userId = await ctx.db.insert("users", {
      clerkId,
      email: identity.email || "",
    });

    return userId;
  },
});

// Check if username is available
export const checkUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    return { available: !existing };
  },
});

// Username prefixes for random generation (no underscores)
const USERNAME_PREFIXES = [
  "Cool", "Super", "Mega", "Epic", "Awesome", "Swift", "Brave", "Lucky",
  "Mighty", "Cosmic", "Blazing", "Thunder", "Storm", "Shadow", "Golden",
  "Silver", "Crystal", "Turbo", "Ultra", "Hyper", "Nitro", "Quantum",
  "Pixel", "Cyber", "Neon", "Stellar", "Nova", "Astro", "Sonic", "Rapid",
];

const USERNAME_NOUNS = [
  "Player", "Gamer", "Hero", "Knight", "Ninja", "Dragon", "Wolf", "Tiger",
  "Phoenix", "Falcon", "Shark", "Bear", "Lion", "Panther", "Hawk", "Raven",
  "Storm", "Blaze", "Frost", "Star", "Comet", "Bolt", "Flash", "Spark",
  "Legend", "Champion", "Warrior", "Hunter", "Ranger", "Scout", "Ace",
];

// Generate a recommended available username
export const getRecommendedUsername = query({
  args: {},
  handler: async (ctx) => {
    const generateUsername = () => {
      const prefix = USERNAME_PREFIXES[Math.floor(Math.random() * USERNAME_PREFIXES.length)];
      const noun = USERNAME_NOUNS[Math.floor(Math.random() * USERNAME_NOUNS.length)];
      const number = Math.floor(Math.random() * 900) + 100; // 100-999
      return `${prefix}${noun}${number}`;
    };

    // Try to find an available username (max 20 attempts)
    for (let i = 0; i < 20; i++) {
      const username = generateUsername();
      const existing = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", username))
        .first();

      if (!existing) {
        return { username };
      }
    }

    // Fallback: add more random digits
    const fallbackUsername = `Player${Date.now().toString().slice(-8)}`;
    return { username: fallbackUsername };
  },
});

// Ensure user has starter pack (for existing users before this feature)
export const ensureStarterPack = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { granted: false };
    }

    const clerkId = identity.subject;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user || !user.username) {
      return { granted: false };
    }

    // If user already has packs, don't grant again
    if (user.unopenedPacks && user.unopenedPacks.length > 0) {
      return { granted: false, reason: "already_has_packs" };
    }

    // Check if user has any cards in inventory
    const userInventory = await ctx.db
      .query("inventory")
      .withIndex("by_userId", (q) => q.eq("userId", clerkId))
      .first();

    // If user has cards, they already opened a pack successfully
    if (userInventory) {
      return { granted: false, reason: "has_cards" };
    }

    // Grant starter pack (user has no packs and no cards)
    const now = Date.now();
    const starterPack = [{ packType: "small", quantity: 1, acquiredAt: now }];

    await ctx.db.patch(user._id, {
      unopenedPacks: starterPack,
    });

    return { granted: true };
  },
});

// Update user's avatar config
export const updateAvatarConfig = mutation({
  args: {
    avatarConfig: v.object({
      skinColor: v.string(),
      hairStyle: v.string(),
      hairColor: v.string(),
      eyeColor: v.optional(v.string()),
      mouthStyle: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const clerkId = identity.subject;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      avatarConfig: args.avatarConfig,
    });

    return { success: true };
  },
});

// Update user's last active time
export const updateLastActive = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return;
    }

    const clerkId = identity.subject;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (user && user.username) {
      await ctx.db.patch(user._id, {
        lastActiveAt: Date.now(),
      });
    }
  },
});

// Update total play time (called periodically from client)
export const updatePlayTime = mutation({
  args: { seconds: v.number() },
  handler: async (ctx, { seconds }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return;
    }

    const clerkId = identity.subject;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (user && user.username) {
      const currentPlayTime = user.totalPlayTime ?? 0;
      await ctx.db.patch(user._id, {
        totalPlayTime: currentPlayTime + seconds,
        lastActiveAt: Date.now(),
      });

      // Update playtime quest progress (convert seconds to minutes)
      const minutes = Math.floor(seconds / 60);
      if (minutes > 0) {
        await ctx.scheduler.runAfter(0, internal.dailyRewards.updateQuestProgress, {
          clerkId,
          questType: "playtime",
          amount: minutes,
        });
      }

      // Check for [1ST] leaderboard tag
      await ctx.scheduler.runAfter(0, internal.chatTags.checkAndGrantLeaderboardTag, {
        clerkId,
      });
    }
  },
});
