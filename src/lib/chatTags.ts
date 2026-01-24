export const CHAT_TAG_COLORS: Record<string, string> = {
  OWNER: "#FF0000",
  DEV: "#800080",
  ADMIN: "#FFA500",
  INSPIRER: "#FF69B4",
  VIP: "#FFD700",
  INVERTED: "#FFFFFF",
  DAILY: "#00FF00",
  "1ST": "#FFD700",
  EXCLUSIVER: "#FF00FF",
}

export function getTagDisplay(tag: string): string {
  return `[${tag}]`
}

export function getTagColor(tag: string): string {
  return CHAT_TAG_COLORS[tag] ?? "#FFFFFF"
}
