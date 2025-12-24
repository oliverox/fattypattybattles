import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Sample cards for seeding the database
const SAMPLE_CARDS = [
  // Common cards (10)
  { name: "Patty Slapper", rarity: "common", cost: 1, attack: 2, defense: 1, description: "A basic slap attack" },
  { name: "Grease Shield", rarity: "common", cost: 1, attack: 1, defense: 3, description: "Blocks with burger grease" },
  { name: "Fry Fighter", rarity: "common", cost: 1, attack: 2, defense: 2, description: "Crispy combat skills" },
  { name: "Bun Basher", rarity: "common", cost: 2, attack: 3, defense: 1, description: "Soft but deadly" },
  { name: "Pickle Poker", rarity: "common", cost: 1, attack: 2, defense: 1, description: "Sour strikes" },
  { name: "Ketchup Kid", rarity: "common", cost: 1, attack: 1, defense: 2, description: "Red and ready" },
  { name: "Mustard Minion", rarity: "common", cost: 1, attack: 2, defense: 1, description: "Yellow menace" },
  { name: "Onion Ring Ranger", rarity: "common", cost: 2, attack: 2, defense: 2, description: "Crispy defender" },
  { name: "Lettuce Lancer", rarity: "common", cost: 1, attack: 1, defense: 2, description: "Fresh fighter" },
  { name: "Tomato Tosser", rarity: "common", cost: 1, attack: 2, defense: 1, description: "Juicy projectiles" },

  // Uncommon cards (8)
  { name: "Double Patty", rarity: "uncommon", cost: 3, attack: 4, defense: 3, description: "Twice the power" },
  { name: "Cheese Champion", rarity: "uncommon", cost: 2, attack: 3, defense: 3, description: "Melty mayhem" },
  { name: "Bacon Blaster", rarity: "uncommon", cost: 3, attack: 5, defense: 2, description: "Sizzling strikes" },
  { name: "Shake Shaker", rarity: "uncommon", cost: 2, attack: 2, defense: 4, description: "Thick defense" },
  { name: "Cola Crusher", rarity: "uncommon", cost: 3, attack: 4, defense: 2, description: "Fizzy fury" },
  { name: "Napkin Ninja", rarity: "uncommon", cost: 2, attack: 3, defense: 2, description: "Clean cuts" },
  { name: "Tray Warrior", rarity: "uncommon", cost: 3, attack: 3, defense: 4, description: "Serves justice" },
  { name: "Straw Striker", rarity: "uncommon", cost: 2, attack: 4, defense: 1, description: "Piercing attacks" },

  // Rare cards (6)
  { name: "Triple Stack", rarity: "rare", cost: 4, attack: 6, defense: 4, description: "Tower of power" },
  { name: "Golden Fries", rarity: "rare", cost: 4, attack: 5, defense: 5, description: "Perfectly crispy" },
  { name: "Secret Sauce", rarity: "rare", cost: 3, attack: 4, defense: 5, description: "Mystery ingredients" },
  { name: "Drive-Thru Dragon", rarity: "rare", cost: 5, attack: 7, defense: 3, description: "Fast and fierce" },
  { name: "Grill Master", rarity: "rare", cost: 4, attack: 5, defense: 5, description: "Flame wielder" },
  { name: "Ice Cream Wizard", rarity: "rare", cost: 4, attack: 4, defense: 6, description: "Frozen magic" },

  // Legendary cards (4)
  { name: "The Big Patty", rarity: "legendary", cost: 6, attack: 8, defense: 6, description: "Legendary burger boss" },
  { name: "Fryer Phoenix", rarity: "legendary", cost: 6, attack: 9, defense: 5, description: "Rises from hot oil" },
  { name: "Condiment King", rarity: "legendary", cost: 5, attack: 7, defense: 7, description: "Rules all sauces" },
  { name: "Mega Meal", rarity: "legendary", cost: 7, attack: 8, defense: 8, description: "Complete combo" },

  // Mythical cards (3)
  { name: "Cosmic Burger", rarity: "mythical", cost: 8, attack: 10, defense: 8, description: "From another dimension" },
  { name: "Eternal Flame Grill", rarity: "mythical", cost: 7, attack: 9, defense: 9, description: "Never stops cooking" },
  { name: "The Original Recipe", rarity: "mythical", cost: 8, attack: 8, defense: 10, description: "Ancient secrets" },

  // Divine cards (2)
  { name: "Burger Deity", rarity: "divine", cost: 9, attack: 11, defense: 10, description: "Divine deliciousness" },
  { name: "Fast Food Titan", rarity: "divine", cost: 10, attack: 12, defense: 9, description: "Titan of taste" },

  // Prismatic cards (2)
  { name: "Rainbow Shake", rarity: "prismatic", cost: 9, attack: 10, defense: 11, description: "All flavors combined" },
  { name: "Holographic Menu", rarity: "prismatic", cost: 10, attack: 11, defense: 11, description: "Every item at once" },

  // Transcendent cards (1)
  { name: "The Perfect Order", rarity: "transcendent", cost: 12, attack: 13, defense: 12, description: "Flawless execution" },

  // Secret cards (1)
  { name: "???", rarity: "secret", cost: 15, attack: 15, defense: 15, description: "Unknown power" },
] as const;

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
  secret: { min: 240, max: 270 },
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
      secret: 0,
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
      secret: 0,
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
      secret: 0,
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
      secret: 0,
    },
  },
  deluxe: {
    cardCount: 15,
    rarityWeights: {
      common: 25,
      uncommon: 25,
      rare: 20,
      legendary: 15,
      mythical: 8,
      divine: 4,
      prismatic: 2,
      transcendent: 1,
      secret: 0,
    },
  },
};

