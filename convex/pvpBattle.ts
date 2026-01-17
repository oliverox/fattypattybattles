import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
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
      .withIndex("by_challenger_target", (q) =>
        q.eq("challengerId", challengerId).eq("targetId", targetUserId).eq("status", "pending")
      )
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
      challengerCard: (typeof challengerCards)[0] & { currentDefense: number; startingDefense: number; isSurvivor: boolean };
      targetCard: (typeof targetCards)[0] & { currentDefense: number; startingDefense: number; isSurvivor: boolean };
      winner: "challenger" | "target" | "draw";
      damage: number;
      coinFlip: boolean;
    }> = [];

    let challengerWins = 0;
    let targetWins = 0;

    // Track surviving cards
    let challengerSurvivor: ((typeof challengerCards)[0] & {
      currentDefense: number;
      startingDefense: number;
    }) | null = null;
    let targetSurvivor: ((typeof targetCards)[0] & {
      currentDefense: number;
      startingDefense: number;
    }) | null = null;

    type CardWithDefense = (typeof challengerCards)[0] & { currentDefense: number; startingDefense: number };

    // Track card indices separately - survivors don't consume the next card slot
    let challengerCardIndex = 0;
    let targetCardIndex = 0;

    for (let round = 0; round < 3; round++) {
      // Clear survivors with 0 or less defense
      if (challengerSurvivor && challengerSurvivor.currentDefense <= 0) {
        console.log(`[PVP DEBUG] Round ${round + 1}: Clearing challengerSurvivor with 0 defense`);
        challengerSurvivor = null;
      }
      if (targetSurvivor && targetSurvivor.currentDefense <= 0) {
        console.log(`[PVP DEBUG] Round ${round + 1}: Clearing targetSurvivor with 0 defense`);
        targetSurvivor = null;
      }

      // Determine which card to use
      const challengerIsSurvivor = challengerSurvivor !== null;
      const targetIsSurvivor = targetSurvivor !== null;

      // Create the card for this round
      let cCard: CardWithDefense;
      let tCard: CardWithDefense;

      if (challengerSurvivor) {
        cCard = { ...challengerSurvivor }; // Clone to avoid mutating the survivor reference
      } else {
        // Only access array when we need a fresh card
        if (challengerCardIndex >= challengerCards.length) {
          console.error(`[PVP ERROR] Challenger card index ${challengerCardIndex} out of bounds (max ${challengerCards.length - 1})`);
          throw new Error("PvP battle error: ran out of challenger cards");
        }
        const currentChallengerCard = challengerCards[challengerCardIndex]!;
        cCard = {
          ...currentChallengerCard,
          currentDefense: currentChallengerCard.defense,
          startingDefense: currentChallengerCard.defense,
        };
        challengerCardIndex++;
      }

      if (targetSurvivor) {
        tCard = { ...targetSurvivor }; // Clone to avoid mutating the survivor reference
      } else {
        // Only access array when we need a fresh card
        if (targetCardIndex >= targetCards.length) {
          console.error(`[PVP ERROR] Target card index ${targetCardIndex} out of bounds (max ${targetCards.length - 1})`);
          throw new Error("PvP battle error: ran out of target cards");
        }
        const currentTargetCard = targetCards[targetCardIndex]!;
        tCard = {
          ...currentTargetCard,
          currentDefense: currentTargetCard.defense,
          startingDefense: currentTargetCard.defense,
        };
        targetCardIndex++;
      }

      console.log(`[PVP DEBUG] Round ${round + 1}: Challenger(${challengerIsSurvivor ? 'SURVIVOR' : 'FRESH'} atk=${cCard.attack} def=${cCard.currentDefense}), Target(${targetIsSurvivor ? 'SURVIVOR' : 'FRESH'} atk=${tCard.attack} def=${tCard.currentDefense})`);

      // Record starting defense for this round (especially important for survivors)
      const challengerStartingDefense = cCard.currentDefense;
      const targetStartingDefense = tCard.currentDefense;

      let roundWinner: "challenger" | "target" | "draw";
      let damage = 0;
      let coinFlip = false;

      // Debug log
      console.log(`[PVP DEBUG] Round ${round + 1}: ChallengerSurvivor=${challengerIsSurvivor} (def=${challengerStartingDefense}), TargetSurvivor=${targetIsSurvivor} (def=${targetStartingDefense})`);

      const cDef = cCard.currentDefense;
      const tDef = tCard.currentDefense;

      // Check for instant knockout - cards with 0 defense can't fight
      if (cDef <= 0 && tDef <= 0) {
        // Both have 0 defense - 50/50
        coinFlip = true;
        roundWinner = Math.random() < 0.5 ? "challenger" : "target";
        if (roundWinner === "challenger") challengerWins++;
        else targetWins++;
        damage = 0;
        cCard.currentDefense = 0;
        tCard.currentDefense = 0;
        challengerSurvivor = null;
        targetSurvivor = null;
        console.log(`[PVP DEBUG] Round ${round + 1} RESULT: Both 0 def, ${roundWinner} wins 50/50, no survivor`);
      } else if (cDef <= 0) {
        // Challenger has 0 defense - instant knockout
        roundWinner = "target";
        targetWins++;
        damage = tCard.attack;
        cCard.currentDefense = 0;
        // Target doesn't take damage, survives if defense > 0
        targetSurvivor = tCard.currentDefense > 0 ? tCard : null;
        challengerSurvivor = null;
        console.log(`[PVP DEBUG] Round ${round + 1} RESULT: Challenger 0 def knockout, Target wins, survives=${targetSurvivor !== null}`);
      } else if (tDef <= 0) {
        // Target has 0 defense - instant knockout
        roundWinner = "challenger";
        challengerWins++;
        damage = cCard.attack;
        tCard.currentDefense = 0;
        // Challenger doesn't take damage, survives if defense > 0
        challengerSurvivor = cCard.currentDefense > 0 ? cCard : null;
        targetSurvivor = null;
        console.log(`[PVP DEBUG] Round ${round + 1} RESULT: Target 0 def knockout, Challenger wins, survives=${challengerSurvivor !== null}`);
      } else if (cCard.attack > tCard.currentDefense && tCard.attack <= cCard.currentDefense) {
        // Challenger wins clearly
        roundWinner = "challenger";
        damage = cCard.attack;
        cCard.currentDefense = Math.max(0, cCard.currentDefense - tCard.attack);
        // Only survive if defense > 0
        challengerSurvivor = cCard.currentDefense > 0 ? cCard : null;
        targetSurvivor = null;
        tCard.currentDefense = 0;
        challengerWins++;
        console.log(`[PVP DEBUG] Round ${round + 1} RESULT: Challenger wins clearly, def=${cCard.currentDefense}, survives=${challengerSurvivor !== null}`);
      } else if (tCard.attack > cCard.currentDefense && cCard.attack <= tCard.currentDefense) {
        // Target wins clearly
        roundWinner = "target";
        damage = tCard.attack;
        tCard.currentDefense = Math.max(0, tCard.currentDefense - cCard.attack);
        // Only survive if defense > 0
        targetSurvivor = tCard.currentDefense > 0 ? tCard : null;
        challengerSurvivor = null;
        cCard.currentDefense = 0;
        targetWins++;
        console.log(`[PVP DEBUG] Round ${round + 1} RESULT: Target wins clearly, def=${tCard.currentDefense}, survives=${targetSurvivor !== null}`);
      } else if (cCard.attack > tCard.currentDefense && tCard.attack > cCard.currentDefense) {
        // Both deal lethal damage - higher defense wins, then higher attack, then 50/50
        if (cDef > tDef) {
          roundWinner = "challenger";
          challengerWins++;
          console.log(`[PVP DEBUG] Round ${round + 1} RESULT: Both lethal, Challenger wins (higher def ${cDef} > ${tDef}), no survivor`);
        } else if (tDef > cDef) {
          roundWinner = "target";
          targetWins++;
          console.log(`[PVP DEBUG] Round ${round + 1} RESULT: Both lethal, Target wins (higher def ${tDef} > ${cDef}), no survivor`);
        } else if (cCard.attack > tCard.attack) {
          // Equal defense, compare attack
          roundWinner = "challenger";
          challengerWins++;
          console.log(`[PVP DEBUG] Round ${round + 1} RESULT: Both lethal equal def, Challenger wins (higher atk ${cCard.attack} > ${tCard.attack}), no survivor`);
        } else if (tCard.attack > cCard.attack) {
          roundWinner = "target";
          targetWins++;
          console.log(`[PVP DEBUG] Round ${round + 1} RESULT: Both lethal equal def, Target wins (higher atk ${tCard.attack} > ${cCard.attack}), no survivor`);
        } else {
          // Equal defense AND equal attack, 50/50
          coinFlip = true;
          roundWinner = Math.random() < 0.5 ? "challenger" : "target";
          if (roundWinner === "challenger") {
            challengerWins++;
          } else {
            targetWins++;
          }
          console.log(`[PVP DEBUG] Round ${round + 1} RESULT: Both lethal equal def & atk, ${roundWinner} wins 50/50, no survivor`);
        }
        // No survivor for either - both dealt lethal damage
        cCard.currentDefense = 0;
        tCard.currentDefense = 0;
        challengerSurvivor = null;
        targetSurvivor = null;
        damage = Math.max(cCard.attack, tCard.attack);
      } else {
        // Neither can defeat the other, 50/50
        coinFlip = true;
        roundWinner = Math.random() < 0.5 ? "challenger" : "target";
        damage = 0;
        if (roundWinner === "challenger") {
          challengerWins++;
          cCard.currentDefense = Math.max(0, cCard.currentDefense - tCard.attack);
          // Only survive if defense > 0
          challengerSurvivor = cCard.currentDefense > 0 ? cCard : null;
          tCard.currentDefense = 0;
          targetSurvivor = null;
          console.log(`[PVP DEBUG] Round ${round + 1} RESULT: Stalemate, Challenger wins 50/50, def=${cCard.currentDefense}, survives=${challengerSurvivor !== null}`);
        } else {
          targetWins++;
          tCard.currentDefense = Math.max(0, tCard.currentDefense - cCard.attack);
          // Only survive if defense > 0
          targetSurvivor = tCard.currentDefense > 0 ? tCard : null;
          cCard.currentDefense = 0;
          challengerSurvivor = null;
          console.log(`[PVP DEBUG] Round ${round + 1} RESULT: Stalemate, Target wins 50/50, def=${tCard.currentDefense}, survives=${targetSurvivor !== null}`);
        }
      }

      console.log(`[PVP DEBUG] After Round ${round + 1}: challengerSurvivor=${challengerSurvivor !== null}, targetSurvivor=${targetSurvivor !== null}`);

      rounds.push({
        round: round + 1,
        challengerCard: { ...cCard, startingDefense: challengerStartingDefense, isSurvivor: challengerIsSurvivor },
        targetCard: { ...tCard, startingDefense: targetStartingDefense, isSurvivor: targetIsSurvivor },
        winner: roundWinner,
        damage,
        coinFlip,
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

    // Update daily quest progress for PvP battles (both players completed a PvP battle)
    await ctx.scheduler.runAfter(0, internal.dailyRewards.updateQuestProgress, {
      clerkId: request.challengerId,
      questType: "pvp_battle",
      amount: 1,
    });
    await ctx.scheduler.runAfter(0, internal.dailyRewards.updateQuestProgress, {
      clerkId: request.targetId,
      questType: "pvp_battle",
      amount: 1,
    });

    return battleResult;
  },
});
