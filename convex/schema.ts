import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users - Clerk-based authentication
  users: defineTable({
    clerkId: v.optional(v.string()), // Clerk user ID (optional for migration)
    email: v.string(),
    // Profile fields
    username: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"))),
    avatarConfig: v.optional(v.object({
      skinColor: v.string(),
      hairStyle: v.string(),
      hairColor: v.string(),
    })),
    pattyCoins: v.optional(v.number()),
    luckBoosts: v.optional(v.array(v.object({
      type: v.string(),
      multiplier: v.number(),
      expiresAt: v.number(),
    }))),
    unopenedPacks: v.optional(v.array(v.object({
      packType: v.string(),
      quantity: v.number(),
      acquiredAt: v.number(),
    }))),
    heldCardId: v.optional(v.string()),
    battleWins: v.optional(v.number()),
    battleLosses: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    lastActiveAt: v.optional(v.number()),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_username", ["username"]),

  // Player Positions - real-time world state for multiplayer
  playerPositions: defineTable({
    userId: v.string(),
    username: v.string(),
    avatarConfig: v.optional(v.object({
      skinColor: v.string(),
      hairStyle: v.string(),
      hairColor: v.string(),
    })),
    x: v.number(),
    y: v.number(),
    z: v.number(),
    rotation: v.number(),
    mapId: v.string(),
    isOnline: v.boolean(),
    lastUpdate: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_mapId", ["mapId", "isOnline"]),

  // Chat Messages - real-time multiplayer chat
  chatMessages: defineTable({
    userId: v.string(),
    username: v.string(),
    message: v.string(),
    mapId: v.string(),
    timestamp: v.number(),
  })
    .index("by_mapId", ["mapId", "timestamp"]),

  // Cards - master card definitions
  cards: defineTable({
    name: v.string(),
    rarity: v.union(
      v.literal("common"),
      v.literal("uncommon"),
      v.literal("rare"),
      v.literal("legendary"),
      v.literal("mythical"),
      v.literal("divine"),
      v.literal("prismatic"),
      v.literal("transcendent"),
      v.literal("secret"),
      v.literal("admin")
    ),
    cost: v.number(),
    attack: v.number(),
    defense: v.number(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).index("by_rarity", ["rarity"]),

  // Player Inventory - cards owned by players
  inventory: defineTable({
    userId: v.string(),
    cardId: v.id("cards"),
    quantity: v.number(),
    acquiredAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_cardId", ["userId", "cardId"]),

  // Transactions - economy audit trail
  transactions: defineTable({
    userId: v.string(),
    type: v.union(
      v.literal("pack_purchase"),
      v.literal("card_sell"),
      v.literal("battle_reward"),
      v.literal("admin_grant")
    ),
    amount: v.number(),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  }).index("by_userId", ["userId"]),

  // Shop Packs - available card pack types
  shopPacks: defineTable({
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
      secret: v.number(),
    }),
  }),

  // Luck Shop - available luck boost types
  luckShop: defineTable({
    name: v.string(),
    description: v.string(),
    cost: v.number(),
    multiplier: v.number(),
    durationHours: v.number(),
  }),

  // Battles - battle records (post-MVP)
  battles: defineTable({
    player1Id: v.string(),
    player2Id: v.string(),
    winnerId: v.optional(v.string()),
    player1Deck: v.array(v.id("cards")),
    player2Deck: v.array(v.id("cards")),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    battleLog: v.optional(v.array(v.any())),
  })
    .index("by_player1Id", ["player1Id"])
    .index("by_player2Id", ["player2Id"]),
});
