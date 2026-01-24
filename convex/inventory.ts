import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Sample cards for seeding the database
const SAMPLE_CARDS = [
  // Common cards (10)
  { name: "astro-patty", rarity: "common", cost: 1, attack: 2, defense: 1, description: "space is the best" },
  { name: "catty patty", rarity: "common", cost: 1, attack: 1, defense: 3, description: "meowwww" },
  { name: "water patty", rarity: "common", cost: 1, attack: 2, defense: 2, description: "wet as a fish" },
  { name: "daytime patty", rarity: "common", cost: 2, attack: 3, defense: 1, description: "i'm getting sunburned" },
  { name: "nighttime patty", rarity: "common", cost: 1, attack: 2, defense: 1, description: "nightburned lol" },
  { name: "juice patty", rarity: "common", cost: 1, attack: 1, defense: 2, description: "tastier than water" },
  { name: "doggy patty", rarity: "common", cost: 1, attack: 2, defense: 1, description: "team dogs" },
  { name: "zebra crossing patty", rarity: "common", cost: 2, attack: 2, defense: 2, description: "CAR INCOMING!!!" },
  { name: "compass patty", rarity: "common", cost: 1, attack: 1, defense: 2, description: "north = north lol" },
  { name: "card patty", rarity: "common", cost: 1, attack: 2, defense: 1, description: "to pencil patty" },

  // Uncommon cards (8)
  { name: "cacti patty", rarity: "uncommon", cost: 3, attack: 4, defense: 3, description: "thorny" },
  { name: "abyss patty", rarity: "uncommon", cost: 2, attack: 3, defense: 3, description: "never ending" },
  { name: "jail patty", rarity: "uncommon", cost: 3, attack: 5, defense: 2, description: "LET ME OUT!!" },
  { name: "artist patty", rarity: "uncommon", cost: 2, attack: 2, defense: 4, description: "i'm so good" },
  { name: "cleaning patty", rarity: "uncommon", cost: 3, attack: 4, defense: 2, description: "BORING" },
  { name: "coco-patty", rarity: "uncommon", cost: 2, attack: 3, defense: 2, description: "coconut" },
  { name: "pencil patty", rarity: "uncommon", cost: 3, attack: 3, defense: 4, description: "write write write" },
  { name: "spongey patty", rarity: "uncommon", cost: 2, attack: 4, defense: 1, description: "squishy patty" },

  // Rare cards (6)
  { name: "rainbow patty", rarity: "rare", cost: 4, attack: 6, defense: 4, description: "7 colors" },
  { name: "galaxy patty", rarity: "rare", cost: 4, attack: 5, defense: 5, description: "biggest patty" },
  { name: "car patty", rarity: "rare", cost: 3, attack: 4, defense: 5, description: "VROOM" },
  { name: "ice cream patty", rarity: "rare", cost: 5, attack: 7, defense: 3, description: "colder than ice?" },
  { name: "ruler patty", rarity: "rare", cost: 4, attack: 5, defense: 5, description: "RULER OF RULERS" },
  { name: "chess patty", rarity: "rare", cost: 4, attack: 4, defense: 6, description: "smart" },

  // Legendary cards (4)
  { name: "hot-air-balloon patty", rarity: "legendary", cost: 6, attack: 8, defense: 6, description: "balloon is hot" },
  { name: "money patty", rarity: "legendary", cost: 6, attack: 9, defense: 5, description: "I'M RICH" },
  { name: "satellite patty", rarity: "legendary", cost: 5, attack: 7, defense: 7, description: "i see astro-patty" },
  { name: "mountain patty", rarity: "legendary", cost: 7, attack: 8, defense: 8, description: "tallll" },

  // Mythical cards (3)
  { name: "pyramid patty", rarity: "mythical", cost: 8, attack: 10, defense: 8, description: "ancient times..." },
  { name: "medal patty", rarity: "mythical", cost: 7, attack: 9, defense: 9, description: "I WIN !!!" },
  { name: "lucky patty", rarity: "mythical", cost: 8, attack: 8, defense: 10, description: "luckkkkkkky" },

  // Divine cards (3)
  { name: "police patty", rarity: "divine", cost: 9, attack: 11, defense: 10, description: "UNDER ARREST" },
  { name: "motorbike patty", rarity: "divine", cost: 10, attack: 12, defense: 9, description: "fasst" },
  { name: "rocket patty", rarity: "divine", cost: 10, attack: 11, defense: 10, description: "TO THE MOON" },

  // Prismatic cards (2)
  { name: "kung-fu patty", rarity: "prismatic", cost: 9, attack: 10, defense: 11, description: "defense attack" },
  { name: "ice patty", rarity: "prismatic", cost: 10, attack: 11, defense: 11, description: "Colddddd" },

  // Transcendent cards (1)
  { name: "armor patty", rarity: "transcendent", cost: 12, attack: 13, defense: 12, description: "i'm better than kung-fu patty" },

  // Holographic cards (2)
  { name: "patty combinasion", rarity: "holographic", cost: 15, attack: 14, defense: 15, description: "5 in 1!?" },
  { name: "digital patty", rarity: "holographic", cost: 15, attack: 15, defense: 14, description: "01101000 01101001" },

  // Exclusive cards (1)
  { name: "slimy patty", rarity: "exclusive", cost: 20, attack: 16, defense: 13, description: "slippery and rare..." },
] as const;

