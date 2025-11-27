// CONSTANTS (XP, HEALTH, HUNGER)

export const XP_REWARD = {
  latwy: 25,
  sredni: 50,
  trudny: 100,
};

export const HUNGER_LOSS = {
  latwy: 0.05,
  sredni: 0.1,
  trudny: 0.2,
};

export const HEALTH_GAIN = {
  latwy: 0.05,
  sredni: 0.1,
  trudny: 0.2,
};

export const LEVELS = {
  1: { maxHealth: 300, maxHunger: 250, maxXp: 300 },
  2: { maxHealth: 350, maxHunger: 300, maxXp: 450 },
  3: { maxHealth: 400, maxHunger: 350, maxXp: 650 },
  4: { maxHealth: 450, maxHunger: 400, maxXp: 950 },
  5: { maxHealth: 500, maxHunger: 450, maxXp: 1200 },
  6: { maxHealth: 550, maxHunger: 500, maxXp: 1500 },
  7: { maxHealth: 650, maxHunger: 600, maxXp: 1900 },
};

export function xpRequiredForLevel(level) {
  return LEVELS[level]?.maxXp ?? 100;
}
