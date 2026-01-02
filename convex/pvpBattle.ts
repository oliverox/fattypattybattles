import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const PVP_CONFIG = {
  requestExpiryMs: 30000, // 30 seconds to accept
  minCards: 3,
  rewardMin: 30,
  rewardMax: 50,
  packChance: 0.15,
};

// Check if player can participate in PvP (has 3+ cards)
export const canPvpBattle = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const inventory = await ctx.db
      .query("inventory")
      .withIndex("by_userId", (q) => q.eq("userId", clerkId))
      .collect();

    const totalCards = inventory.reduce((sum, item) => sum + item.quantity, 0);

    if (totalCards < PVP_CONFIG.minCards) {
      return {
        canBattle: false,
        reason: `Need ${PVP_CONFIG.minCards} cards (you have ${totalCards})`,
        totalCards,
      };
    }

    return { canBattle: true, totalCards };
  },
});

// Check if target player can participate in PvP
export const canTargetPvpBattle = query({
  args: { targetUserId: v.string() },
  handler: async (ctx, { targetUserId }) => {
    const inventory = await ctx.db
      .query("inventory")
      .withIndex("by_userId", (q) => q.eq("userId", targetUserId))
      .collect();

    const totalCards = inventory.reduce((sum, item) => sum + item.quantity, 0);

    if (totalCards < PVP_CONFIG.minCards) {
      return {
        canBattle: false,
        reason: `Player doesn't have ${PVP_CONFIG.minCards} cards`,
        totalCards,
      };
    }

    return { canBattle: true, totalCards };
  },
});

// Send a PvP battle request
export const sendBattleRequest = mutation({
  args: {
    targetUserId: v.string(),
  },
  handler: async (ctx, { targetUserId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const challengerId = identity.subject;

    if (challengerId === targetUserId) {
      throw new Error("You cannot challenge yourself");
    }

    // Get challenger info
    const challenger = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", challengerId))
      .first();

    if (!challenger) throw new Error("Challenger not found");

    // Get target info
    const target = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", targetUserId))
      .first();

    if (!target) throw new Error("Target player not found");

    // Check both players have enough cards
    for (const userId of [challengerId, targetUserId]) {
      const inventory = await ctx.db
        .query("inventory")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();

      const totalCards = inventory.reduce((sum, item) => sum + item.quantity, 0);
      if (totalCards < PVP_CONFIG.minCards) {
        const isChallenger = userId === challengerId;
        throw new Error(
          isChallenger
            ? `You need ${PVP_CONFIG.minCards} cards to battle`
            : `${target.username} doesn't have enough cards`
        );
      }
    }

    // Check for existing pending requests between these players
    const existingRequest = await ctx.db
      .query("pvpBattleRequests")
      .withIndex("by_challengerId", (q) =>
        q.eq("challengerId", challengerId).eq("status", "pending")
      )
      .filter((q) => q.eq(q.field("targetId"), targetUserId))
      .first();

    if (existingRequest) {
      throw new Error("You already have a pending request to this player");
    }

    const now = Date.now();

    // Create the battle request
    const requestId = await ctx.db.insert("pvpBattleRequests", {
      challengerId,
      challengerUsername: challenger.username ?? "Unknown",
      targetId: targetUserId,
      targetUsername: target.username ?? "Unknown",
      status: "pending",
      createdAt: now,
      expiresAt: now + PVP_CONFIG.requestExpiryMs,
    });

    return { requestId, expiresAt: now + PVP_CONFIG.requestExpiryMs };
  },
});

// Get incoming battle requests for current user
export const getIncomingRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const now = Date.now();

    const requests = await ctx.db
      .query("pvpBattleRequests")
      .withIndex("by_targetId", (q) =>
        q.eq("targetId", identity.subject).eq("status", "pending")
      )
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    return requests;
  },
});

