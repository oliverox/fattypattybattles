import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Trade timeout: 5 minutes
const TRADE_TIMEOUT_MS = 5 * 60 * 1000;

// ============== QUERIES ==============

// Search result validator
const userSearchResultValidator = v.object({
  clerkId: v.string(),
  username: v.string(),
});

// Search for users by username (autocomplete)
// NOTE: Convex doesn't support partial text search with indexes.
// For large user bases, consider using a dedicated search service.
export const searchUsersByUsername = query({
  args: {
    clerkId: v.string(),
    searchQuery: v.string(),
  },
  returns: v.array(userSearchResultValidator),
  handler: async (ctx, { clerkId, searchQuery }) => {
    if (searchQuery.length < 1) {
      return [];
    }

    // Get all users - cannot use index for partial matching
    // Only fetch fields needed for search
    const allUsers = await ctx.db.query("users").collect();

    // Filter by search query (case-insensitive partial match)
    const lowerQuery = searchQuery.toLowerCase();
    const matches: Array<{ clerkId: string; username: string }> = [];

    for (const user of allUsers) {
      if (matches.length >= 10) break; // Early exit once we have 10 matches
      if (!user.username || !user.clerkId) continue;
      if (user.clerkId === clerkId) continue; // Don't include self
      if (user.username.toLowerCase().includes(lowerQuery)) {
        matches.push({
          clerkId: user.clerkId,
          username: user.username,
        });
      }
    }

    return matches;
  },
});

// Trade card offer validator
const tradeCardValidator = v.object({
  inventoryId: v.string(),
  cardId: v.id("cards"),
  cardName: v.string(),
  rarity: v.string(),
});

// Trade offer validator
const tradeOfferValidator = v.object({
  cards: v.array(tradeCardValidator),
  coins: v.number(),
});

// Trade request validator
const tradeRequestValidator = v.object({
  _id: v.id("tradeRequests"),
  _creationTime: v.number(),
  senderId: v.string(),
  senderUsername: v.string(),
  receiverId: v.string(),
  receiverUsername: v.string(),
  senderOffer: tradeOfferValidator,
  receiverOffer: tradeOfferValidator,
  status: v.union(
    v.literal("pending"),
    v.literal("negotiating"),
    v.literal("completed"),
    v.literal("declined"),
    v.literal("cancelled"),
    v.literal("expired")
  ),
  senderConfirmed: v.boolean(),
  receiverConfirmed: v.boolean(),
  createdAt: v.number(),
  expiresAt: v.number(),
  completedAt: v.optional(v.number()),
});

// Get incoming trade requests for current user
export const getIncomingTradeRequests = query({
  args: { clerkId: v.string() },
  returns: v.array(tradeRequestValidator),
  handler: async (ctx, { clerkId }) => {
    const now = Date.now();

    const requests = await ctx.db
      .query("tradeRequests")
      .withIndex("by_receiverId", (q) => q.eq("receiverId", clerkId).eq("status", "pending"))
      .collect();

    // Filter out expired requests
    return requests.filter((r) => r.expiresAt > now);
  },
});

// Get outgoing trade request (only one active at a time)
export const getOutgoingTradeRequest = query({
  args: { clerkId: v.string() },
  returns: v.union(tradeRequestValidator, v.null()),
  handler: async (ctx, { clerkId }) => {
    const now = Date.now();

    // Check for pending requests
    const pendingRequest = await ctx.db
      .query("tradeRequests")
      .withIndex("by_senderId", (q) => q.eq("senderId", clerkId).eq("status", "pending"))
      .first();

    if (pendingRequest && pendingRequest.expiresAt > now) {
      return pendingRequest;
    }

    // Check for negotiating requests
    const negotiatingRequest = await ctx.db
      .query("tradeRequests")
      .withIndex("by_senderId", (q) => q.eq("senderId", clerkId).eq("status", "negotiating"))
      .first();

    if (negotiatingRequest && negotiatingRequest.expiresAt > now) {
      return negotiatingRequest;
    }

    return null;
  },
});

