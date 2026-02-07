import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { OWNER_USERNAMES, VALID_TAGS } from "./chatTags";
import { containsProfanity } from "./profanityFilter";

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
  returns: v.null(),
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

    const wasOffline = existingPosition ? !existingPosition.isOnline : true;

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
        equippedChatTag: user.equippedChatTag,
      });
    } else {
      // Create new position record
      await ctx.db.insert("playerPositions", {
        userId: clerkId,
        username: user.username,
        avatarConfig: user.avatarConfig,
        equippedChatTag: user.equippedChatTag,
        x: args.x,
        y: args.y,
        z: args.z,
        rotation: args.rotation,
        mapId: args.mapId,
        isOnline: true,
        lastUpdate: now,
      });
    }

    // Send join message if player was offline and is now online
    if (wasOffline) {
      await ctx.db.insert("chatMessages", {
        userId: clerkId,
        username: "[SERVER]",
        message: `${user.username} joined the game!`,
        mapId: args.mapId,
        timestamp: now,
        type: "system",
      });
    }
  },
});

// Avatar config validator
const avatarConfigValidator = v.object({
  skinColor: v.string(),
  hairStyle: v.string(),
  hairColor: v.string(),
  eyeColor: v.optional(v.string()),
  mouthStyle: v.optional(v.string()),
});

// Player position validator
const playerPositionValidator = v.object({
  _id: v.id("playerPositions"),
  _creationTime: v.number(),
  userId: v.string(),
  username: v.string(),
  avatarConfig: v.optional(avatarConfigValidator),
  equippedChatTag: v.optional(v.string()),
  x: v.number(),
  y: v.number(),
  z: v.number(),
  rotation: v.number(),
  mapId: v.string(),
  isOnline: v.boolean(),
  lastUpdate: v.number(),
});

// Get all online players in a map (excluding the current user)
export const getOnlinePlayers = query({
  args: {
    mapId: v.string(),
  },
  returns: v.array(playerPositionValidator),
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
  returns: v.null(),
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

    if (position && position.isOnline) {
      const now = Date.now();
      await ctx.db.patch(position._id, {
        isOnline: false,
        lastUpdate: now,
      });

      // Send leave message
      await ctx.db.insert("chatMessages", {
        userId: clerkId,
        username: "[SERVER]",
        message: `${position.username} left the game!`,
        mapId: position.mapId,
        timestamp: now,
        type: "system",
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
  returns: v.null(),
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
    if (containsProfanity(trimmedMessage)) {
      throw new Error("Message contains inappropriate language");
    }

    // Handle /granttag command (owner only)
    if (trimmedMessage.startsWith("/granttag ")) {
      if (!OWNER_USERNAMES.includes(user.username)) {
        throw new Error("Only owners can use /granttag");
      }
      const parts = trimmedMessage.split(" ");
      if (parts.length !== 3) {
        throw new Error("Usage: /granttag <username> <TAG>");
      }
      const targetUsername = parts[1]!;
      const tag = parts[2]!.toUpperCase();
      if (tag === "OWNER") {
        if (!OWNER_USERNAMES.includes(targetUsername)) {
          throw new Error("Cannot grant OWNER tag to non-owners");
        }
      }
      if (!VALID_TAGS.includes(tag as any)) {
        throw new Error(`Invalid tag: ${tag}. Valid: ${VALID_TAGS.join(", ")}`);
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
      // Send system confirmation message
      await ctx.db.insert("chatMessages", {
        userId: clerkId,
        username: "[SERVER]",
        message: `${user.username} granted [${tag}] to ${targetUsername}!`,
        mapId,
        timestamp: Date.now(),
        type: "system",
      });
      return;
    }

    // Insert message
    await ctx.db.insert("chatMessages", {
      userId: clerkId,
      username: user.username,
      message: trimmedMessage,
      mapId,
      timestamp: Date.now(),
      equippedChatTag: user.equippedChatTag,
    });

    // Clean up old messages efficiently - only delete oldest if we have too many
    // First, count messages by getting the oldest ones
    const oldestMessages = await ctx.db
      .query("chatMessages")
      .withIndex("by_mapId", (q) => q.eq("mapId", mapId))
      .order("asc")
      .take(20); // Get oldest 20 messages

    // Check if we need cleanup by seeing if there are messages beyond our limit
    // We get newest 100 and if oldest message isn't in that set, we have >100
    const newestMessages = await ctx.db
      .query("chatMessages")
      .withIndex("by_mapId", (q) => q.eq("mapId", mapId))
      .order("desc")
      .take(100);

    if (newestMessages.length >= 100 && oldestMessages.length > 0) {
      // Get the timestamp of the 100th newest message
      const cutoffTimestamp = newestMessages[newestMessages.length - 1]?.timestamp ?? 0;

      // Delete messages older than the cutoff (up to 20 at a time to limit work)
      for (const msg of oldestMessages) {
        if (msg.timestamp < cutoffTimestamp) {
          await ctx.db.delete(msg._id);
        }
      }
    }
  },
});

// Chat message validator
const chatMessageValidator = v.object({
  _id: v.id("chatMessages"),
  _creationTime: v.number(),
  userId: v.string(),
  username: v.string(),
  message: v.string(),
  mapId: v.string(),
  timestamp: v.number(),
  type: v.optional(v.union(v.literal("player"), v.literal("system"))),
  equippedChatTag: v.optional(v.string()),
});

// Get recent chat messages
export const getRecentMessages = query({
  args: {
    mapId: v.string(),
  },
  returns: v.array(chatMessageValidator),
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