// Clear all cards from the database
export const clearCards = mutation({
  handler: async (ctx) => {
    const allCards = await ctx.db.query("cards").collect();
    for (const card of allCards) {
      await ctx.db.delete(card._id);
    }
    return { cleared: true, count: allCards.length };
  },
});

// Sync missing cards from SAMPLE_CARDS to the database
export const syncNewCards = mutation({
  handler: async (ctx) => {
    const existingCards = await ctx.db.query("cards").collect();
    const existingNames = new Set(existingCards.map((c) => c.name));

    let added = 0;
    for (const card of SAMPLE_CARDS) {
      if (!existingNames.has(card.name)) {
        await ctx.db.insert("cards", {
          name: card.name,
          rarity: card.rarity as any,
          cost: card.cost,
          attack: card.attack,
          defense: card.defense,
          description: card.description,
        });
        added++;
      }
    }

    return { added };
  },
});

// Update card stats (for existing cards)
export const updateCardStats = mutation({
  handler: async (ctx) => {
    let updated = 0;
    for (const sampleCard of SAMPLE_CARDS) {
      const existingCard = await ctx.db
        .query("cards")
        .filter((q) => q.eq(q.field("name"), sampleCard.name))
        .first();

      if (existingCard) {
        if (
          existingCard.attack !== sampleCard.attack ||
          existingCard.defense !== sampleCard.defense
        ) {
          await ctx.db.patch(existingCard._id, {
            attack: sampleCard.attack,
            defense: sampleCard.defense,
          });
          updated++;
        }
      }
    }
    return { updated };
  },
});

// Migration: Update secret rarity to holographic
export const migrateSecretToHolographic = mutation({
  handler: async (ctx) => {
    const allCards = await ctx.db.query("cards").collect();
    let updated = 0;
    for (const card of allCards) {
      if ((card.rarity as string) === "secret") {
        await ctx.db.patch(card._id, { rarity: "holographic" });
        updated++;
      }
    }
    return { updated };
  },
});

// Seed the cards table with sample cards
export const seedCards = mutation({
  handler: async (ctx) => {
    // Check if cards already exist
    const existingCards = await ctx.db.query("cards").first();
    if (existingCards) {
      return { seeded: false, reason: "cards_already_exist" };
    }

    // Insert all sample cards
    for (const card of SAMPLE_CARDS) {
      await ctx.db.insert("cards", {
        name: card.name,
        rarity: card.rarity as any,
        cost: card.cost,
        attack: card.attack,
        defense: card.defense,
        description: card.description,
      });
    }

    return { seeded: true, count: SAMPLE_CARDS.length };
  },
});