// Get outgoing pending request for current user
export const getOutgoingRequest = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const request = await ctx.db
      .query("pvpBattleRequests")
      .withIndex("by_challengerId", (q) =>
        q.eq("challengerId", identity.subject).eq("status", "pending")
      )
      .first();

    if (request && Date.now() > request.expiresAt) {
      return null;
    }

    return request;
  },
});

// Get request status (for polling/subscription)
export const getBattleRequestStatus = query({
  args: { requestId: v.id("pvpBattleRequests") },
  handler: async (ctx, { requestId }) => {
    const request = await ctx.db.get(requestId);
    return request;
  },
});

// Accept a battle request
export const acceptBattleRequest = mutation({
  args: { requestId: v.id("pvpBattleRequests") },
  handler: async (ctx, { requestId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const request = await ctx.db.get(requestId);
    if (!request) throw new Error("Request not found");
    if (request.targetId !== identity.subject) throw new Error("Not your request");
    if (request.status !== "pending") throw new Error("Request is no longer pending");
    if (Date.now() > request.expiresAt) throw new Error("Request has expired");

    await ctx.db.patch(requestId, {
      status: "accepted",
    });

    return { success: true };
  },
});

// Decline a battle request
export const declineBattleRequest = mutation({
  args: { requestId: v.id("pvpBattleRequests") },
  handler: async (ctx, { requestId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const request = await ctx.db.get(requestId);
    if (!request) throw new Error("Request not found");
    if (request.targetId !== identity.subject) throw new Error("Not your request");

    await ctx.db.patch(requestId, {
      status: "declined",
    });

    return { success: true };
  },
});

// Cancel own battle request
export const cancelBattleRequest = mutation({
  args: { requestId: v.id("pvpBattleRequests") },
  handler: async (ctx, { requestId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const request = await ctx.db.get(requestId);
    if (!request) throw new Error("Request not found");
    if (request.challengerId !== identity.subject) throw new Error("Not your request");

    await ctx.db.patch(requestId, {
      status: "cancelled",
    });

    return { success: true };
  },
});

// Submit selected cards for PvP battle
export const submitPvpCards = mutation({
  args: {
    requestId: v.id("pvpBattleRequests"),
    selectedCards: v.array(
      v.object({
        cardId: v.id("cards"),
        position: v.number(),
      })
    ),
  },
  handler: async (ctx, { requestId, selectedCards }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    if (selectedCards.length !== 3) {
      throw new Error("Must select exactly 3 cards");
    }

    const request = await ctx.db.get(requestId);
    if (!request) throw new Error("Request not found");
    if (request.status !== "accepted") throw new Error("Battle not accepted yet");

    const userId = identity.subject;
    const isChallenger = request.challengerId === userId;
    const isTarget = request.targetId === userId;

    if (!isChallenger && !isTarget) {
      throw new Error("You are not part of this battle");
    }

    // Verify player owns the cards
    for (const selected of selectedCards) {
      const inventoryItem = await ctx.db
        .query("inventory")
        .withIndex("by_userId_cardId", (q) =>
          q.eq("userId", userId).eq("cardId", selected.cardId)
        )
        .first();

      if (!inventoryItem || inventoryItem.quantity < 1) {
        throw new Error("You don't own one of the selected cards");
      }
    }

    // Update the request with selected cards
    if (isChallenger) {
      await ctx.db.patch(requestId, { challengerCards: selectedCards });
    } else {
      await ctx.db.patch(requestId, { targetCards: selectedCards });
    }

    // Check if both players have submitted
    const updatedRequest = await ctx.db.get(requestId);
    const bothReady = updatedRequest?.challengerCards && updatedRequest?.targetCards;

    if (bothReady) {
      await ctx.db.patch(requestId, { battleStartedAt: Date.now() });
    }

    return { bothReady };
  },
});

// Resolve PvP battle and distribute rewards
export const resolvePvpBattle = mutation({
  args: { requestId: v.id("pvpBattleRequests") },
  handler: async (ctx, { requestId }) => {
    const request = await ctx.db.get(requestId);
    if (!request) throw new Error("Request not found");
    if (!request.challengerCards || !request.targetCards) {
      throw new Error("Both players must submit cards first");
    }

    // If battle already resolved, return the stored result
    if (request.battleResult) {
      return request.battleResult;
    }

    // Get card details for both players
    const getCardDetails = async (
      cards: Array<{ cardId: Id<"cards">; position: number }>
    ) => {
      return Promise.all(
        cards.sort((a, b) => a.position - b.position).map(async (c) => {
          const card = await ctx.db.get(c.cardId);
          if (!card) throw new Error("Card not found");
          return {
            cardId: c.cardId,
            name: card.name,
            attack: card.attack,
            defense: card.defense,
            rarity: card.rarity,
            position: c.position,
          };
        })
      );
    };

    const challengerCards = await getCardDetails(request.challengerCards);
    const targetCards = await getCardDetails(request.targetCards);

    // Run battle logic (same as NPC battle)
    const rounds: Array<{
      round: number;
      challengerCard: (typeof challengerCards)[0] & { currentDefense: number };
      targetCard: (typeof targetCards)[0] & { currentDefense: number };
      winner: "challenger" | "target" | "draw";
      damage: number;
    }> = [];

    let challengerWins = 0;
    let targetWins = 0;

    // Track surviving cards
    let challengerSurvivor: ((typeof challengerCards)[0] & {
      currentDefense: number;
    }) | null = null;
    let targetSurvivor: ((typeof targetCards)[0] & {
      currentDefense: number;
    }) | null = null;

    type CardWithDefense = (typeof challengerCards)[0] & { currentDefense: number };

    for (let i = 0; i < 3; i++) {
      const currentChallengerCard = challengerCards[i]!;
      const currentTargetCard = targetCards[i]!;

      const cCard: CardWithDefense = challengerSurvivor ?? {
        ...currentChallengerCard,
        currentDefense: currentChallengerCard.defense,
      };
      const tCard: CardWithDefense = targetSurvivor ?? {
        ...currentTargetCard,
        currentDefense: currentTargetCard.defense,
      };

      let roundWinner: "challenger" | "target" | "draw";
      let damage = 0;

      // Same battle logic as NPC
      if (cCard.attack > tCard.currentDefense && tCard.attack <= cCard.currentDefense) {
        roundWinner = "challenger";
        cCard.currentDefense -= tCard.attack;
        challengerSurvivor = cCard.currentDefense > 0 ? cCard : null;
        targetSurvivor = null;
        challengerWins++;
        damage = cCard.attack;
      } else if (tCard.attack > cCard.currentDefense && cCard.attack <= tCard.currentDefense) {
        roundWinner = "target";
        tCard.currentDefense -= cCard.attack;
        targetSurvivor = tCard.currentDefense > 0 ? tCard : null;
        challengerSurvivor = null;
        targetWins++;
        damage = tCard.attack;
      } else if (cCard.attack > tCard.currentDefense && tCard.attack > cCard.currentDefense) {
        // Both deal lethal damage - compare attack values
        if (cCard.attack > tCard.attack) {
          roundWinner = "challenger";
          challengerWins++;
        } else if (tCard.attack > cCard.attack) {
          roundWinner = "target";
          targetWins++;
        } else {
          roundWinner = Math.random() < 0.5 ? "challenger" : "target";
          if (roundWinner === "challenger") challengerWins++;
          else targetWins++;
        }
        damage = Math.max(cCard.attack, tCard.attack);
        challengerSurvivor = null;
        targetSurvivor = null;
      } else {
        // Neither can defeat the other, 50/50
        roundWinner = Math.random() < 0.5 ? "challenger" : "target";
        damage = 0;
        if (roundWinner === "challenger") {
          challengerWins++;
          targetSurvivor = null;
          cCard.currentDefense -= tCard.attack;
          challengerSurvivor = cCard.currentDefense > 0 ? cCard : null;
        } else {
          targetWins++;
          challengerSurvivor = null;
          tCard.currentDefense -= cCard.attack;
          targetSurvivor = tCard.currentDefense > 0 ? tCard : null;
        }
      }

      rounds.push({
        round: i + 1,
        challengerCard: { ...cCard },
        targetCard: { ...tCard },
        winner: roundWinner,
        damage,
      });
    }

    // Determine winner
    let winnerRole: "challenger" | "target";
    if (challengerWins > targetWins) {
      winnerRole = "challenger";
    } else if (targetWins > challengerWins) {
      winnerRole = "target";
    } else {
      winnerRole = Math.random() < 0.5 ? "challenger" : "target";
    }

    const winnerId =
      winnerRole === "challenger" ? request.challengerId : request.targetId;
    const loserId =
      winnerRole === "challenger" ? request.targetId : request.challengerId;

    // Get both users
    const winner = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", winnerId))
      .first();

    const loser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", loserId))
      .first();

    if (!winner || !loser) throw new Error("User not found");

    // Calculate rewards (same as NPC but no entry fee)
    const coinsWon = Math.floor(
      PVP_CONFIG.rewardMin +
        Math.random() * (PVP_CONFIG.rewardMax - PVP_CONFIG.rewardMin + 1)
    );

    const currentWins = winner.battleWins ?? 0;
    const packChance = Math.min(
      0.5,
      PVP_CONFIG.packChance + currentWins * 0.02
    );
    let packWon: string | null = null;

    if (Math.random() < packChance) {
      const packTypes = ["small", "normal", "big"] as const;
      packWon = packTypes[Math.floor(Math.random() * packTypes.length)] ?? "small";
    }

    // Update winner
    const winnerUpdates: {
      pattyCoins: number;
      battleWins: number;
      unopenedPacks?: typeof winner.unopenedPacks;
    } = {
      pattyCoins: (winner.pattyCoins ?? 0) + coinsWon,
      battleWins: (winner.battleWins ?? 0) + 1,
    };

    if (packWon) {
      const currentPacks = winner.unopenedPacks ?? [];
      const existingPack = currentPacks.find((p) => p.packType === packWon);
      if (existingPack) {
        winnerUpdates.unopenedPacks = currentPacks.map((p) =>
          p.packType === packWon ? { ...p, quantity: p.quantity + 1 } : p
        );
      } else {
        winnerUpdates.unopenedPacks = [
          ...currentPacks,
          { packType: packWon, quantity: 1, acquiredAt: Date.now() },
        ];
      }
    }

    await ctx.db.patch(winner._id, winnerUpdates);

    // Update loser
    await ctx.db.patch(loser._id, {
      battleLosses: (loser.battleLosses ?? 0) + 1,
    });

    // Log transactions
    const now = Date.now();
    await ctx.db.insert("transactions", {
      userId: winnerId,
      type: "battle_reward",
      amount: coinsWon,
      metadata: { pvp: true, opponent: loserId, packWon },
      timestamp: now,
    });

    // Record in battles table
    await ctx.db.insert("battles", {
      player1Id: request.challengerId,
      player2Id: request.targetId,
      winnerId,
      player1Deck: request.challengerCards.map((c) => c.cardId),
      player2Deck: request.targetCards.map((c) => c.cardId),
      startedAt: request.battleStartedAt ?? now,
      endedAt: now,
      battleLog: rounds,
    });

    // Build result object
    const battleResult = {
      winnerId,
      winnerUsername: winner.username ?? "Unknown",
      loserId,
      loserUsername: loser.username ?? "Unknown",
      winnerRole,
      challengerWins,
      targetWins,
      rounds,
      coinsWon,
      packWon,
      winnerNewBalance: (winner.pattyCoins ?? 0) + coinsWon,
    };

    // Store result so both players see the same battle
    await ctx.db.patch(requestId, { battleResult });

    return battleResult;
  },
});