// Active trade request with role validator
const activeTradeRequestValidator = v.object({
  _id: v.id("tradeRequests"),
  _creationTime: v.number(),
  senderId: v.string(),
  senderUsername: v.string(),
  receiverId: v.string(),
  receiverUsername: v.string(),
  senderOffer: tradeOfferValidator,
  receiverOffer: tradeOfferValidator,
  status: v.union(
    v.literal("pending"),
    v.literal("negotiating"),
    v.literal("completed"),
    v.literal("declined"),
    v.literal("cancelled"),
    v.literal("expired")
  ),
  senderConfirmed: v.boolean(),
  receiverConfirmed: v.boolean(),
  createdAt: v.number(),
  expiresAt: v.number(),
  completedAt: v.optional(v.number()),
  role: v.union(v.literal("sender"), v.literal("receiver")),
});

// Get active trade request (for either sender or receiver)
export const getActiveTradeRequest = query({
  args: { clerkId: v.string() },
  returns: v.union(activeTradeRequestValidator, v.null()),
  handler: async (ctx, { clerkId }) => {
    const now = Date.now();

    // Check as sender
    for (const status of ["pending", "negotiating"] as const) {
      const request = await ctx.db
        .query("tradeRequests")
        .withIndex("by_senderId", (q) => q.eq("senderId", clerkId).eq("status", status))
        .first();

      if (request && request.expiresAt > now) {
        return { ...request, role: "sender" as const };
      }
    }

    // Check as receiver
    for (const status of ["pending", "negotiating"] as const) {
      const request = await ctx.db
        .query("tradeRequests")
        .withIndex("by_receiverId", (q) => q.eq("receiverId", clerkId).eq("status", status))
        .first();

      if (request && request.expiresAt > now) {
        return { ...request, role: "receiver" as const };
      }
    }

    return null;
  },
});

// Get trade request status by ID
export const getTradeRequestStatus = query({
  args: { requestId: v.id("tradeRequests") },
  returns: v.union(tradeRequestValidator, v.null()),
  handler: async (ctx, { requestId }) => {
    const request = await ctx.db.get(requestId);
    return request;
  },
});

// Get user's coin balance
export const getUserCoins = query({
  args: { clerkId: v.string() },
  returns: v.number(),
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    return user?.pattyCoins ?? 0;
  },
});

// ============== MUTATIONS ==============

// Send a trade request to another user
export const sendTradeRequest = mutation({
  args: {
    clerkId: v.string(),
    targetClerkId: v.string(),
    initialOffer: v.object({
      cards: v.array(v.object({
        inventoryId: v.string(),
        cardId: v.id("cards"),
        cardName: v.string(),
        rarity: v.string(),
      })),
      coins: v.number(),
    }),
  },
  returns: v.object({ requestId: v.id("tradeRequests") }),
  handler: async (ctx, { clerkId, targetClerkId, initialOffer }) => {
    const now = Date.now();

    // Get sender
    const sender = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!sender || !sender.username) {
      throw new Error("Sender not found");
    }

    // Get receiver
    const receiver = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", targetClerkId))
      .first();

    if (!receiver || !receiver.username) {
      throw new Error("Target user not found");
    }

    // Can't trade with yourself
    if (clerkId === targetClerkId) {
      throw new Error("Cannot trade with yourself");
    }

    // Validate sender has enough coins
    if (initialOffer.coins > 0 && (sender.pattyCoins ?? 0) < initialOffer.coins) {
      throw new Error("Not enough coins");
    }

    // Validate sender owns the offered cards
    for (const card of initialOffer.cards) {
      const [inventoryIdStr, instanceIndexStr] = card.inventoryId.split(":");
      const inventoryId = inventoryIdStr as Id<"inventory">;
      const inventory = await ctx.db.get(inventoryId);

      if (!inventory || inventory.userId !== clerkId) {
        throw new Error("You don't own one of the offered cards");
      }

      const instanceIndex = parseInt(instanceIndexStr ?? "0", 10);
      if (instanceIndex >= inventory.quantity) {
        throw new Error("Invalid card instance");
      }
    }

    // Check for existing active trade requests from sender
    const existingPending = await ctx.db
      .query("tradeRequests")
      .withIndex("by_senderId", (q) => q.eq("senderId", clerkId).eq("status", "pending"))
      .first();

    if (existingPending && existingPending.expiresAt > now) {
      throw new Error("You already have a pending trade request");
    }

    const existingNegotiating = await ctx.db
      .query("tradeRequests")
      .withIndex("by_senderId", (q) => q.eq("senderId", clerkId).eq("status", "negotiating"))
      .first();

    if (existingNegotiating && existingNegotiating.expiresAt > now) {
      throw new Error("You are already in a trade negotiation");
    }

    // Check receiver isn't already in a trade
    const receiverPending = await ctx.db
      .query("tradeRequests")
      .withIndex("by_receiverId", (q) => q.eq("receiverId", targetClerkId).eq("status", "negotiating"))
      .first();

    if (receiverPending && receiverPending.expiresAt > now) {
      throw new Error("This user is already in a trade");
    }

    // Create trade request
    const requestId = await ctx.db.insert("tradeRequests", {
      senderId: clerkId,
      senderUsername: sender.username,
      receiverId: targetClerkId,
      receiverUsername: receiver.username,
      senderOffer: initialOffer,
      receiverOffer: { cards: [], coins: 0 },
      status: "pending",
      senderConfirmed: false,
      receiverConfirmed: false,
      createdAt: now,
      expiresAt: now + TRADE_TIMEOUT_MS,
    });

    return { requestId };
  },
});