// Sell price ranges by rarity
const SELL_PRICES: Record<string, { min: number; max: number }> = {
  common: { min: 10, max: 30 },
  uncommon: { min: 30, max: 60 },
  rare: { min: 60, max: 90 },
  legendary: { min: 90, max: 120 },
  mythical: { min: 120, max: 150 },
  divine: { min: 150, max: 180 },
  prismatic: { min: 180, max: 210 },
  transcendent: { min: 210, max: 240 },
  holographic: { min: 240, max: 270 },
  exclusive: { min: 1000, max: 1150 },
};

// Pack definitions (same as shop.ts)
const PACK_DEFINITIONS: Record<string, { cardCount: number; rarityWeights: Record<string, number> }> = {
  small: {
    cardCount: 3,
    rarityWeights: {
      common: 70,
      uncommon: 25,
      rare: 5,
      legendary: 0,
      mythical: 0,
      divine: 0,
      prismatic: 0,
      transcendent: 0,
      holographic: 0,
      exclusive: 0,
    },
  },
  normal: {
    cardCount: 5,
    rarityWeights: {
      common: 55,
      uncommon: 30,
      rare: 12,
      legendary: 3,
      mythical: 0,
      divine: 0,
      prismatic: 0,
      transcendent: 0,
      holographic: 0,
      exclusive: 0,
    },
  },
  big: {
    cardCount: 7,
    rarityWeights: {
      common: 45,
      uncommon: 30,
      rare: 15,
      legendary: 8,
      mythical: 2,
      divine: 0,
      prismatic: 0,
      transcendent: 0,
      holographic: 0,
      exclusive: 0,
    },
  },
  premium: {
    cardCount: 10,
    rarityWeights: {
      common: 35,
      uncommon: 30,
      rare: 18,
      legendary: 10,
      mythical: 5,
      divine: 2,
      prismatic: 0,
      transcendent: 0,
      holographic: 0,
      exclusive: 0,
    },
  },
  deluxe: {
    cardCount: 15,
    rarityWeights: {
      common: 24.5,
      uncommon: 25,
      rare: 20,
      legendary: 15,
      mythical: 8,
      divine: 4,
      prismatic: 2,
      transcendent: 1,
      holographic: 0.5,
      exclusive: 0,
    },
  },
  cosmic: {
    cardCount: 20,
    rarityWeights: {
      common: 20,
      uncommon: 22,
      rare: 22,
      legendary: 16,
      mythical: 10,
      divine: 5,
      prismatic: 3,
      transcendent: 1.5,
      holographic: 0.5,
      exclusive: 0,
    },
  },
  metrolic: {
    cardCount: 25,
    rarityWeights: {
      common: 15,
      uncommon: 18,
      rare: 24,
      legendary: 18,
      mythical: 12,
      divine: 6,
      prismatic: 4,
      transcendent: 2,
      holographic: 1,
      exclusive: 0,
    },
  },
  exclusive: {
    cardCount: 30,
    rarityWeights: {
      common: 10,
      uncommon: 14,
      rare: 24,
      legendary: 20,
      mythical: 14,
      divine: 8,
      prismatic: 5,
      transcendent: 3,
      holographic: 1.5,
      exclusive: 0.5,
    },
  },
};

