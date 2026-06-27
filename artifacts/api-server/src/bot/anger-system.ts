import { ANGER_TRIGGERS, CALM_TRIGGERS } from "./personality.js";

const angerMap = new Map<string, number>();

export function getAnger(userId: string): number {
  return angerMap.get(userId) ?? 0;
}

export function updateAnger(userId: string, message: string): number {
  let anger = getAnger(userId);

  const lower = message.toLowerCase();

  for (const trigger of ANGER_TRIGGERS) {
    if (lower.includes(trigger)) {
      anger = Math.min(10, anger + 2);
      break;
    }
  }

  for (const calm of CALM_TRIGGERS) {
    if (lower.includes(calm)) {
      anger = Math.max(0, anger - 1);
      break;
    }
  }

  angerMap.set(userId, anger);
  return anger;
}

export function increaseAnger(userId: string, amount = 1): number {
  const anger = Math.min(10, getAnger(userId) + amount);
  angerMap.set(userId, anger);
  return anger;
}

export function resetAnger(userId: string): void {
  angerMap.set(userId, 0);
}

export function getAngerLabel(anger: number): "calm" | "warning" | "furious" {
  if (anger <= 3) return "calm";
  if (anger <= 6) return "warning";
  return "furious";
}
