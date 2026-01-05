// Synthwave color palette
export const COLORS = {
  neonPink: '#ff00ff',
  neonCyan: '#00ffff',
  neonPurple: '#8b00ff',
  neonOrange: '#ff6600',
  darkPurple: '#1a0a2e',
  gridPink: '#ff1493',
  gridCyan: '#00e5ff',
  sunOrange: '#ff4500',
  sunYellow: '#ffd700',
}

// Physics constants
export const PHYSICS = {
  playerSpeed: 8,
  playerJumpForce: 8,
  gravity: { x: 0, y: -20, z: 0 },
  linearDamping: 4,
  angularDamping: 0.5,
}

// Camera constants
export const CAMERA = {
  distance: 12,
  height: 6,
  smoothness: 0.08,
}

// Shop constants
export const SHOP = {
  interactionDistance: 5,
  npcPosition: [20, 0, 20] as [number, number, number],
}

// Pack prices in Pattycoins
export const PACK_PRICES = {
  small: 30,
  normal: 60,
  big: 90,
  premium: 120,
  deluxe: 150,
} as const

// Sell NPC constants
export const SELL_NPC = {
  interactionDistance: 5,
  npcPosition: [-20, 0, 20] as [number, number, number],
}

// Card sell prices by rarity (Pattycoins)
export const SELL_PRICES: Record<string, { min: number; max: number }> = {
  common: { min: 10, max: 30 },
  uncommon: { min: 30, max: 60 },
  rare: { min: 60, max: 90 },
  legendary: { min: 90, max: 120 },
  mythical: { min: 120, max: 150 },
  divine: { min: 150, max: 180 },
  prismatic: { min: 180, max: 210 },
  transcendent: { min: 210, max: 240 },
  holographic: { min: 240, max: 270 },
}

// Battle NPC constants
export const BATTLE_NPC = {
  interactionDistance: 5,
  npcPosition: [-25, 0, 0] as [number, number, number],
  entryCost: 15,
  minCards: 3,
  rewardMin: 30,
  rewardMax: 50,
  packChance: 0.15, // 15% chance to win a pack
}

// PvP Battle constants
export const PVP_BATTLE = {
  requestExpiryMs: 30000, // 30 seconds to accept
  minCards: 3,
  rewardMin: 30,
  rewardMax: 50,
  packChance: 0.15,
}

// Multiplayer constants
export const MULTIPLAYER = {
  maxPlayers: 15,
  positionUpdateRate: 100, // ms between position updates
  chatMaxLength: 500,
  interpolationSpeed: 0.1, // lerp factor for remote player movement
  defaultMapId: 'main',
}