/// Helper: Roll rarity based on weights with luck multiplier
function rollRarity(weights: Record<string, number>, luckMultiplier: number = 1): string {
  // Apply luck multiplier to rare+ cards
  const adjustedWeights = { ...weights };
  const rareRarities = [
    "rare",
    "legendary",
    "mythical",
    "divine",
    "prismatic",
    "transcendent",
    "holographic",
    "exclusive",
  ];

  if (luckMultiplier > 1) {
    for (const rarity of rareRarities) {
      if (adjustedWeights[rarity]) {
        adjustedWeights[rarity] = Math.floor(adjustedWeights[rarity] * luckMultiplier);
      }
    }
  }

  const totalWeight = Object.values(adjustedWeights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;

  for (const [rarity, weight] of Object.entries(adjustedWeights)) {
    roll -= weight;
    if (roll <= 0) {
      return rarity;
    }
  }

  return "common";
}

// Helper: Calculate sell price for a card (deterministic based on seed)
function calculateSellPrice(rarity: string, seed: number): number {
  const priceRange = SELL_PRICES[rarity] ?? SELL_PRICES.common!;
  // Use seed for deterministic randomness
  const random = Math.abs(Math.sin(seed * 9999)) % 1;
  return Math.floor(priceRange.min + random * (priceRange.max - priceRange.min));
}

// Get user's inventory with card details
export const getUserInventory = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const inventoryItems = await ctx.db
      .query("inventory")
      .withIndex("by_userId", (q) => q.eq("userId", clerkId))
      .collect();

    // Expand cards by quantity (one entry per card instance)
    const cardsWithDetails: Array<{
      inventoryId: string;
      cardId: Id<"cards">;
      acquiredAt: number;
      card: {
        name: string;
        rarity: string;
        attack: number;
        defense: number;
        cost: number;
        description: string;
        imageUrl?: string;
      } | null;
    }> = [];

    for (const item of inventoryItems) {
      const card = await ctx.db.get(item.cardId);
      if (!card) continue;

      // Expand each inventory item by its quantity
      for (let i = 0; i < item.quantity; i++) {
        cardsWithDetails.push({
          inventoryId: `${item._id}:${i}`,
          cardId: item.cardId,
          acquiredAt: item.acquiredAt,
          card: {
            name: card.name,
            rarity: card.rarity,
            attack: card.attack,
            defense: card.defense,
            cost: card.cost,
            description: card.description ?? "",
            imageUrl: card.imageUrl,
          },
        });
      }
    }

    return cardsWithDetails.filter((item) => item.card !== null);
  },
});

// Get user's unopened packs
export const getUnopenedPacks = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    return user?.unopenedPacks ?? [];
  },
});

// Appraise cards (calculate sell values without selling)
// Returns one entry per card instance (expanded by quantity)
export const appraiseCards = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const inventoryItems = await ctx.db
      .query("inventory")
      .withIndex("by_userId", (q) => q.eq("userId", clerkId))
      .collect();

    const appraisals: Array<{
      inventoryId: string;
      instanceIndex: number;
      cardId: Id<"cards">;
      name: string;
      rarity: string;
      attack: number;
      defense: number;
      sellPrice: number;
    }> = [];

    for (const item of inventoryItems) {
      const card = await ctx.db.get(item.cardId);
      if (!card) continue;

      // Expand each inventory item by its quantity
      // Each instance gets a unique identifier (inventoryId + instanceIndex)
      for (let i = 0; i < item.quantity; i++) {
        // Use acquiredAt + instance index as seed for deterministic pricing
        const sellPrice = calculateSellPrice(card.rarity, item.acquiredAt + i);

        appraisals.push({
          inventoryId: `${item._id}:${i}`,
          instanceIndex: i,
          cardId: item.cardId,
          name: card.name,
          rarity: card.rarity,
          attack: card.attack,
          defense: card.defense,
          sellPrice,
        });
      }
    }

    return appraisals;
  },
});

