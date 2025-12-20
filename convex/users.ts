import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or update user profile
export const createUserProfile = mutation({
  args: {
    username: v.string(),
    gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    avatarConfig: v.object({
      skinColor: v.string(),
      hairStyle: v.string(),
      hairColor: v.string(),
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

    // Check if username is taken
    const usernameTaken = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (usernameTaken) {
      throw new Error("Username already taken");
    }

    // Create or update user record
    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        username: args.username,
        gender: args.gender,
        avatarConfig: args.avatarConfig,
        pattyCoins: 10, // Starting coins
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      });
      return existingUser._id;
    } else {
      const userId = await ctx.db.insert("users", {
        clerkId,
        email: identity.email || "",
        username: args.username,
        gender: args.gender,
        avatarConfig: args.avatarConfig,
        pattyCoins: 10, // Starting coins
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      });
      return userId;
    }
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