// Helper: Roll rarity based on weights
function rollRarity(weights: Record<string, number>): string {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;

  for (const [rarity, weight] of Object.entries(weights)) {
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

    const cardsWithDetails = await Promise.all(
      inventoryItems.map(async (item) => {
        const card = await ctx.db.get(item.cardId);
        return {
          inventoryId: item._id,
          cardId: item.cardId,
          quantity: item.quantity,
          acquiredAt: item.acquiredAt,
          card: card ? {
            name: card.name,
            rarity: card.rarity,
            attack: card.attack,
            defense: card.defense,
            cost: card.cost,
            description: card.description,
            imageUrl: card.imageUrl,
          } : null,
        };
      })
    );

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

    // Get all cards grouped by rarity
    const allCards = await ctx.db.query("cards").collect();
    const cardsByRarity: Record<string, typeof allCards> = {};
    for (const card of allCards) {
      if (!cardsByRarity[card.rarity]) {
        cardsByRarity[card.rarity] = [];
      }
      cardsByRarity[card.rarity]!.push(card);
    }

    // Generate cards
    const now = Date.now();
    const generatedCards: Array<{
      cardId: Id<"cards">;
      name: string;
      rarity: string;
    }> = [];

    for (let i = 0; i < packDef.cardCount; i++) {
      const rarity = rollRarity(packDef.rarityWeights);
      const cardsOfRarity = cardsByRarity[rarity];

      if (cardsOfRarity && cardsOfRarity.length > 0) {
        const randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)]!;
        generatedCards.push({
          cardId: randomCard._id,
          name: randomCard.name,
          rarity: randomCard.rarity,
        });

        // Add to inventory
        const existingInventory = await ctx.db
          .query("inventory")
          .withIndex("by_userId_cardId", (q) =>
            q.eq("userId", clerkId).eq("cardId", randomCard._id)
          )
          .first();

        if (existingInventory) {
          await ctx.db.patch(existingInventory._id, {
            quantity: existingInventory.quantity + 1,
          });
        } else {
          await ctx.db.insert("inventory", {
            userId: clerkId,
            cardId: randomCard._id,
            quantity: 1,
            acquiredAt: now,
          });
        }
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