// Open a pack from inventory
export const openPack = mutation({
  args: {
    clerkId: v.string(),
    packType: v.string(),
  },
  handler: async (ctx, { clerkId, packType }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const unopenedPacks = user.unopenedPacks ?? [];
    const packIndex = unopenedPacks.findIndex((p) => p.packType === packType && p.quantity > 0);

    if (packIndex === -1) {
      throw new Error("Pack not found in inventory");
    }

    const packDef = PACK_DEFINITIONS[packType];
    if (!packDef) {
      throw new Error("Invalid pack type");
    }

    // Get active luck boosts
    const now = Date.now();
    const activeBoosts = (user.luckBoosts ?? []).filter(
      (boost: { expiresAt: number; multiplier: number }) => boost.expiresAt > now
    );
    const luckMultiplier = activeBoosts.reduce(
      (max: number, boost: { multiplier: number }) => Math.max(max, boost.multiplier),
      1
    );

    // Get all cards grouped by rarity (cards table is small, single fetch is efficient)
    const allCards = await ctx.db.query("cards").collect();
    const cardsByRarity: Record<string, typeof allCards> = {};
    for (const card of allCards) {
      if (!cardsByRarity[card.rarity]) {
        cardsByRarity[card.rarity] = [];
      }
      cardsByRarity[card.rarity]!.push(card);
    }

    // Pre-fetch user's existing inventory to batch lookups
    const existingInventory = await ctx.db
      .query("inventory")
      .withIndex("by_userId", (q) => q.eq("userId", clerkId))
      .collect();

    const inventoryMap = new Map(
      existingInventory.map((inv) => [inv.cardId.toString(), inv])
    );

    // Generate cards
    const generatedCards: Array<{
      cardId: Id<"cards">;
      name: string;
      rarity: string;
    }> = [];

    // Track cards to add (aggregate quantities before writing)
    const cardsToAdd = new Map<string, { cardId: Id<"cards">; quantity: number }>();

    for (let i = 0; i < packDef.cardCount; i++) {
      const rarity = rollRarity(packDef.rarityWeights, luckMultiplier);
      const cardsOfRarity = cardsByRarity[rarity];

      if (cardsOfRarity && cardsOfRarity.length > 0) {
        const randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)]!;
        generatedCards.push({
          cardId: randomCard._id,
          name: randomCard.name,
          rarity: randomCard.rarity,
        });

        // Aggregate cards to add
        const cardIdStr = randomCard._id.toString();
        const existing = cardsToAdd.get(cardIdStr);
        if (existing) {
          existing.quantity += 1;
        } else {
          cardsToAdd.set(cardIdStr, { cardId: randomCard._id, quantity: 1 });
        }
      }
    }

    // Batch update inventory
    for (const [cardIdStr, { cardId, quantity }] of cardsToAdd) {
      const existingInv = inventoryMap.get(cardIdStr);
      if (existingInv) {
        await ctx.db.patch(existingInv._id, {
          quantity: existingInv.quantity + quantity,
        });
      } else {
        await ctx.db.insert("inventory", {
          userId: clerkId,
          cardId,
          quantity,
          acquiredAt: now,
        });
      }
    }

    // Update unopened packs (decrement quantity or remove)
    const updatedPacks = unopenedPacks.map((p, idx) => {
      if (idx === packIndex) {
        return { ...p, quantity: p.quantity - 1 };
      }
      return p;
    }).filter((p) => p.quantity > 0);

    await ctx.db.patch(user._id, {
      unopenedPacks: updatedPacks,
    });

    // Update daily quest progress for pack opening
    await ctx.scheduler.runAfter(0, internal.dailyRewards.updateQuestProgress, {
      clerkId,
      questType: "open_pack",
      amount: 1,
    });

    // Update daily quest progress for card rarities obtained
    const rarityCounts: Record<string, number> = {};
    for (const card of generatedCards) {
      rarityCounts[card.rarity] = (rarityCounts[card.rarity] ?? 0) + 1;
    }

    if (rarityCounts["common"]) {
      await ctx.scheduler.runAfter(0, internal.dailyRewards.updateQuestProgress, {
        clerkId,
        questType: "get_common",
        amount: rarityCounts["common"],
      });
    }
    if (rarityCounts["uncommon"]) {
      await ctx.scheduler.runAfter(0, internal.dailyRewards.updateQuestProgress, {
        clerkId,
        questType: "get_uncommon",
        amount: rarityCounts["uncommon"],
      });
    }
    if (rarityCounts["rare"]) {
      await ctx.scheduler.runAfter(0, internal.dailyRewards.updateQuestProgress, {
        clerkId,
        questType: "get_rare",
        amount: rarityCounts["rare"],
      });
    }

    // Check for [EXCLUSIVER] tag: 3+ exclusive cards in inventory
    if (rarityCounts["exclusive"]) {
      await ctx.scheduler.runAfter(0, internal.chatTags.checkAndGrantExclusiverTag, {
        clerkId,
      });
    }

    // Check for [1ST] leaderboard tag (cards changed)
    await ctx.scheduler.runAfter(0, internal.chatTags.checkAndGrantLeaderboardTag, {
      clerkId,
    });

    return {
      success: true,
      cards: generatedCards,
    };
  },
});

