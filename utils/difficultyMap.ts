export const difficultyToBackend = {
  Łatwy: 'latwy',
  Średni: 'sredni',
  Trudny: 'trudny',
} as const;

export const difficultyFromBackend = {
  latwy: 'Łatwy',
  sredni: 'Średni',
  trudny: 'Trudny',
} as const;

export type DifficultyBackend = keyof typeof difficultyFromBackend;
export type DifficultyFrontend = keyof typeof difficultyToBackend;
