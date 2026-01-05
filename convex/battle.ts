import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const BATTLE_CONFIG = {
  entryCost: 15,
  minCards: 3,
  rewardMin: 30,
  rewardMax: 50,
  packChance: 0.15,
};

// Debug: Get all users battle stats
export const debugAllBattleStats = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map(u => ({
      username: u.username,
      battleWins: u.battleWins ?? 0,
      battleLosses: u.battleLosses ?? 0,
      pattyCoins: u.pattyCoins ?? 0,
    }));
  },
});

// Debug: Get recent battle transactions
export const debugRecentBattles = query({
  args: {},
  handler: async (ctx) => {
    const txns = await ctx.db.query("transactions").order("desc").take(20);
    return txns.filter(t => t.type === "battle_reward");
  },
});

// Debug: Manually set battle wins for testing
export const debugSetBattleWins = mutation({
  args: { username: v.string(), wins: v.number(), losses: v.number() },
  handler: async (ctx, { username, wins, losses }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      battleWins: wins,
      battleLosses: losses,
    });

    return { success: true, username, wins, losses };
  },
});

// Check if player can battle
export const canBattle = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      return { canBattle: false, reason: "User not found", battleWins: 0, battleLosses: 0, totalBattles: 0, packChance: BATTLE_CONFIG.packChance };
    }

    // Calculate stats for all cases
    const battleWins = user.battleWins ?? 0;
    const battleLosses = user.battleLosses ?? 0;
    const totalBattles = battleWins + battleLosses;
    const packChance = Math.min(0.50, BATTLE_CONFIG.packChance + (battleWins * 0.02));
    const stats = { battleWins, battleLosses, totalBattles, packChance };

    const coins = user.pattyCoins ?? 0;
    if (coins < BATTLE_CONFIG.entryCost) {
      return {
        canBattle: false,
        reason: `Need ${BATTLE_CONFIG.entryCost} PattyCoins (you have ${coins})`,
        ...stats
      };
    }

    // Count total cards in inventory
    const inventory = await ctx.db
      .query("inventory")
      .withIndex("by_userId", (q) => q.eq("userId", clerkId))
      .collect();

    const totalCards = inventory.reduce((sum, item) => sum + item.quantity, 0);
    if (totalCards < BATTLE_CONFIG.minCards) {
      return {
        canBattle: false,
        reason: `Need ${BATTLE_CONFIG.minCards} cards (you have ${totalCards})`,
        ...stats
      };
    }

    return { canBattle: true, coins, totalCards, ...stats };
  },
});

// Get player's cards for selection
export const getPlayerCards = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const inventory = await ctx.db
      .query("inventory")
      .withIndex("by_userId", (q) => q.eq("userId", clerkId))
      .collect();

    // Expand cards by quantity (one entry per card instance)
    const cards: Array<{
      inventoryId: string;
      cardId: string;
      name: string;
      attack: number;
      defense: number;
      rarity: string;
    }> = [];

    for (const item of inventory) {
      const card = await ctx.db.get(item.cardId);
      if (!card) continue;

      // Expand each inventory item by its quantity
      for (let i = 0; i < item.quantity; i++) {
        cards.push({
          inventoryId: `${item._id}:${i}`,
          cardId: item.cardId as string,
          name: card.name,
          attack: card.attack,
          defense: card.defense,
          rarity: card.rarity,
        });
      }
    }

    return cards;
  },
});

