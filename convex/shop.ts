import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Pack definitions with rarity weights
const PACK_DEFINITIONS = {
  small: {
    name: "Small Pack",
    description: "Contains 3 cards with basic rarities",
    cost: 30,
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
    name: "Normal Pack",
    description: "Contains 5 cards with better odds",
    cost: 60,
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
    name: "Big Pack",
    description: "Contains 7 cards with good odds",
    cost: 90,
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
    name: "Premium Pack",
    description: "Contains 10 cards with great odds",
    cost: 120,
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
    name: "Deluxe Pack",
    description: "Contains 15 cards with amazing odds!",
    cost: 250,
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
    name: "Cosmic Pack",
    description: "Contains 20 cards with cosmic luck!",
    cost: 500,
    cardCount: 20,
    rarityWeights: {
      common: 19.95,
      uncommon: 22,
      rare: 22,
      legendary: 16,
      mythical: 10,
      divine: 5,
      prismatic: 3,
      transcendent: 1.5,
      holographic: 0.5,
      exclusive: 0.05,
    },
  },
  metrolic: {
    name: "Metrolic Pack",
    description: "Contains 25 cards with enhanced cosmic luck!",
    cost: 5000,
    cardCount: 25,
    rarityWeights: {
      common: 14.9,
      uncommon: 18,
      rare: 24,
      legendary: 18,
      mythical: 12,
      divine: 6,
      prismatic: 4,
      transcendent: 2,
      holographic: 1,
      exclusive: 0.1,
    },
  },
  exclusive: {
    name: "Exclusive Pack",
    description: "Contains 30 cards with the best odds + exclusive cards!",
    cost: 10000,
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
} as const;

type PackType = keyof typeof PACK_DEFINITIONS;
type Rarity = keyof typeof PACK_DEFINITIONS.small.rarityWeights;

// Luck boost definitions
const LUCK_BOOST_DEFINITIONS = [
  {
    id: "lucky_charm",
    name: "Lucky Charm",
    description: "1.5x better odds for rare+ cards for 1 hour",
    cost: 50,
    multiplier: 1.5,
    durationHours: 1,
  },
  {
    id: "fortune_cookie",
    name: "Fortune Cookie",
    description: "2x better odds for rare+ cards for 30 minutes",
    cost: 75,
    multiplier: 2,
    durationHours: 0.5,
  },
  {
    id: "golden_horseshoe",
    name: "Golden Horseshoe",
    description: "3x better odds for rare+ cards for 15 minutes",
    cost: 100,
    multiplier: 3,
    durationHours: 0.25,
  },
] as const;

// Pack validator for shop
const shopPackValidator = v.object({
  type: v.string(),
  name: v.string(),
  description: v.string(),
  cost: v.number(),
  cardCount: v.number(),
  rarityWeights: v.object({
    common: v.number(),
    uncommon: v.number(),
    rare: v.number(),
    legendary: v.number(),
    mythical: v.number(),
    divine: v.number(),
    prismatic: v.number(),
    transcendent: v.number(),
    holographic: v.number(),
    exclusive: v.number(),
  }),
});

// Get all available packs
export const getShopPacks = query({
  args: {},
  returns: v.array(shopPackValidator),
  handler: async () => {
    return Object.entries(PACK_DEFINITIONS).map(([type, pack]) => ({
      type,
      ...pack,
    }));
  },
});

// Get user's current balance
export const getUserBalance = query({
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

// Luck boost validator
const luckBoostValidator = v.object({
  id: v.string(),
  name: v.string(),
  description: v.string(),
  cost: v.number(),
  multiplier: v.number(),
  durationHours: v.number(),
});

// Get luck boosts available for purchase
export const getLuckBoosts = query({
  args: {},
  returns: v.array(luckBoostValidator),
  handler: async () => {
    return [...LUCK_BOOST_DEFINITIONS];
  },
});

// Get user's active luck boosts
export const getUserLuckBoosts = query({
  args: { clerkId: v.string() },
  returns: v.array(v.object({
    type: v.string(),
    multiplier: v.number(),
    expiresAt: v.number(),
  })),
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user?.luckBoosts) return [];

    const now = Date.now();
    return user.luckBoosts.filter((boost) => boost.expiresAt > now);
  },
});

// Generated card validator
const generatedCardValidator = v.object({
  cardId: v.id("cards"),
  name: v.string(),
  rarity: v.string(),
});

// Purchase a pack
export const purchasePack = mutation({
  args: {
    clerkId: v.string(),
    packType: v.string(),
    autoOpen: v.optional(v.boolean()), // If false, save to inventory instead of opening
  },
  returns: v.object({
    success: v.boolean(),
    savedToInventory: v.optional(v.boolean()),
    cards: v.array(generatedCardValidator),
    newBalance: v.number(),
  }),
  handler: async (ctx, { clerkId, packType, autoOpen = true }) => {
    // Get pack definition
    const pack = PACK_DEFINITIONS[packType as PackType];
    if (!pack) {
      throw new Error("Invalid pack type");
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const currentBalance = user.pattyCoins ?? 0;
    if (currentBalance < pack.cost) {
      throw new Error("Insufficient Pattycoins");
    }

    const now = Date.now();

    // If not auto-opening, save to unopened packs
    if (!autoOpen) {
      const unopenedPacks = user.unopenedPacks ?? [];
      const existingPackIndex = unopenedPacks.findIndex(p => p.packType === packType);

      let updatedPacks;
      if (existingPackIndex >= 0) {
        // Increment quantity of existing pack type
        updatedPacks = unopenedPacks.map((p, i) =>
          i === existingPackIndex ? { ...p, quantity: p.quantity + 1 } : p
        );
      } else {
        // Add new pack type
        updatedPacks = [...unopenedPacks, { packType, quantity: 1, acquiredAt: now }];
      }

      // Deduct cost and save pack
      await ctx.db.patch(user._id, {
        pattyCoins: currentBalance - pack.cost,
        unopenedPacks: updatedPacks,
      });

      // Log transaction
      await ctx.db.insert("transactions", {
        userId: clerkId,
        type: "pack_purchase",
        amount: -pack.cost,
        metadata: { packType, savedToInventory: true },
        timestamp: now,
      });

      return {
        success: true,
        savedToInventory: true,
        cards: [],
        newBalance: currentBalance - pack.cost,
      };
    }

    // Get active luck boosts
    const activeBoosts = (user.luckBoosts ?? []).filter(
      (boost) => boost.expiresAt > now
    );
    const luckMultiplier = activeBoosts.reduce(
      (max, boost) => Math.max(max, boost.multiplier),
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

    // Generate cards based on rarity weights
    const generatedCards: Array<{
      cardId: Id<"cards">;
      name: string;
      rarity: string;
    }> = [];

    // Track cards to add (aggregate quantities before writing)
    const cardsToAdd = new Map<string, { cardId: Id<"cards">; quantity: number }>();

    for (let i = 0; i < pack.cardCount; i++) {
      const rarity = rollRarity(pack.rarityWeights, luckMultiplier);
      const cardsOfRarity = cardsByRarity[rarity];

      if (cardsOfRarity && cardsOfRarity.length > 0) {
        const randomCard =
          cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)]!;
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

    // Deduct cost
    await ctx.db.patch(user._id, {
      pattyCoins: currentBalance - pack.cost,
    });

    // Log transaction
    await ctx.db.insert("transactions", {
      userId: clerkId,
      type: "pack_purchase",
      amount: -pack.cost,
      metadata: { packType, cardsReceived: generatedCards.length },
      timestamp: now,
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

    return {
      success: true,
      cards: generatedCards,
      newBalance: currentBalance - pack.cost,
    };
  },
});

// Purchase a luck boost
export const purchaseLuckBoost = mutation({
  args: {
    clerkId: v.string(),
    boostId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    newBalance: v.number(),
    expiresAt: v.number(),
  }),
  handler: async (ctx, { clerkId, boostId }) => {
    // Get boost definition
    const boost = LUCK_BOOST_DEFINITIONS.find((b) => b.id === boostId);
    if (!boost) {
      throw new Error("Invalid boost type");
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const currentBalance = user.pattyCoins ?? 0;
    if (currentBalance < boost.cost) {
      throw new Error("Insufficient Pattycoins");
    }

    const now = Date.now();
    const expiresAt = now + boost.durationHours * 60 * 60 * 1000;

    // Add boost to user
    const currentBoosts = (user.luckBoosts ?? []).filter(
      (b) => b.expiresAt > now
    );
    const newBoosts = [
      ...currentBoosts,
      {
        type: boost.id,
        multiplier: boost.multiplier,
        expiresAt,
      },
    ];

    // Update user
    await ctx.db.patch(user._id, {
      pattyCoins: currentBalance - boost.cost,
      luckBoosts: newBoosts,
    });

    // Log transaction
    await ctx.db.insert("transactions", {
      userId: clerkId,
      type: "pack_purchase", // Using pack_purchase as closest match
      amount: -boost.cost,
      metadata: { boostId, expiresAt },
      timestamp: now,
    });

    return {
      success: true,
      newBalance: currentBalance - boost.cost,
      expiresAt,
    };
  },
});

// Helper function to roll a rarity based on weights
function rollRarity(
  weights: Record<Rarity, number>,
  luckMultiplier: number
): Rarity {
  // Apply luck multiplier to rare+ cards
  const adjustedWeights = { ...weights };
  const rareRarities: Rarity[] = [
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
      adjustedWeights[rarity] = Math.floor(
        adjustedWeights[rarity] * luckMultiplier
      );
    }
  }

  // Calculate total weight
  const totalWeight = Object.values(adjustedWeights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;

  // Find the rarity
  for (const [rarity, weight] of Object.entries(adjustedWeights)) {
    roll -= weight;
    if (roll <= 0) {
      return rarity as Rarity;
    }
  }

  return "common";
}
