import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { containsProfanity } from "./profanityFilter";

const RESTRICTED_USERNAME_WORDS = ["owner", "admin", "dev", "developer", "server"];

function isUsernameRestricted(username: string): boolean {
  const lower = username.toLowerCase();
  if (lower.includes("[")) return true;
  if (containsProfanity(username)) return true;
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
  returns: v.id("users"),
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
  args: {},
  returns: v.boolean(),
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
  returns: v.object({ success: v.boolean() }),
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

// Avatar config validator (reusable)
const avatarConfigValidator = v.object({
  skinColor: v.string(),
  hairStyle: v.string(),
  hairColor: v.string(),
  eyeColor: v.optional(v.string()),
  mouthStyle: v.optional(v.string()),
});

// User document validator
const userValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  clerkId: v.optional(v.string()),
  email: v.string(),
  username: v.optional(v.string()),
  gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"))),
  avatarConfig: v.optional(avatarConfigValidator),
  pattyCoins: v.optional(v.number()),
  luckBoosts: v.optional(v.array(v.object({
    type: v.string(),
    multiplier: v.number(),
    expiresAt: v.number(),
  }))),
  unopenedPacks: v.optional(v.array(v.object({
    packType: v.string(),
    quantity: v.number(),
    acquiredAt: v.number(),
  }))),
  heldCardId: v.optional(v.string()),
  chatTags: v.optional(v.array(v.string())),
  equippedChatTag: v.optional(v.string()),
  battleWins: v.optional(v.number()),
  battleLosses: v.optional(v.number()),
  createdAt: v.optional(v.number()),
  lastActiveAt: v.optional(v.number()),
  totalPlayTime: v.optional(v.number()),
  lastDailyClaimAt: v.optional(v.number()),
  dailyStreak: v.optional(v.number()),
  dailyQuests: v.optional(v.array(v.object({
    questId: v.string(),
    progress: v.number(),
    completed: v.boolean(),
    claimed: v.boolean(),
  }))),
  lastQuestResetAt: v.optional(v.number()),
});

// Get current user
export const getCurrentUser = query({
  args: {},
  returns: v.union(userValidator, v.null()),
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
  returns: v.id("users"),
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
  returns: v.object({ available: v.boolean() }),
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
  returns: v.object({ username: v.string() }),
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
  args: {},
  returns: v.object({
    granted: v.boolean(),
    reason: v.optional(v.string()),
  }),
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
  returns: v.object({ success: v.boolean() }),
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
  args: {},
  returns: v.null(),
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

// Discover the secret room and grant SECRET FINDER tag
export const discoverSecret = mutation({
  args: {},
  returns: v.object({ alreadyDiscovered: v.boolean() }),
  handler: async (ctx) => {
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

    const currentTags = user.chatTags ?? [];
    if (currentTags.includes("SECRET FINDER")) {
      return { alreadyDiscovered: true };
    }

    await ctx.scheduler.runAfter(0, internal.chatTags.grantTag, {
      clerkId,
      tag: "SECRET FINDER",
    });

    return { alreadyDiscovered: false };
  },
});

// Update total play time (called periodically from client)
export const updatePlayTime = mutation({
  args: { seconds: v.number() },
  returns: v.null(),
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