// Start a battle - deduct coins and generate NPC cards
export const startBattle = mutation({
  args: {
    clerkId: v.string(),
    selectedCards: v.array(v.object({
      cardId: v.id("cards"),
      position: v.number(), // 1, 2, or 3
    })),
  },
  handler: async (ctx, { clerkId, selectedCards }) => {
    // Validate selection
    if (selectedCards.length !== 3) {
      throw new Error("Must select exactly 3 cards");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const coins = user.pattyCoins ?? 0;
    if (coins < BATTLE_CONFIG.entryCost) {
      throw new Error("Not enough PattyCoins");
    }

    // Verify player owns the cards
    for (const selected of selectedCards) {
      const inventoryItem = await ctx.db
        .query("inventory")
        .withIndex("by_userId_cardId", (q) =>
          q.eq("userId", clerkId).eq("cardId", selected.cardId)
        )
        .first();

      if (!inventoryItem || inventoryItem.quantity < 1) {
        throw new Error("You don't own one of the selected cards");
      }
    }

    // Deduct entry cost
    await ctx.db.patch(user._id, {
      pattyCoins: coins - BATTLE_CONFIG.entryCost,
    });

    // Get all cards for NPC selection
    const allCards = await ctx.db.query("cards").collect();

    // Calculate rarity weights based on player's battle wins
    const battleWins = user.battleWins ?? 0;

    // Base weights for each rarity (higher = more common in NPC deck)
    // As wins increase, rarer cards become more likely
    const getRarityWeight = (rarity: string): number => {
      // After 3 wins, common cards are excluded entirely
      if (rarity === 'common' && battleWins >= 3) {
        return 0;
      }

      const baseWeights: Record<string, number> = {
        common: 100,
        uncommon: 50,
        rare: 25,
        legendary: 10,
        mythical: 5,
        divine: 3,
        prismatic: 2,
        transcendent: 1,
        secret: 0.5,
      };

      const base = baseWeights[rarity] ?? 1;

      // Every 3 wins, shift weights towards rarer cards
      // Common cards become less likely, rare cards become more likely
      const winBonus = Math.floor(battleWins / 3);

      if (rarity === 'common') {
        return Math.max(10, base - winBonus * 15);
      } else if (rarity === 'uncommon') {
        return Math.max(10, base - winBonus * 5);
      } else {
        // Rarer cards get boosted
        return base + winBonus * (baseWeights['common'] ?? 100) / base;
      }
    };

    // Weighted random selection for NPC cards
    const npcCards: Array<{
      cardId: typeof allCards[0]["_id"];
      name: string;
      attack: number;
      defense: number;
      rarity: string;
      position: number;
    }> = [];
    const usedNames = new Set<string>();

    // Create weighted pool
    const weightedCards = allCards.map(card => ({
      card,
      weight: getRarityWeight(card.rarity),
    }));

    const selectWeightedCard = () => {
      const availableCards = weightedCards.filter(wc => !usedNames.has(wc.card.name));
      if (availableCards.length === 0) return null;

      const totalWeight = availableCards.reduce((sum, wc) => sum + wc.weight, 0);
      let random = Math.random() * totalWeight;

      for (const wc of availableCards) {
        random -= wc.weight;
        if (random <= 0) {
          return wc.card;
        }
      }
      return availableCards[availableCards.length - 1]?.card ?? null;
    };

    // Select 3 different cards using weighted selection
    for (let i = 0; i < 3; i++) {
      const card = selectWeightedCard();
      if (card && !usedNames.has(card.name)) {
        usedNames.add(card.name);
        npcCards.push({
          cardId: card._id,
          name: card.name,
          attack: card.attack,
          defense: card.defense,
          rarity: card.rarity,
          position: npcCards.length + 1,
        });
      }
    }

    // Get player card details
    const playerCards = await Promise.all(
      selectedCards
        .sort((a, b) => a.position - b.position)
        .map(async (selected) => {
          const card = await ctx.db.get(selected.cardId);
          if (!card) throw new Error("Card not found");
          return {
            cardId: selected.cardId,
            name: card.name,
            attack: card.attack,
            defense: card.defense,
            rarity: card.rarity,
            position: selected.position,
          };
        })
    );

    return {
      playerCards,
      npcCards,
      battleId: `battle_${Date.now()}`,
    };
  },
});

// Resolve battle and give rewards
export const resolveBattle = mutation({
  args: {
    clerkId: v.string(),
    playerCards: v.array(v.object({
      cardId: v.id("cards"),
      name: v.string(),
      attack: v.number(),
      defense: v.number(),
      rarity: v.string(),
      position: v.number(),
    })),
    npcCards: v.array(v.object({
      cardId: v.id("cards"),
      name: v.string(),
      attack: v.number(),
      defense: v.number(),
      rarity: v.string(),
      position: v.number(),
    })),
  },
  handler: async (ctx, { clerkId, playerCards, npcCards }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Sort cards by position
    const sortedPlayerCards = [...playerCards].sort((a, b) => a.position - b.position);
    const sortedNpcCards = [...npcCards].sort((a, b) => a.position - b.position);

    // Battle simulation
    const rounds: Array<{
      round: number;
      playerCard: typeof playerCards[0] & { currentDefense: number };
      npcCard: typeof npcCards[0] & { currentDefense: number };
      winner: "player" | "npc" | "draw";
      damage: number;
    }> = [];

    let playerWins = 0;
    let npcWins = 0;

    // Track surviving cards with current defense
    let playerSurvivor: (typeof playerCards[0] & { currentDefense: number }) | null = null;
    let npcSurvivor: (typeof npcCards[0] & { currentDefense: number }) | null = null;

    for (let i = 0; i < 3; i++) {
      // Get the card for this round (survivor or next in line)
      const currentPlayerCard = sortedPlayerCards[i]!;
      const currentNpcCard = sortedNpcCards[i]!;

      const playerCard: typeof playerCards[0] & { currentDefense: number } = playerSurvivor ?? {
        ...currentPlayerCard,
        currentDefense: currentPlayerCard.defense
      };
      const npcCard: typeof npcCards[0] & { currentDefense: number } = npcSurvivor ?? {
        ...currentNpcCard,
        currentDefense: currentNpcCard.defense
      };

      // Battle logic: Attack vs Defense
      const playerAttack = playerCard.attack;
      const npcAttack = npcCard.attack;
      const playerDef = playerCard.currentDefense;
      const npcDef = npcCard.currentDefense;

      let roundWinner: "player" | "npc" | "draw";
      let damage = 0;

      // Player attacks NPC's defense, NPC attacks player's defense
      const playerDamageToNpc = Math.max(0, playerAttack - npcDef);
      const npcDamageToPlayer = Math.max(0, npcAttack - playerDef);

      if (playerAttack > npcDef && npcAttack <= playerDef) {
        // Player wins clearly
        roundWinner = "player";
        damage = playerAttack;
        playerCard.currentDefense -= npcAttack; // Take some damage
        playerSurvivor = playerCard.currentDefense > 0 ? playerCard : null;
        npcSurvivor = null;
        playerWins++;
      } else if (npcAttack > playerDef && playerAttack <= npcDef) {
        // NPC wins clearly
        roundWinner = "npc";
        damage = npcAttack;
        npcCard.currentDefense -= playerAttack; // Take some damage
        npcSurvivor = npcCard.currentDefense > 0 ? npcCard : null;
        playerSurvivor = null;
        npcWins++;
      } else if (playerAttack > npcDef && npcAttack > playerDef) {
        // Both deal lethal damage - compare attack values
        if (playerAttack > npcAttack) {
          roundWinner = "player";
          playerWins++;
        } else if (npcAttack > playerAttack) {
          roundWinner = "npc";
          npcWins++;
        } else {
          // Equal attacks, 50/50
          roundWinner = Math.random() < 0.5 ? "player" : "npc";
          if (roundWinner === "player") playerWins++;
          else npcWins++;
        }
        damage = Math.max(playerAttack, npcAttack);
        playerSurvivor = null;
        npcSurvivor = null;
      } else {
        // Neither can defeat the other, 50/50
        roundWinner = Math.random() < 0.5 ? "player" : "npc";
        damage = 0;
        if (roundWinner === "player") {
          playerWins++;
          npcSurvivor = null;
          playerCard.currentDefense -= npcAttack;
          playerSurvivor = playerCard.currentDefense > 0 ? playerCard : null;
        } else {
          npcWins++;
          playerSurvivor = null;
          npcCard.currentDefense -= playerAttack;
          npcSurvivor = npcCard.currentDefense > 0 ? npcCard : null;
        }
      }

      rounds.push({
        round: i + 1,
        playerCard: { ...playerCard },
        npcCard: { ...npcCard },
        winner: roundWinner,
        damage,
      });
    }

    // Determine overall winner
    let winner: "player" | "npc";
    if (playerWins > npcWins) {
      winner = "player";
    } else if (npcWins > playerWins) {
      winner = "npc";
    } else {
      // Tie - 50/50
      winner = Math.random() < 0.5 ? "player" : "npc";
    }

    // Calculate rewards
    let coinsWon = 0;
    let packWon: string | null = null;

    if (winner === "player") {
      // Random coins between min and max
      coinsWon = Math.floor(
        BATTLE_CONFIG.rewardMin +
        Math.random() * (BATTLE_CONFIG.rewardMax - BATTLE_CONFIG.rewardMin + 1)
      );

      // Chance to win a pack (increases by 2% per win, capped at 50%)
      const currentWins = user.battleWins ?? 0;
      const packChance = Math.min(0.50, BATTLE_CONFIG.packChance + (currentWins * 0.02));
      if (Math.random() < packChance) {
        const packTypes = ["small", "normal", "big"] as const;
        packWon = packTypes[Math.floor(Math.random() * packTypes.length)] ?? "small";
      }

      // Add rewards to user and increment win count
      const newCoins = (user.pattyCoins ?? 0) + coinsWon;
      const newBattleWins = (user.battleWins ?? 0) + 1;
      const updates: { pattyCoins: number; battleWins: number; unopenedPacks?: typeof user.unopenedPacks } = {
        pattyCoins: newCoins,
        battleWins: newBattleWins,
      };

      if (packWon) {
        const currentPacks = user.unopenedPacks ?? [];
        const existingPack = currentPacks.find((p) => p.packType === packWon);
        if (existingPack) {
          updates.unopenedPacks = currentPacks.map((p) =>
            p.packType === packWon ? { ...p, quantity: p.quantity + 1 } : p
          );
        } else {
          updates.unopenedPacks = [
            ...currentPacks,
            { packType: packWon, quantity: 1, acquiredAt: Date.now() },
          ];
        }
      }

      await ctx.db.patch(user._id, updates);
    } else {
      // Player lost - increment loss count
      const newBattleLosses = (user.battleLosses ?? 0) + 1;
      await ctx.db.patch(user._id, {
        battleLosses: newBattleLosses,
      });
    }

    // Log transaction
    await ctx.db.insert("transactions", {
      userId: clerkId,
      type: "battle_reward",
      amount: winner === "player" ? coinsWon : -BATTLE_CONFIG.entryCost,
      metadata: {
        winner,
        playerWins,
        npcWins,
        packWon,
      },
      timestamp: Date.now(),
    });

    // Update daily quest progress for battle wins
    if (winner === "player") {
      await ctx.scheduler.runAfter(0, internal.dailyRewards.updateQuestProgress, {
        clerkId,
        questType: "win_battle",
        amount: 1,
      });
    }

    return {
      winner,
      playerWins,
      npcWins,
      rounds,
      coinsWon,
      packWon,
      newBalance: (user.pattyCoins ?? 0) + (winner === "player" ? coinsWon : 0),
    };
  },
});
