// Profanity filter for usernames and chat messages (client-side)

const BAD_WORDS = [
  "fuck", "shit", "ass", "bitch", "dick", "cock", "pussy", "cunt",
  "fag", "faggot", "nigger", "nigga", "retard", "whore", "slut",
  "f u c k", "s h i t", "b i t c h", "n i g g a", "n i g g e r",
  "f4ck", "sh1t", "b1tch", "d1ck", "c0ck", "fuk", "fuq",
];

export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
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
