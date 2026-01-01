import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const MAX_PLAYERS = 15;
const CHAT_MAX_LENGTH = 500;
const CHAT_HISTORY_SIZE = 50;

// Update player position (called frequently, throttled client-side)
export const updatePosition = mutation({
  args: {
    x: v.number(),
    y: v.number(),
    z: v.number(),
    rotation: v.number(),
    mapId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const clerkId = identity.subject;

    // Get user info for caching
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user || !user.username) {
      throw new Error("User profile not found");
    }

    // Check if position record exists
    const existingPosition = await ctx.db
      .query("playerPositions")
      .withIndex("by_userId", (q) => q.eq("userId", clerkId))
      .first();

    const now = Date.now();

    if (existingPosition) {
      // Update existing position
      await ctx.db.patch(existingPosition._id, {
        x: args.x,
        y: args.y,
        z: args.z,
        rotation: args.rotation,
        mapId: args.mapId,
        isOnline: true,
        lastUpdate: now,
        username: user.username,
        avatarConfig: user.avatarConfig,
      });
    } else {
      // Create new position record
      await ctx.db.insert("playerPositions", {
        userId: clerkId,
        username: user.username,
        avatarConfig: user.avatarConfig,
        x: args.x,
        y: args.y,
        z: args.z,
        rotation: args.rotation,
        mapId: args.mapId,
        isOnline: true,
        lastUpdate: now,
      });
    }
  },
});

// Get all online players in a map (excluding the current user)
export const getOnlinePlayers = query({
  args: {
    mapId: v.string(),
  },
  handler: async (ctx, { mapId }) => {
    const identity = await ctx.auth.getUserIdentity();
    const currentUserId = identity?.subject;

    // Get all online players in this map
    const players = await ctx.db
      .query("playerPositions")
      .withIndex("by_mapId", (q) => q.eq("mapId", mapId).eq("isOnline", true))
      .collect();

    // Filter out current user and limit to MAX_PLAYERS
    const otherPlayers = players
      .filter((p) => p.userId !== currentUserId)
      .slice(0, MAX_PLAYERS);

    return otherPlayers;
  },
});

// Mark player as offline
export const setOffline = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return;
    }

    const clerkId = identity.subject;

    const position = await ctx.db
      .query("playerPositions")
      .withIndex("by_userId", (q) => q.eq("userId", clerkId))
      .first();

    if (position) {
      await ctx.db.patch(position._id, {
        isOnline: false,
        lastUpdate: Date.now(),
      });
    }
  },
});

// Send a chat message
export const sendMessage = mutation({
  args: {
    message: v.string(),
    mapId: v.string(),
  },
  handler: async (ctx, { message, mapId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const clerkId = identity.subject;

    // Get username
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user || !user.username) {
      throw new Error("User profile not found");
    }

    // Validate message
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      throw new Error("Message cannot be empty");
    }
    if (trimmedMessage.length > CHAT_MAX_LENGTH) {
      throw new Error(`Message too long (max ${CHAT_MAX_LENGTH} characters)`);
    }

    // Insert message
    await ctx.db.insert("chatMessages", {
      userId: clerkId,
      username: user.username,
      message: trimmedMessage,
      mapId,
      timestamp: Date.now(),
    });

    // Clean up old messages (keep only last 100)
    const allMessages = await ctx.db
      .query("chatMessages")
      .withIndex("by_mapId", (q) => q.eq("mapId", mapId))
      .order("asc")
      .collect();

    if (allMessages.length > 100) {
      const toDelete = allMessages.slice(0, allMessages.length - 100);
      for (const msg of toDelete) {
        await ctx.db.delete(msg._id);
      }
    }
  },
});

// Get recent chat messages
export const getRecentMessages = query({
  args: {
    mapId: v.string(),
  },
  handler: async (ctx, { mapId }) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_mapId", (q) => q.eq("mapId", mapId))
      .order("desc")
      .take(CHAT_HISTORY_SIZE);

    // Return in chronological order
    return messages.reverse();
  },
});
