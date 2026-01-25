// Profanity filter for usernames and chat messages

const BAD_WORDS = [
  // Common profanity (keeping it minimal but effective)
  "fuck", "shit", "ass", "bitch", "dick", "cock", "pussy", "cunt",
  "fag", "faggot", "nigger", "nigga", "retard", "whore", "slut",
  // Variations
  "f u c k", "s h i t", "b i t c h", "n i g g a", "n i g g e r",
  // Leetspeak common
  "f4ck", "sh1t", "b1tch", "d1ck", "c0ck", "fuk", "fuq",
];

// Check if text contains profanity
export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  // Remove common substitutions
  const normalized = lower
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/@/g, "a")
    .replace(/\$/g, "s");

  return BAD_WORDS.some((word) =>
    lower.includes(word) || normalized.includes(word)
  );
}

// Censor profanity in text (for display purposes if needed)
export function censorProfanity(text: string): string {
  let result = text;
  const lower = text.toLowerCase();

  for (const word of BAD_WORDS) {
    const regex = new RegExp(word, "gi");
    result = result.replace(regex, "*".repeat(word.length));
  }

  return result;
}