// Sell cards from inventory
// inventoryIds are now in format "inventoryId:instanceIndex"
export const sellCards = mutation({
  args: {
    clerkId: v.string(),
    inventoryIds: v.array(v.string()),
  },
  handler: async (ctx, { clerkId, inventoryIds }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Group by actual inventory ID and count how many to sell from each
    const sellCounts = new Map<Id<"inventory">, { count: number; instanceIndices: number[] }>();

    for (const compositeId of inventoryIds) {
      const [inventoryIdStr, instanceIndexStr] = compositeId.split(":");
      const inventoryId = inventoryIdStr as Id<"inventory">;
      const instanceIndex = parseInt(instanceIndexStr ?? "0", 10);

      const existing = sellCounts.get(inventoryId);
      if (existing) {
        existing.count += 1;
        existing.instanceIndices.push(instanceIndex);
      } else {
        sellCounts.set(inventoryId, { count: 1, instanceIndices: [instanceIndex] });
      }
    }

    let totalEarned = 0;
    const now = Date.now();

    for (const [inventoryId, { count, instanceIndices }] of sellCounts) {
      const inventoryItem = await ctx.db.get(inventoryId);
      if (!inventoryItem || inventoryItem.userId !== clerkId) {
        throw new Error("Invalid inventory item");
      }

      if (inventoryItem.quantity < count) {
        throw new Error("Insufficient quantity");
      }

      const card = await ctx.db.get(inventoryItem.cardId);
      if (!card) {
        throw new Error("Card not found");
      }

      // Calculate sell price for each instance being sold
      for (const instanceIndex of instanceIndices) {
        const pricePerCard = calculateSellPrice(card.rarity, inventoryItem.acquiredAt + instanceIndex);
        totalEarned += pricePerCard;
      }

      // Update inventory
      const newQuantity = inventoryItem.quantity - count;
      if (newQuantity <= 0) {
        await ctx.db.delete(inventoryId);
      } else {
        await ctx.db.patch(inventoryId, {
          quantity: newQuantity,
        });
      }
    }

    // Add coins to user
    await ctx.db.patch(user._id, {
      pattyCoins: (user.pattyCoins ?? 0) + totalEarned,
    });

    // Log transaction
    await ctx.db.insert("transactions", {
      userId: clerkId,
      type: "card_sell",
      amount: totalEarned,
      metadata: { salesCount: inventoryIds.length },
      timestamp: now,
    });

    // Update daily quest progress for selling cards
    await ctx.scheduler.runAfter(0, internal.dailyRewards.updateQuestProgress, {
      clerkId,
      questType: "sell_cards",
      amount: inventoryIds.length,
    });

    // Check for [INVERTED] tag: sell 500+ cards at once
    if (inventoryIds.length >= 500) {
      await ctx.scheduler.runAfter(0, internal.chatTags.grantTag, {
        clerkId,
        tag: "INVERTED",
      });
    }

    // Check for [1ST] leaderboard tag (coins changed)
    await ctx.scheduler.runAfter(0, internal.chatTags.checkAndGrantLeaderboardTag, {
      clerkId,
    });

    return {
      success: true,
      earned: totalEarned,
      newBalance: (user.pattyCoins ?? 0) + totalEarned,
    };
  },
});

// Set held card
export const setHeldCard = mutation({
  args: {
    clerkId: v.string(),
    cardId: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, cardId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      heldCardId: cardId ?? undefined,
    });

    return { success: true };
  },
});

// Get held card details
export const getHeldCard = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user?.heldCardId) {
      return null;
    }

    // Find the card in inventory
    const inventoryItem = await ctx.db
      .query("inventory")
      .withIndex("by_userId", (q) => q.eq("userId", clerkId))
      .collect();

    for (const item of inventoryItem) {
      if (item.cardId.toString() === user.heldCardId) {
        const card = await ctx.db.get(item.cardId);
        if (card) {
          return {
            cardId: item.cardId,
            name: card.name,
            rarity: card.rarity,
            attack: card.attack,
            defense: card.defense,
          };
        }
      }
    }

    return null;
  },
});