// Accept a trade request (receiver)
export const acceptTradeRequest = mutation({
  args: {
    clerkId: v.string(),
    requestId: v.id("tradeRequests"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { clerkId, requestId }) => {
    const request = await ctx.db.get(requestId);

    if (!request) {
      throw new Error("Trade request not found");
    }

    if (request.receiverId !== clerkId) {
      throw new Error("Not authorized");
    }

    if (request.status !== "pending") {
      throw new Error("Trade request is no longer pending");
    }

    if (request.expiresAt < Date.now()) {
      throw new Error("Trade request has expired");
    }

    // Update status to negotiating
    await ctx.db.patch(requestId, {
      status: "negotiating",
      expiresAt: Date.now() + TRADE_TIMEOUT_MS, // Reset timeout
    });

    return { success: true };
  },
});

// Decline a trade request (either party can decline)
export const declineTradeRequest = mutation({
  args: {
    clerkId: v.string(),
    requestId: v.id("tradeRequests"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { clerkId, requestId }) => {
    const request = await ctx.db.get(requestId);

    if (!request) {
      throw new Error("Trade request not found");
    }

    if (request.senderId !== clerkId && request.receiverId !== clerkId) {
      throw new Error("Not authorized");
    }

    if (request.status === "completed" || request.status === "declined") {
      throw new Error("Trade request already resolved");
    }

    await ctx.db.patch(requestId, {
      status: "declined",
    });

    return { success: true };
  },
});

// Cancel a trade request (sender only, before acceptance)
export const cancelTradeRequest = mutation({
  args: {
    clerkId: v.string(),
    requestId: v.id("tradeRequests"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { clerkId, requestId }) => {
    const request = await ctx.db.get(requestId);

    if (!request) {
      throw new Error("Trade request not found");
    }

    if (request.senderId !== clerkId) {
      throw new Error("Only sender can cancel");
    }

    if (request.status !== "pending" && request.status !== "negotiating") {
      throw new Error("Cannot cancel this trade request");
    }

    await ctx.db.patch(requestId, {
      status: "cancelled",
    });

    return { success: true };
  },
});

// Update offer during negotiation
export const updateOffer = mutation({
  args: {
    clerkId: v.string(),
    requestId: v.id("tradeRequests"),
    offer: v.object({
      cards: v.array(v.object({
        inventoryId: v.string(),
        cardId: v.id("cards"),
        cardName: v.string(),
        rarity: v.string(),
      })),
      coins: v.number(),
    }),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { clerkId, requestId, offer }) => {
    const request = await ctx.db.get(requestId);

    if (!request) {
      throw new Error("Trade request not found");
    }

    if (request.status !== "negotiating") {
      throw new Error("Trade is not in negotiation phase");
    }

    if (request.expiresAt < Date.now()) {
      throw new Error("Trade request has expired");
    }

    const isSender = request.senderId === clerkId;
    const isReceiver = request.receiverId === clerkId;

    if (!isSender && !isReceiver) {
      throw new Error("Not authorized");
    }

    // Validate user has enough coins
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (offer.coins > 0 && (user.pattyCoins ?? 0) < offer.coins) {
      throw new Error("Not enough coins");
    }

    // Validate user owns the offered cards
    for (const card of offer.cards) {
      const [inventoryIdStr, instanceIndexStr] = card.inventoryId.split(":");
      const inventoryId = inventoryIdStr as Id<"inventory">;
      const inventory = await ctx.db.get(inventoryId);

      if (!inventory || inventory.userId !== clerkId) {
        throw new Error("You don't own one of the offered cards");
      }

      const instanceIndex = parseInt(instanceIndexStr ?? "0", 10);
      if (instanceIndex >= inventory.quantity) {
        throw new Error("Invalid card instance");
      }
    }

    // Update offer and reset both confirmations (offer changed, both must re-confirm)
    const updateData: Record<string, unknown> = {
      senderConfirmed: false,
      receiverConfirmed: false,
    };

    if (isSender) {
      updateData.senderOffer = offer;
    } else {
      updateData.receiverOffer = offer;
    }

    await ctx.db.patch(requestId, updateData);

    return { success: true };
  },
});

// Confirm trade (mark ready)
export const confirmTrade = mutation({
  args: {
    clerkId: v.string(),
    requestId: v.id("tradeRequests"),
  },
  returns: v.object({
    success: v.boolean(),
    tradeCompleted: v.boolean(),
  }),
  handler: async (ctx, { clerkId, requestId }) => {
    const request = await ctx.db.get(requestId);

    if (!request) {
      throw new Error("Trade request not found");
    }

    // Idempotency: if trade already completed, return success
    if (request.status === "completed") {
      return { success: true, tradeCompleted: true };
    }

    if (request.status !== "negotiating") {
      throw new Error("Trade is not in negotiation phase");
    }

    if (request.expiresAt < Date.now()) {
      throw new Error("Trade request has expired");
    }

    const isSender = request.senderId === clerkId;
    const isReceiver = request.receiverId === clerkId;

    if (!isSender && !isReceiver) {
      throw new Error("Not authorized");
    }

    // Validate user still has the items they're offering
    const userOffer = isSender ? request.senderOffer : request.receiverOffer;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (userOffer.coins > 0 && (user.pattyCoins ?? 0) < userOffer.coins) {
      throw new Error("Not enough coins");
    }

    for (const card of userOffer.cards) {
      const [inventoryIdStr] = card.inventoryId.split(":");
      const inventoryId = inventoryIdStr as Id<"inventory">;
      const inventory = await ctx.db.get(inventoryId);

      if (!inventory || inventory.userId !== clerkId) {
        throw new Error("You no longer own one of the offered cards");
      }
    }

    // Update confirmation
    const updateData: Record<string, unknown> = {};
    if (isSender) {
      updateData.senderConfirmed = true;
    } else {
      updateData.receiverConfirmed = true;
    }

    await ctx.db.patch(requestId, updateData);

    // Check if both confirmed - if so, execute trade
    const updatedRequest = await ctx.db.get(requestId);
    if (!updatedRequest) return { success: true, tradeCompleted: false };

    const bothConfirmed =
      (isSender ? true : updatedRequest.senderConfirmed) &&
      (isReceiver ? true : updatedRequest.receiverConfirmed);

    if (bothConfirmed) {
      await executeTrade(ctx, requestId);

      // Check for [EXCLUSIVER] tag for both parties (may have gained exclusive cards)
      await ctx.scheduler.runAfter(0, internal.chatTags.checkAndGrantExclusiverTag, {
        clerkId: request.senderId,
      });
      await ctx.scheduler.runAfter(0, internal.chatTags.checkAndGrantExclusiverTag, {
        clerkId: request.receiverId,
      });

      return { success: true, tradeCompleted: true };
    }

    return { success: true, tradeCompleted: false };
  },
});

// Unconfirm trade (change mind before completion)
export const unconfirmTrade = mutation({
  args: {
    clerkId: v.string(),
    requestId: v.id("tradeRequests"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { clerkId, requestId }) => {
    const request = await ctx.db.get(requestId);

    if (!request) {
      throw new Error("Trade request not found");
    }

    if (request.status !== "negotiating") {
      throw new Error("Trade is not in negotiation phase");
    }

    const isSender = request.senderId === clerkId;
    const isReceiver = request.receiverId === clerkId;

    if (!isSender && !isReceiver) {
      throw new Error("Not authorized");
    }

    const updateData: Record<string, unknown> = {};
    if (isSender) {
      updateData.senderConfirmed = false;
    } else {
      updateData.receiverConfirmed = false;
    }

    await ctx.db.patch(requestId, updateData);

    return { success: true };
  },
});

// Internal helper to execute the trade (transfer items)
// This function is idempotent - if trade is already completed, it returns silently
async function executeTrade(
  ctx: { db: any },
  requestId: Id<"tradeRequests">
) {
  const request = await ctx.db.get(requestId);
  if (!request) {
    throw new Error("Trade request not found");
  }

  // Idempotency: if trade already completed, return silently
  if (request.status === "completed") {
    return;
  }

  if (request.status !== "negotiating") {
    throw new Error("Trade is no longer active");
  }

  const now = Date.now();

  // Get both users
  const sender = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", request.senderId))
    .first();

  const receiver = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", request.receiverId))
    .first();

  if (!sender || !receiver) {
    throw new Error("Users not found");
  }

  // Final validation of coins
  if (request.senderOffer.coins > (sender.pattyCoins ?? 0)) {
    throw new Error("Sender doesn't have enough coins");
  }
  if (request.receiverOffer.coins > (receiver.pattyCoins ?? 0)) {
    throw new Error("Receiver doesn't have enough coins");
  }

  // Transfer coins
  const senderNewCoins =
    (sender.pattyCoins ?? 0) -
    request.senderOffer.coins +
    request.receiverOffer.coins;
  const receiverNewCoins =
    (receiver.pattyCoins ?? 0) -
    request.receiverOffer.coins +
    request.senderOffer.coins;

  await ctx.db.patch(sender._id, { pattyCoins: senderNewCoins });
  await ctx.db.patch(receiver._id, { pattyCoins: receiverNewCoins });

  // Transfer cards from sender to receiver
  for (const card of request.senderOffer.cards) {
    await transferCard(ctx, card.inventoryId, request.senderId, request.receiverId, card.cardId);
  }

  // Transfer cards from receiver to sender
  for (const card of request.receiverOffer.cards) {
    await transferCard(ctx, card.inventoryId, request.receiverId, request.senderId, card.cardId);
  }

  // Log transactions
  const netCoinChange = request.receiverOffer.coins - request.senderOffer.coins;

  if (netCoinChange !== 0) {
    await ctx.db.insert("transactions", {
      userId: request.senderId,
      type: "trade" as const,
      amount: netCoinChange,
      metadata: {
        tradeRequestId: requestId,
        tradedWith: request.receiverUsername,
        cardsGiven: request.senderOffer.cards.length,
        cardsReceived: request.receiverOffer.cards.length,
      },
      timestamp: now,
    });

    await ctx.db.insert("transactions", {
      userId: request.receiverId,
      type: "trade" as const,
      amount: -netCoinChange,
      metadata: {
        tradeRequestId: requestId,
        tradedWith: request.senderUsername,
        cardsGiven: request.receiverOffer.cards.length,
        cardsReceived: request.senderOffer.cards.length,
      },
      timestamp: now,
    });
  }

  // Mark trade as completed
  await ctx.db.patch(requestId, {
    status: "completed",
    completedAt: now,
  });
}

// Helper to transfer a card from one user to another
async function transferCard(
  ctx: { db: any },
  inventoryIdStr: string,
  fromUserId: string,
  toUserId: string,
  cardId: Id<"cards">
) {
  const [inventoryIdPart] = inventoryIdStr.split(":");
  const inventoryId = inventoryIdPart as Id<"inventory">;

  const fromInventory = await ctx.db.get(inventoryId);
  if (!fromInventory || fromInventory.userId !== fromUserId) {
    throw new Error("Source inventory not found");
  }

  // Decrease quantity from source
  if (fromInventory.quantity <= 1) {
    await ctx.db.delete(inventoryId);
  } else {
    await ctx.db.patch(inventoryId, {
      quantity: fromInventory.quantity - 1,
    });
  }

  // Add to destination
  const toInventory = await ctx.db
    .query("inventory")
    .withIndex("by_userId_cardId", (q: any) =>
      q.eq("userId", toUserId).eq("cardId", cardId)
    )
    .first();

  if (toInventory) {
    await ctx.db.patch(toInventory._id, {
      quantity: toInventory.quantity + 1,
    });
  } else {
    await ctx.db.insert("inventory", {
      userId: toUserId,
      cardId: cardId,
      quantity: 1,
      acquiredAt: Date.now(),
    });
  }
}
